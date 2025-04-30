import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { socket } from '../App';

const ChatPage = () => {
  const { user, token } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [unread, setUnread] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/chat', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setChats(data);
        const unreadInit = {};
        data.forEach(chat => {
          if (chat.latestMessage && !chat.latestMessage.read && chat.latestMessage.from !== user.id) {
            unreadInit[chat.otherUserId] = true;
          }
        });
        setUnread(unreadInit);
      });

    socket.emit('join', { userId: user.id });
    socket.on('newMessage', (message) => {
      setChats(prev => {
        const updated = prev.map(chat => {
          if (chat.otherUserId === message.from || chat.otherUserId === message.to) {
            return {
              ...chat,
              latestMessage: message,
              avatarUrl: chat.avatarUrl || message.senderAvatarUrl
            };
          }
          return chat;
        });
        return updated;
      });

      setUnread(prev => ({
        ...prev,
        [message.from === user.id ? message.to : message.from]: true
      }));
    });

    return () => socket.off('newMessage');
  }, [token, user.id]);

  const openChat = (chatUserId) => {
    navigate(`/chat/${chatUserId}`);
    setUnread(prev => ({ ...prev, [chatUserId]: false }));
  };

  const filteredChats = chats.filter(chat =>
    chat.otherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2>Мої чати</h2>
      <input
        type="text"
        placeholder="Пошук..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredChats.map((chat) => (
          <div
            key={chat._id}
            onClick={() => openChat(chat.otherUserId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #ddd',
              padding: '1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: unread[chat.otherUserId] ? '#eef' : '#fff'
            }}
          >
            <img
              src={chat.avatarUrl ? `http://localhost:5000${chat.avatarUrl}` : '/default-avatar.png'}
              alt="avatar"
              style={{ width: '40px', height: '40px', borderRadius: '50%' }}
            />
            <div style={{ marginLeft: '1rem' }}>
              <strong>{chat.otherName}</strong>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{chat.latestMessage?.text || 'Немає повідомлень'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatPage;