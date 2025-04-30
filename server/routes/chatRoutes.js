const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'chat');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/chat'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messages = await Message.find({ $or: [{ from: userId }, { to: userId }] }).sort({ createdAt: -1 });

    const latestByUser = {};
    messages.forEach(msg => {
      const otherUser = msg.from.toString() === userId ? msg.to.toString() : msg.from.toString();
      if (!latestByUser[otherUser]) {
        latestByUser[otherUser] = msg;
      }
    });

    const chatUserIds = Object.keys(latestByUser);
    const users = await User.find({ _id: { $in: chatUserIds } });

    const result = users.map(u => ({
      _id: u._id,
      otherUserId: u._id,
      otherName: `${u.firstName} ${u.lastName}`,
      avatarUrl: u.avatarUrl || '',
      latestMessage: latestByUser[u._id.toString()] || null
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Помилка при завантаженні чатів' });
  }
});

router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;
    const { before, limit = 20 } = req.query;

    const query = {
      $or: [
        { from: currentUserId, to: otherUserId },
        { from: otherUserId, to: currentUserId }
      ]
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Помилка при завантаженні повідомлень' });
  }
});

router.post('/:userId', authMiddleware, async (req, res) => {
  try {
    const from = req.user.userId;
    const to = req.params.userId;
    const { text, replyTo } = req.body;

    if (!text.trim()) return res.status(400).json({ message: 'Текст повідомлення обов’язковий' });

    const message = new Message({ from, to, text, replyTo: replyTo || null });
    await message.save();

    const sender = await User.findById(from);
    const receiver = await User.findById(to);

    const fullMessage = {
      ...message.toObject(),
      senderName: `${sender.firstName} ${sender.lastName}`,
      senderAvatarUrl: sender.avatarUrl || '',
      receiverName: `${receiver.firstName} ${receiver.lastName}`,
      receiverAvatarUrl: receiver.avatarUrl || ''
    };

    res.status(201).json(fullMessage);
  } catch (err) {
    res.status(500).json({ message: 'Помилка при надсиланні повідомлення' });
  }
});

router.post('/upload/:userId', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const from = req.user.userId;
    const to = req.params.userId;
    const fileUrl = `/uploads/chat/${req.file.filename}`;
    const text = req.body.text || '';
    const replyTo = req.body.replyTo || null;

    const message = new Message({
      from,
      to,
      text,
      file: {
        url: fileUrl,
        name: req.file.originalname,
        type: req.file.mimetype
      },
      replyTo
    });

    await message.save();

    const sender = await User.findById(from);
    const receiver = await User.findById(to);

    const fullMessage = {
      ...message.toObject(),
      senderName: `${sender.firstName} ${sender.lastName}`,
      senderAvatarUrl: sender.avatarUrl || '',
      receiverName: `${receiver.firstName} ${receiver.lastName}`,
      receiverAvatarUrl: receiver.avatarUrl || ''
    };

    res.status(201).json(fullMessage);
  } catch (err) {
    res.status(500).json({ message: 'Помилка при завантаженні файлу' });
  }
});

router.post('/mark-read/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;

    await Message.updateMany(
      { from: otherUserId, to: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: 'Позначено як прочитане' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка при оновленні статусу прочитання' });
  }
});

router.delete('/delete/:messageId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageId = req.params.messageId;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Повідомлення не знайдено' });
    if (message.from.toString() !== userId) return res.status(403).json({ message: 'Доступ заборонено' });

    await message.deleteOne();
    res.status(200).json({ message: 'Повідомлення видалено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка при видаленні повідомлення' });
  }
});

router.put('/edit/:messageId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageId = req.params.messageId;
    const { text } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Повідомлення не знайдено' });
    if (message.from.toString() !== userId) return res.status(403).json({ message: 'Редагування заборонено' });

    message.text = text;
    await message.save();

    res.status(200).json({ message: 'Повідомлення оновлено', updated: message });
  } catch (err) {
    res.status(500).json({ message: 'Помилка при редагуванні повідомлення' });
  }
});

router.post('/pin/:messageId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageId = req.params.messageId;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Повідомлення не знайдено' });
    if (message.from.toString() !== userId && message.to.toString() !== userId) {
      return res.status(403).json({ message: 'Немає доступу' });
    }

    message.isPinned = true;
    await message.save();

    res.status(200).json({ message: 'Повідомлення закріплено', updated: message });
  } catch (err) {
    console.error('Помилка при закріпленні повідомлення:', err);
    res.status(500).json({ message: 'Помилка при закріпленні повідомлення' });
  }
});

router.post('/unpin/:messageId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageId = req.params.messageId;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Повідомлення не знайдено' });

    if (message.from.toString() !== userId && message.to.toString() !== userId) {
      return res.status(403).json({ message: 'Немає доступу' });
    }

    message.isPinned = false;
    await message.save();

    res.status(200).json({ message: 'Повідомлення відкріплено', updated: message });
  } catch (err) {
    console.error('Помилка при відкрепленні повідомлення:', err);
    res.status(500).json({ message: 'Помилка при відкрепленні повідомлення' });
  }
});

router.get('/pinned/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;

    const pinnedMessages = await Message.find({
      isPinned: true,
      $or: [
        { from: currentUserId, to: otherUserId },
        { from: otherUserId, to: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json(pinnedMessages.map(m => m._id));
  } catch (err) {
    console.error('Помилка при отриманні закріплених повідомлень:', err);
    res.status(500).json({ message: 'Помилка при отриманні закріплених повідомлень' });
  }
});

router.get('/message/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Повідомлення не знайдено' });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Помилка при отриманні повідомлення' });
  }
});


module.exports = router;
