const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

// Expense Schema
const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  categoryId: { type: String, required: true },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'expenses' });

// Category Schema
const categorySchema = new mongoose.Schema({
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  icon: { type: String, default: '📦' },
  color: { type: String, default: '#BDC3C7' },
  createdAt: { type: Date, default: Date.now }
},{_id:true});

// UserData Schema (stores budget and settings)
const userDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  budget: { type: Number, default: 0 },
  categories: [categorySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const UserData = mongoose.model('UserData', userDataSchema);

// Default categories
const defaultCategories = [
  { name: 'Food & Dining', icon: '🍔', color: '#FF6B6B' },
  { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { name: 'Shopping', icon: '🛒', color: '#45B7D1' },
  { name: 'Entertainment', icon: '🎬', color: '#96CEB4' },
  { name: 'Bills & Utilities', icon: '💡', color: '#FFEAA7' },
  { name: 'Health', icon: '💊', color: '#DDA0DD' },
  { name: 'Education', icon: '📚', color: '#98D8C8' },
  { name: 'Travel', icon: '✈️', color: '#F7DC6F' },
  { name: 'Other', icon: '📦', color: '#BDC3C7' }
];

// Routes

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({ email, password, name });
    await user.save();

    // Create default user data with categories
    const userData = new UserData({
      userId: user._id,
      budget: 0,
      categories: defaultCategories
    });
    await userData.save();

    res.status(201).json({ 
      message: 'User created successfully',
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ 
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Data (budget and categories)
app.get('/api/user/:userId/data', async (req, res) => {
  try {
    const userData = await UserData.findOne({ userId: req.params.userId });
    if (!userData) {
      // Create default user data if not exists
      const newUserData = new UserData({
        userId: req.params.userId,
        budget: 0,
        categories: defaultCategories
      });
      await newUserData.save();
      return res.json({ budget: 0, categories: defaultCategories });
    }
    res.json({ budget: userData.budget, categories: userData.categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update User Data (budget)
app.put('/api/user/:userId/data', async (req, res) => {
  try {
    const { budget } = req.body;
    let userData = await UserData.findOne({ userId: req.params.userId });
    
    if (!userData) {
      userData = new UserData({
        userId: req.params.userId,
        budget,
        categories: defaultCategories
      });
    } else {
      userData.budget = budget;
      userData.updatedAt = Date.now();
    }
    
    await userData.save();
    res.json({ message: 'Budget updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all expenses for a user
app.get('/api/expenses/:userId', async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { userId, description, amount, categoryId, date } = req.body;
    const expense = new Expense({
      userId,
      description,
      amount,
      categoryId,
      date: date || new Date()
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update expense
app.put('/api/expenses/:expenseId', async (req, res) => {
  try {
    const { description, amount, categoryId, date } = req.body;
    const expense = await Expense.findByIdAndUpdate(
      req.params.expenseId,
      { description, amount, categoryId, date },
      { new: true }
    );
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete expense
app.delete('/api/expenses/:expenseId', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.expenseId);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add category
app.post('/api/categories', async (req, res) => {
  try {
    const { userId, name, icon, color } = req.body;
    
    const userData = await UserData.findOne({ userId });
    if (!userData) {
      return res.status(404).json({ message: 'User data not found' });
    }

    userData.categories.push({ name, icon, color });
    await userData.save();
    
    res.status(201).json(userData.categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update category
app.put('/api/categories/:userId/:categoryId', async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    const userData = await UserData.findOne({ userId: req.params.userId });
    
    if (!userData) {
      return res.status(404).json({ message: 'User data not found' });
    }

    const category = userData.categories.id(req.params.categoryId);
    if (category) {
      category.name = name;
      category.icon = icon;
      category.color = color;
      await userData.save();
    }
    
    res.json(userData.categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete category
app.delete('/api/categories/:userId/:categoryId', async (req, res) => {
  try {
    const userData = await UserData.findOne({ userId: req.params.userId });
    
    if (!userData) {
      return res.status(404).json({ message: 'User data not found' });
    }

    userData.categories.pull({ _id: req.params.categoryId });
    await userData.save();
    
    res.json(userData.categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Expense Tracker API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

