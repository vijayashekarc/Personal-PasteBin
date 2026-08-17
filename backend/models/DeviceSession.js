const mongoose = require('mongoose');

const deviceSessionSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  deviceName: {
    type: String,
    required: true,
    default: 'Unknown Device',
  },
  ip: {
    type: String,
    default: '',
  },
  token: {
    type: String,
    required: true,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DeviceSession', deviceSessionSchema);
