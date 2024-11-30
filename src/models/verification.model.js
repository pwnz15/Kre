const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    enum: ['studentId', 'propertyDeed', 'nationalId'],
    required: true
  },
  documentImage: {
    url: String,
    publicId: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verifiedAt: Date,
  notes: String
});

module.exports = mongoose.model('Verification', verificationSchema);