const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  type: {
    type: String,
    enum: ['featured', 'urgent', 'highlight'],
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active'
  }
});

module.exports = mongoose.model('Promotion', promotionSchema);