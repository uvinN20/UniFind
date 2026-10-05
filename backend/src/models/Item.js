const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'Books & Stationery',
  'ID & Cards',
  'Keys',
  'Clothing & Bags',
  'Wallets & Money',
  'Other',
];

const STATUSES = ['open', 'claim_pending', 'recovered', 'closed'];

const itemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: { values: ['lost', 'found'], message: 'Type must be lost or found' },
      required: [true, 'Choose whether the item was lost or found'],
    },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 100 },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: { values: CATEGORIES, message: 'Choose a valid category' },
      default: 'Other',
    },
    location: { type: String, required: [true, 'Location is required'], trim: true, maxlength: 120 },
    dateOccurred: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        // one day of tolerance for time zone differences
        validator: (v) => v.getTime() <= Date.now() + 24 * 60 * 60 * 1000,
        message: 'Date cannot be in the future',
      },
    },
    imageUrl: { type: String, default: '' },
    contactPhone: { type: String, trim: true, maxlength: 20, default: '' },
    status: { type: String, enum: STATUSES, default: 'open' },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

itemSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Item', itemSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;
