const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  const url = `${process.env.FRONTEND_URL}/verify/${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Підтвердження акаунта',
    html: `<h2>Підтвердіть акаунт</h2><p><a href="${url}">${url}</a></p>`
  });
};

module.exports = sendVerificationEmail;
