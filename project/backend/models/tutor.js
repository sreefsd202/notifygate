var mongoose = require('mongoose');
const tutorSchema = new mongoose.Schema({
  name: String,
  empId: { type: String, unique: true },
  dept: String,
  email: { type: String, unique: true },
  image: Buffer,
  password: String,
  verified: { type: Boolean, default: false },
  status: { type: String, default: 'pending' }
});

const Tutor = mongoose.model('Tutor', tutorSchema);
module.exports = Tutor;