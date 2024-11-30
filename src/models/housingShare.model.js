const mongoose = require('mongoose');

const TUNISIAN_GOVERNORATES = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba',
  'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia', 'Manouba', 'Médenine',
  'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine',
  'Tozeur', 'Tunis', 'Zaghouan'
];

const housingShareSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  governorate: {
    type: String,
    required: true,
    enum: TUNISIAN_GOVERNORATES
  },
  city: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  university: {
    type: String,
    required: true
  },
  currentOccupants: {
    type: Number,
    required: true,
    min: 1
  },
  totalCapacity: {
    type: Number,
    required: true,
    min: 2
  },
  pricePerPerson: {
    type: Number,
    required: true
  },
  amenities: [{
    type: String
  }],
  photos: [{
    url: String,
    publicId: String
  }],
  preferences: {
    gender: {
      type: String,
      enum: ['male', 'female', 'any'],
      required: true
    },
    studyField: String,
    yearOfStudy: String
  },
  status: {
    type: String,
    enum: ['available', 'full', 'closed'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

housingShareSchema.index({ governorate: 1, status: 1, pricePerPerson: 1 });
housingShareSchema.index({ createdAt: -1 });

module.exports = mongoose.model('HousingShare', housingShareSchema);