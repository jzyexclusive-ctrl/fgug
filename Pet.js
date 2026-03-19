const mongoose = require('mongoose');

const petSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Pet name is required'],
      trim: true,
      maxlength: [30, 'Pet name cannot exceed 30 characters'],
    },
    species: {
      type: String,
      required: [true, 'Species is required'],
      enum: {
        values: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'],
        message: 'Please select a valid species',
      },
    },
    breed: {
      type: String,
      trim: true,
      maxlength: [50, 'Breed cannot exceed 50 characters'],
      default: '',
    },
    age: {
      years: { type: Number, min: 0, max: 30, default: 0 },
      months: { type: Number, min: 0, max: 11, default: 0 },
    },
    weight: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
    },
    photo: {
      type: String, // base64 or URL
      default: null,
    },
    color: {
      type: String,
      default: '#6366f1', // accent color for avatar fallback
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    medicalInfo: {
      veterinarian: { type: String, default: '' },
      vaccinations: [{ name: String, date: Date, nextDue: Date }],
      allergies: [String],
      medications: [{ name: String, dosage: String, frequency: String }],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: task count
petSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'pet',
  count: true,
});

// Index for efficient queries
petSchema.index({ owner: 1, isArchived: 1 });

module.exports = mongoose.model('Pet', petSchema);
