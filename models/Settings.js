const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  toolSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      windowCosting: {
        miniDomal: {
          outerFrameKg: 0.200,
          shutterFrameKg: 0.175,
          innerLockClipKg: 0.0625,
          cChannelKg: 0.0625,
          rtKg: 0.125,
          roundPipeKg: 0.0625,
          outerFrameKgWithNet: 0.26875,
          outerFrameKgWithGrill: 0.2625,
          cuttingProfiles: {
            '2_track': '',
            '2_track_mosquito': '',
            '2_track_grill': '',
            '2_track_mosquito_grill': ''
          }
        },
        domal: {
          outerFrameKg: 0.200,
          shutterFrameKg: 0.175,
          innerLockClipKg: 0.0625,
          cChannelKg: 0.0625,
          rtKg: 0.125,
          roundPipeKg: 0.0625,
          outerFrameKgWithNet: 0.26875,
          outerFrameKgWithGrill: 0.2625,
          cuttingProfiles: {
            '2_track': '',
            '2_track_mosquito': '',
            '2_track_grill': '',
            '2_track_mosquito_grill': ''
          }
        },
        ventena: {
          outerFrameKg: 0.200,
          shutterFrameKg: 0.175,
          innerLockClipKg: 0.0625,
          cChannelKg: 0.0625,
          rtKg: 0.125,
          roundPipeKg: 0.0625,
          outerFrameKgWithNet: 0.26875,
          outerFrameKgWithGrill: 0.2625,
          cuttingProfiles: {
            '2_track': '',
            '2_track_mosquito': '',
            '2_track_grill': '',
            '2_track_mosquito_grill': ''
          }
        }
      },
      cuttingMeasuring: {
        profiles: {}
      },
      customCategories: {
        sliding: {},
        openable: {}
      }
    }
  },
  preferences: {
    defaultUnit: {
      type: String,
      enum: ['feet', 'inches'],
      default: 'feet'
    },
    currency: {
      type: String,
      default: 'INR'
    }
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

module.exports = mongoose.model('Settings', settingsSchema);

