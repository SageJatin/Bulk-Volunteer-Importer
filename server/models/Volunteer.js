const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true, 
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\d{10}$/, 'Phone must be exactly 10 digits'],
    trim: true
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female', 'other'],
      message: '{VALUE} is not a valid gender'
    }
  },
  dob: {
    type: Date,
    required: [true, 'Date of Birth is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  highestEducation: {
    type: String,
    required: [true, 'Highest education is required'],
    enum: {
      values: ['below-10th', '10th', '12th', 'graduate', 'postgraduate'],
      message: '{VALUE} is not a valid education level'
    }
  },
  accountNumber: {
    type: String,
  },
  ifscCode: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('Volunteer', volunteerSchema);