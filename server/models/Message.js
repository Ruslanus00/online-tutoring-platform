const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: false },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  file: {
    url: { type: String },
    name: { type: String },
    type: { type: String }
  },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  isPinned: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);
