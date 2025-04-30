import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { socket } from '../App';
import Picker from 'emoji-picker-react';

const ChatConversationPage = () => {
  const { user, token } = useContext(AuthContext);
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  const [contextMenuMsgId, setContextMenuMsgId] = useState(null);
  const [pinnedContextMenuMsgId, setPinnedContextMenuMsgId] = useState(null); 
  const [editMessageId, setEditMessageId] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const chatBoxRef = useRef(null);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
  const chatBox = chatBoxRef.current;
  if (!chatBox) return;

  const handleScroll = async () => {
    if (chatBox.scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
      setIsLoadingMore(true);

      const oldest = messages[0];
      const previousScrollHeight = chatBox.scrollHeight;
      const previousScrollTop = chatBox.scrollTop;

      const res = await fetch(`http://localhost:5000/api/chat/${userId}?before=${oldest.createdAt}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.length === 0) {
        setHasMoreMessages(false);
      } else {
        setMessages(prev => [...data, ...prev]);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const newScrollHeight = chatBox.scrollHeight;
              const scrollDiff = newScrollHeight - previousScrollHeight;
              chatBox.scrollTop = previousScrollTop + scrollDiff;
            });
          });
        }

        setIsLoadingMore(false);
      }
    };

    chatBox.addEventListener('scroll', handleScroll);
    return () => chatBox.removeEventListener('scroll', handleScroll);
  }, [messages, userId, token, isLoadingMore, hasMoreMessages]);

const initialLoadRef = useRef(true);

  useEffect(() => {
    const loadInitialMessages = async () => {
      const res = await fetch(`http://localhost:5000/api/chat/${userId}?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
      if (data.length < 50) setHasMoreMessages(false);
    };

    const loadPinnedMessages = async () => {
      const res = await fetch(`http://localhost:5000/api/chat/pinned/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const fullPinnedMessages = await Promise.all(
        data.map(async (id) => {
          const res = await fetch(`http://localhost:5000/api/chat/message/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return await res.json();
        })
      );
      setPinnedMessages(fullPinnedMessages);
    };

    loadInitialMessages();
    loadPinnedMessages();
  }, [userId, token]);



  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (
        (msg.from === user.id && msg.to === userId) ||
        (msg.from === userId && msg.to === user.id)
      ) {
        setMessages(prev => {
          const isDuplicate = prev.some(m => m._id === msg._id);
          return isDuplicate ? prev : [...prev, msg];
        });
        if (msg.isPinned) {
          setPinnedMessages(prev => {
            const exists = prev.some(m => m._id === msg._id);
            return exists ? prev : [...prev, msg];
          });
        }
      }
    };
    const handleTyping = ({ from }) => {
      if (from === userId) setTypingStatus('набирає повідомлення...');
    };
    const handleStopTyping = ({ from }) => {
      if (from === userId) setTypingStatus('');
    };
    const handleReadStatus = ({ from }) => {
      setMessages(prev => prev.map(msg =>
        msg.from === user.id && msg.to === from ? { ...msg, read: true } : msg
      ));
    };
    const handleDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
      setPinnedMessages(prev => prev.filter(m => m._id !== messageId));
    };
    const handleEdited = ({ messageId, newText }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, text: newText } : m
      ));
    };
    const handlePinned = ({ messageId }) => {
      setMessages(prev =>
        prev.map(m => m._id === messageId ? { ...m, isPinned: true } : m)
      );

      fetch(`http://localhost:5000/api/chat/message/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(msg => setPinnedMessages(prev => [...prev, msg]));
    };


    const handleUnpinned = ({ messageId }) => {
      setMessages(prev =>
        prev.map(m => m._id === messageId ? { ...m, isPinned: false } : m)
      );

      setPinnedMessages(prev => prev.filter(m => m._id !== messageId));
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messageRead', handleReadStatus);
    socket.on('messageDeleted', handleDeleted);
    socket.on('messageEdited', handleEdited);
    socket.on('messagePinned', handlePinned);
    socket.on('messageUnpinned', handleUnpinned);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messageRead', handleReadStatus);
      socket.off('messageDeleted', handleDeleted);
      socket.off('messageEdited', handleEdited);
      socket.off('messagePinned', handlePinned);
      socket.off('messageUnpinned', handleUnpinned);
    };
  }, [user.id, userId]);

  useEffect(() => {
    if (initialLoadRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'auto' });
          initialLoadRef.current = false;
        });
      });
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-message]')) {
        setContextMenuMsgId(null);
        setPinnedContextMenuMsgId(null);
      }
    };
  
    document.addEventListener('click', handleClickOutside);
  
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);  
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && fullScreenImage) {
        setFullScreenImage(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    }, [fullScreenImage]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setChatUser(data))
      .catch(err => console.error('Помилка при завантаженні користувача:', err));
    }, [userId, token]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (attachment) {
      const formData = new FormData();
      formData.append('file', attachment);
      formData.append('text', newMessage);
      if (replyToMessage) {
        formData.append('replyTo', replyToMessage._id);
      }

      const res = await fetch(`http://localhost:5000/api/chat/upload/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      socket.emit('sendMessage', data);
      setMessages(prev => [...prev, data]);
      setAttachment(null);
      setNewMessage('');
      setReplyToMessage(null);
      return;
    }

    if (!newMessage.trim()) return;

    if (editMessageId) {
      await fetch(`http://localhost:5000/api/chat/edit/${editMessageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newMessage })
      });
      socket.emit('editMessage', { messageId: editMessageId, to: userId, newText: newMessage });
      setEditMessageId(null);
    } else {
      const body = { text: newMessage };
      if (replyToMessage) body.replyTo = replyToMessage._id;

      const res = await fetch(`http://localhost:5000/api/chat/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      socket.emit('sendMessage', data);
      setMessages(prev => [...prev, data]);
    }

    socket.emit('stopTyping', { from: user.id, to: userId });
    setNewMessage('');
    setReplyToMessage(null);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { from: user.id, to: userId });
    }
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stopTyping', { from: user.id, to: userId });
    }, 2000);
  };

  const onEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const deleteMessage = async (messageId) => {
    await fetch(`http://localhost:5000/api/chat/delete/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    socket.emit('deleteMessage', { messageId, to: userId });
    setMessages(prev => prev.filter(m => m._id !== messageId));
    setContextMenuMsgId(null);
  };

  const startEditMessage = (messageId, currentText) => {
    setEditMessageId(messageId);
    setNewMessage(currentText);
    setContextMenuMsgId(null);
  };

  const startReplyToMessage = (msg) => {
    setReplyToMessage(msg);
    setContextMenuMsgId(null);
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const pinMessage = (messageId) => {
    socket.emit('pinMessage', { messageId, to: userId });
    setContextMenuMsgId(null);
  };

  const unpinMessage = (messageId) => {
    socket.emit('unpinMessage', { messageId, to: userId });
    setContextMenuMsgId(null);
  };

  const scrollToMessage = async (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.backgroundColor = '#ffffcc';
      setTimeout(() => (element.style.backgroundColor = ''), 1000);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/chat/message/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const msg = await res.json();

      setMessages(prev => {
        const exists = prev.some(m => m._id === msg._id);
        if (exists) return prev;
        const newMessages = [...prev, msg];
        newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return newMessages;
      });
      setTimeout(() => {
        const el = document.getElementById(`message-${messageId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.backgroundColor = '#ffffcc';
          setTimeout(() => (el.style.backgroundColor = ''), 1000);
        }
      }, 200);
    } catch (err) {
      console.error('Не вдалося завантажити повідомлення:', err);
    }
  };




  const renderMessageContent = (msg) => {
    const replyTo = messages.find(m => m._id === msg.replyTo);
    return (
      <div>
        {replyTo && (
          <div
            onClick={() => scrollToMessage(replyTo._id)}
            style={{
              backgroundColor: '#f7f7f7',
              padding: '6px 10px',
              borderLeft: '3px solid #007bff',
              marginBottom: '6px',
              fontSize: '0.85rem',
              color: '#555',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {replyTo.text ? `Відповідь на: "${replyTo.text.length > 40 ? replyTo.text.slice(0, 40) + '...' : replyTo.text}"` : 'Відповідь на вкладення'}
          </div>
        )}
        {msg.file && msg.file.url && (
          msg.file.type.startsWith('image') ? (
            <img
              src={`http://localhost:5000${msg.file.url}`}
              alt={msg.file.name}
              style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => setFullScreenImage(`http://localhost:5000${msg.file.url}`)}
            />
          ) : (
            <a href={`http://localhost:5000${msg.file.url}`} target="_blank" rel="noopener noreferrer">📎 {msg.file.name}</a>
          )
        )}
        {msg.text && <div style={{ marginTop: msg.file ? '0.5rem' : '0' }}>{msg.text}</div>}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Бічна панель закріплених */}
      <div style={{ width: '200px', borderRight: '1px solid #ccc', overflowY: 'auto', padding: '1rem' }}>
        <h4>📌 Закріплені</h4>
        {pinnedMessages.length === 0 && (
          <div style={{ fontSize: '0.9rem', color: '#777' }}>Немає закріплених</div>
        )}
        {pinnedMessages.map(pin => (
          <div
            onContextMenu={(e) => {
              e.preventDefault();
              setPinnedContextMenuMsgId(prev => (prev === pin._id ? null : pin._id));
            }}
            key={pin._id}
            onClick={() => scrollToMessage(pin._id)}
            onDoubleClick={() => {
              if (pin.file?.url && pin.file.type.startsWith('image')) {
                setFullScreenImage(`http://localhost:5000${pin.file.url}`);
              } else if (pin.file?.url) {
                window.open(`http://localhost:5000${pin.file.url}`, '_blank');
              }
            }}
            style={{
              cursor: 'pointer',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '6px',
              backgroundColor: '#f9f9f9'
            }}
          >
            {pin.file && pin.file.type.startsWith('image') ? (
              <img
                src={`http://localhost:5000${pin.file.url}`}
                alt={pin.file.name}
                style={{ width: '100%', height: 'auto', borderRadius: '6px', marginBottom: '5px' }}
              />
            ) : (
              <>
                {pin.text
                  ? pin.text.slice(0, 50) + (pin.text.length > 50 ? '...' : '')
                  : pin.file?.name}
              </>
            )}
            {pinnedContextMenuMsgId === pin._id && (
              <div style={{ marginTop: '5px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    unpinMessage(pin._id);
                    setPinnedContextMenuMsgId(null);
                  }}
                  style={{
                    fontSize: '0.8rem',
                    background: 'none',
                    border: '1px solid #c00',
                    borderRadius: '5px',
                    padding: '2px 6px',
                    color: '#c00',
                    cursor: 'pointer'
                  }}
                >
                  Відкріпити 📌
                </button>

                {pin.file && (
                  <button
                    onClick={() => {
                      if (pin.file.type.startsWith('image')) {
                        setFullScreenImage(`http://localhost:5000${pin.file.url}`);
                      } else {
                        window.open(`http://localhost:5000${pin.file.url}`, '_blank');
                      }
                      setPinnedContextMenuMsgId(null);
                    }}
                    style={{
                      fontSize: '0.8rem',
                      background: 'none',
                      border: '1px solid #007bff',
                      borderRadius: '5px',
                      padding: '2px 6px',
                      color: '#007bff',
                      cursor: 'pointer'
                    }}
                  >
                    Переглянути 🔍
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Основний чат */}
      <div id="chatContainer" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              {chatUser?.avatarUrl && (
              <img
                  src={`http://localhost:5000${chatUser.avatarUrl}`}
                  alt="Avatar"
                  onClick={() => setFullScreenImage(`http://localhost:5000${chatUser.avatarUrl}`)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: '2px solid #ccc'
                  }}
                  title="Натисніть, щоб переглянути"
              />
              )}
              <h2 style={{ margin: 0 }}>
                {chatUser ? `${chatUser.firstName} ${chatUser.lastName}` : 'Чат з користувачем користувачем'}
              </h2>
          </div>
        <div style={{ fontStyle: 'italic', marginBottom: '0.5rem', color: '#888' }}>{typingStatus}</div>

        <div
         ref={chatBoxRef}
         style={{ flex: 1, overflowY: 'scroll', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}
        >
            {isLoadingMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 38 38"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#888"
                >
                  <g fill="none" fillRule="evenodd">
                    <g transform="translate(1 1)" strokeWidth="2">
                      <circle strokeOpacity=".3" cx="18" cy="18" r="18" />
                      <path d="M36 18c0-9.94-8.06-18-18-18">
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0 18 18"
                          to="360 18 18"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </path>
                    </g>
                  </g>
                </svg>
              </div>
            )}
          {messages.map((msg, idx) => (
            <div
              key={msg._id || idx}
              id={`message-${msg._id}`}
              onContextMenu={(e) => {
                e.preventDefault();
                  setContextMenuMsgId(prev => (prev === msg._id ? null : msg._id));
              }}              
              onDoubleClick={() => startReplyToMessage(msg)}
              style={{ textAlign: msg.from === user.id ? 'right' : 'left', marginBottom: '0.5rem' }}
            >
              <div
                style={{
                  display: 'inline-block',
                  background: msg.from === user.id ? '#cfe9ff' : '#f0f0f0',
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  position: 'relative'
                }}
              >
                {renderMessageContent(msg)}
                {contextMenuMsgId === msg._id && (
                  <div style={{ marginTop: '5px' }}>
                    {msg.from === user.id && (
                      <>
                        <button
                          onClick={() => deleteMessage(msg._id)} style={{ marginRight: '8px' }}>Видалити  🗑️</button>
                        <button onClick={() => startEditMessage(msg._id, msg.text)} style={{ marginRight: '8px' }}>Редагувати ✏️</button>
                      </>
                    )}
                    <button onClick={() => startReplyToMessage(msg)} style={{ marginRight: '8px' }}>Відповісти  💬</button>
                    {msg.isPinned ? (<button onClick={() => unpinMessage(msg._id)} style={{ marginRight: '8px' }}>Відкріпити 📌</button>) : 
                                  (<button onClick={() => pinMessage(msg._id)} style={{ marginRight: '8px' }}>Закріпити 📌</button>
                                  )
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>

        {replyToMessage && (
          <div style={{ background: '#e0e0e0', padding: '8px', marginTop: '1rem', borderRadius: '8px', position: 'relative' }}>
            Відповідаєте на: "{replyToMessage.text?.slice(0, 50)}"
            <button onClick={cancelReply} style={{ position: 'absolute', top: '4px', right: '8px' }}>×</button>
          </div>
        )}
        
        {fullScreenImage && (
          <div
            onClick={() => setFullScreenImage(null)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2000
            }}
          >
            <img
              src={fullScreenImage}
              alt="Full View"
              style={{ maxHeight: '90%', maxWidth: '90%', borderRadius: '8px' }}
            />
            <button
              onClick={() => setFullScreenImage(null)}
              style={{
                position: 'fixed',
                top: '20px',
                right: '30px',
                fontSize: '2rem',
                color: 'white',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={sendMessage} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button type="button" onClick={() => setShowEmojiPicker(prev => !prev)}>😊</button>
          {showEmojiPicker && (
            <div style={{ position: 'absolute', bottom: '120px', zIndex: 1000 }}>
              <Picker onEmojiClick={onEmojiClick} />
            </div>
          )}
          <input
            type="file"
            onChange={(e) => setAttachment(e.target.files[0])}
            style={{ maxWidth: '150px' }}
          />
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={editMessageId ? 'Редагувати повідомлення...' : 'Введіть повідомлення...'}
            style={{ flex: 1 }}
          />
          <button type="submit">{editMessageId ? 'Оновити' : 'Надіслати'}</button>
        </form>
      </div>
    </div>
  );
};

export default ChatConversationPage;