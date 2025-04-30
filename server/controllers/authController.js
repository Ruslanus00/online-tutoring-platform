const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendVerificationEmail = require('../utils/sendVerificationEmail');

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, gender, age, role, subjects, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email вже використовується' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      firstName, lastName, gender, age,
      role, subjects, email,
      password: hashedPassword,
      verificationToken
    });

    await newUser.save();
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'Користувач зареєстрований. Перевірте email для підтвердження.' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка при реєстрації' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).send('Недійсний токен');

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    res.status(500).send('Помилка підтвердження');
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Невірний пароль' });

    if (!user.isVerified) return res.status(403).json({ message: 'Підтвердіть вашу електронну адресу' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.status(200).json({
      message: 'Вхід успішний',
      token,
      user: {
        id: user._id,
        name: user.firstName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Помилка при вході' });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    if (user.isVerified) return res.status(400).json({ message: 'Email вже підтверджено' });

    user.verificationToken = crypto.randomBytes(32).toString('hex');
    await user.save();
    await sendVerificationEmail(email, user.verificationToken);
    res.status(200).json({ message: 'Повторний лист підтвердження відправлено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка при повторному надсиланні' });
  }
};