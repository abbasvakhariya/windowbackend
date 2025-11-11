const mongoose = require('mongoose');

const windowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  windowName: {
    type: String,
    default: 'Unnamed Window'
  },
  category: {
    type: String,
    enum: ['sliding', 'openable'],
    required: true
  },
  subCategory: {
    type: String,
    required: true
  },
  windowConfig: {
    type: String,
    enum: ['2_track', '2_track_mosquito', '2_track_grill', '2_track_mosquito_grill'],
    default: '2_track'
  },
  dimensions: {
    length: Number,
    width: Number,
    lengthDora: Number,
    widthDora: Number,
    unit: {
      type: String,
      enum: ['feet', 'inches'],
      default: 'feet'
    },
    tracks: {
      type: Number,
      default: 2
    },
    numberOfPipes: Number
  },
  options: {
    hasMosquitoNet: Boolean,
    hasGrill: Boolean,
    numberOfPipes: Number,
    glassType: {
      type: String,
      default: 'plane'
    }
  },
  result: {
    area: Number,
    totalCost: Number,
    costPerSqft: Number,
    breakdown: mongoose.Schema.Types.Mixed
  },
  cuttingList: {
    profile: String,
    dimensions: mongoose.Schema.Types.Mixed,
    calculations: mongoose.Schema.Types.Mixed
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
windowSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Window', windowSchema);

