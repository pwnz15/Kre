const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['binome', 'trinome', 'quadrinome'],
    required: true
  },
  state: {
    type: String,
    required: true
  },
  university: String,
  description: String,
  preferences: {
    gender: {
      type: String,
      enum: ['male', 'female', 'any']
    },
    priceRange: {
      min: Number,
      max: Number
    },
    studyField: String
  },
  status: {
    type: String,
    enum: ['active', 'found', 'closed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

partnerSchema.index({ state: 1, type: 1, status: 1 });

module.exports = mongoose.model('Partner', partnerSchema);