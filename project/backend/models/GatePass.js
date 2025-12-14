const mongoose = require('mongoose');

const gatePassSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  purpose: String,
  date: Date,
  returnTime: String,
  groupMembers: [
    {
      name: String,
      admNo: Number,
      admissionNo: Number,
      dept: String
    }
  ],
  status: { type: String, default: 'pending' }, // Changed to pending
  verified: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', default: null },
  approvedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('GatePass', gatePassSchema);