// server/models/User.js - Fixed Password Selection Issue
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6
    // ✅ REMOVED: select: false - This was causing the password to be undefined
  },
  avatar: {
    type: String,
    default: null // Will store Cloudinary URL or emoji identifier
  },
  avatarType: {
    type: String,
    enum: ['emoji', 'image'],
    default: 'emoji'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 💡 NEW Fields for Friend/Connection System
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sentRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  incomingRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);