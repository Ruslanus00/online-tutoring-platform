import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const subjectsList = ['Математика', 'Українська мова', 'Фізика', 'Історія', 'Хімія'];

const ProfilePage = () => {
  const { user, token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    age: '',
    role: '',
    subjects: [],
    email: '',
    oldPassword: '',
    newPassword: '',
    avatar: null,
    avatarUrl: '',
    createdAt: ''
  });
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && user.id) {
      fetch(`http://localhost:5000/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setFormData(prev => ({ ...prev, ...data }));
        });
    }
  }, [user, token]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar' && files[0]) {
      const file = files[0];
      setFormData(prev => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const updateProfile = async () => {
    const form = new FormData();
    for (const key in formData) {
      if (formData[key]) {
        if (Array.isArray(formData[key])) {
          form.append(key, JSON.stringify(formData[key]));
        } else {
          form.append(key, formData[key]);
        }
      }
    }

    const res = await fetch(`http://localhost:5000/api/user/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });

    const data = await res.json();
    setMessage(data.message);
    if (data.user?.avatarUrl) {
      setFormData(prev => ({ ...prev, avatarUrl: data.user.avatarUrl }));
      setPreview('');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Редагування профілю</h2>

      {message && <p style={{ color: 'green' }}>{message}</p>}

      {(preview || formData.avatarUrl) && (
        <div style={{ marginBottom: '1rem' }}>
          <img
            src={preview || `http://localhost:5000${formData.avatarUrl}`}
            alt="Аватар"
            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }}
          />
        </div>
      )}

      <label>Ім'я:</label>
      <input name="firstName" value={formData.firstName} onChange={handleChange} />

      <label>Прізвище:</label>
      <input name="lastName" value={formData.lastName} onChange={handleChange} />

      <label>Стать:</label>
      <select name="gender" value={formData.gender} onChange={handleChange}>
        <option value="">Оберіть</option>
        <option value="чоловіча">Чоловіча</option>
        <option value="жіноча">Жіноча</option>
      </select>

      <label>Вік:</label>
      <input name="age" type="number" value={formData.age} onChange={handleChange} />

      <label>Email:</label>
      <input value={formData.email} readOnly disabled />

      <label>Роль:</label>
      <select name="role" value={formData.role} onChange={handleChange}>
        <option value="">Оберіть</option>
        <option value="викладач">Викладач</option>
        <option value="батьки">Батьки</option>
      </select>

      {formData.role === 'викладач' && (
        <div>
          <p>Предмети викладання:</p>
          {subjectsList.map(subject => (
            <label key={subject}>
              <input
                type="checkbox"
                checked={formData.subjects.includes(subject)}
                onChange={() => handleSubjectToggle(subject)}
              />
              {subject}
            </label>
          ))}
        </div>
      )}

      <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#555' }}>
        Зареєстрований з: {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString('uk-UA') : '—'}
      </p>

      <hr style={{ margin: '2rem 0' }} />
      <h4>Зміна паролю</h4>

      <label>Старий пароль:</label>
      <input type="password" name="oldPassword" value={formData.oldPassword} onChange={handleChange} />

      <label>Новий пароль:</label>
      <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} />

      <hr style={{ margin: '2rem 0' }} />
      <h4>Фото профілю</h4>

      <input type="file" name="avatar" accept="image/*" onChange={handleChange} />

      <button style={{ marginTop: '1rem' }} onClick={updateProfile}>Зберегти</button>
    </div>
  );
};

export default ProfilePage;