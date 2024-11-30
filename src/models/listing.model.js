const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'room'],
    required: true
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  address: String,
  price: {
    type: Number,
    required: true
  },
  bedrooms: Number,
  bathrooms: Number,
  amenities: [String],
  images: [String],
  available: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better search performance
listingSchema.index({ state: 1, city: 1, propertyType: 1, price: 1 });

module.exports = mongoose.model('Listing', listingSchema);