const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http'); // Додано!
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');

const { initSocket } = require('./socket'); // Додано!

const app = express();
const server = http.createServer(app); // створюємо HTTP-сервер

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB підключено');
    server.listen(process.env.PORT, () =>
      console.log(`Сервер працює на порті ${process.env.PORT}`)
    );
    initSocket(server); // Підключаємо socket.io після запуску сервера!
  })
  .catch(err => console.error('Помилка підключення до БД', err));
