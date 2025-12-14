var mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
   name: String,
   admNo: { type: Number, unique: true },
   image: Buffer,
   dept: String,
   sem: Number,
   tutorName: String,
   email: String,
   parent_No: Number,
   password: String,
   phone: Number,
   purpose: String,
   date: Date,
   returnTime: String,
   verified: { type: Boolean, default: false },
   groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'GatePass', default: null },
   passStatus: { type: String, default: 'none' } // none, pending, approved, rejected
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;