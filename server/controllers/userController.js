const User = require('../models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -verificationToken');
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Помилка при отриманні профілю' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('firstName lastName avatarUrl');
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    res.json(user);
  } catch (err) {
    console.error('Помилка при отриманні користувача:', err);
    res.status(500).json({ message: 'Помилка при отриманні користувача' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      firstName,
      lastName,
      gender,
      age,
      role,
      oldPassword,
      newPassword
    } = req.body;

    const updateData = { firstName, lastName, gender, age, role };

    if (req.body.subjects) {
      updateData.subjects = JSON.parse(req.body.subjects);
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    if (newPassword) {
      const isMatch = await bcrypt.compare(oldPassword || '', user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Невірний старий пароль' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Новий пароль має містити щонайменше 6 символів' });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const newFilename = `${userId}${ext}`;
      const uploadPath = path.join(__dirname, '..', 'uploads', newFilename);
      fs.writeFileSync(uploadPath, req.file.buffer);
      updateData.avatarUrl = `/uploads/${newFilename}`;
    }

    await User.findByIdAndUpdate(userId, updateData);
    const updatedUser = await User.findById(userId).select('-password -verificationToken');
    res.json({ message: 'Профіль оновлено', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка при оновленні профілю' });
  }
};

exports.getAllTutors = async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = { role: 'викладач' };
    if (subject) {
      filter.subjects = subject;
    }
    const tutors = await User.find(filter).select('-password -verificationToken');
    res.json(tutors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка при отриманні списку викладачів' });
  }
};
