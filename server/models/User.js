const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  gender: String,
  age: Number,
  role: { type: String, enum: ['викладач', 'батьки'], required: true },
  subjects: [String],
  email: { type: String, required: true, unique: true },
  password: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  avatarUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.verificationToken;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
