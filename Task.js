const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['feeding', 'walking', 'medication', 'grooming', 'vet', 'play', 'training', 'other'],
        message: 'Please select a valid category',
      },
    },
    description: {
      type: String,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date/time is required'],
    },
    duration: {
      type: Number, // minutes
      min: 1,
      max: 480,
      default: 30,
    },
    recurrence: {
      type: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'custom'],
        default: 'none',
      },
      interval: { type: Number, min: 1, default: 1 },
      daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0=Sun, 6=Sat
      endDate: { type: Date, default: null },
    },
    reminder: {
      enabled: { type: Boolean, default: true },
      minutesBefore: { type: Number, default: 10 },
      sent: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'skipped', 'overdue'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: '',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    color: {
      type: String,
      default: null, // derived from category if null
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null, // for recurring task instances
    },
    order: {
      type: Number,
      default: 0, // for drag-and-drop ordering
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
taskSchema.index({ owner: 1, scheduledAt: 1 });
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ owner: 1, pet: 1 });
taskSchema.index({ scheduledAt: 1, 'reminder.sent': 1 }); // for cron jobs

// Virtual: isOverdue
taskSchema.virtual('isOverdue').get(function () {
  return this.status === 'pending' && this.scheduledAt < new Date();
});

// Pre-save: auto-mark overdue
taskSchema.pre('save', function (next) {
  if (this.status === 'pending' && this.scheduledAt < new Date()) {
    this.status = 'overdue';
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
