const { Server } = require('socket.io');
const Message = require('./models/Message');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket підключено:', socket.id);

    socket.on('join', ({ userId }) => {
      socket.join(userId);
      console.log(`Користувач ${userId} приєднався до кімнати`);
    });

    socket.on('sendMessage', (message) => {
      const { from, to } = message;
      io.to(to).emit('newMessage', message);
      io.to(from).emit('newMessage', message);
    });

    socket.on('typing', ({ from, to }) => {
      io.to(to).emit('typing', { from });
    });

    socket.on('stopTyping', ({ from, to }) => {
      io.to(to).emit('stopTyping', { from });
    });

    socket.on('markAsRead', async ({ from, to }) => {
      try {
        await Message.updateMany(
          { from, to, read: false },
          { $set: { read: true } }
        );
        io.to(from).emit('messageRead', { from: to });
      } catch (err) {
        console.error('Помилка при оновленні статусу прочитаного:', err);
      }
    });

    socket.on('deleteMessage', ({ messageId, to }) => {
      io.to(to).emit('messageDeleted', { messageId });
    });

    socket.on('editMessage', ({ messageId, to, newText }) => {
      io.to(to).emit('messageEdited', { messageId, newText });
      io.to(socket.id).emit('messageEdited', { messageId, newText });
    });

    socket.on('pinMessage', async ({ messageId, to }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { isPinned: true });
        io.to(to).emit('messagePinned', { messageId });
        io.to(socket.id).emit('messagePinned', { messageId });
      } catch (err) {
        console.error('Помилка при закріпленні повідомлення:', err);
      }
    });

    socket.on('unpinMessage', async ({ messageId, to }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { isPinned: false });
        io.to(to).emit('messageUnpinned', { messageId });
        io.to(socket.id).emit('messageUnpinned', { messageId });
      } catch (err) {
        console.error('Помилка при відкрепленні повідомлення:', err);
      }
    });


    socket.on('disconnect', () => {
      console.log('❌ Socket відключено:', socket.id);
    });
  });
};

module.exports = { initSocket, io };
