const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: [true, 'Please explain your claim'], trim: true, maxlength: 500 },
    proofDetails: { type: String, trim: true, maxlength: 500, default: '' },
    contactPhone: { type: String, trim: true, maxlength: 20, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    reviewNote: { type: String, trim: true, maxlength: 300, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Claim', claimSchema);
