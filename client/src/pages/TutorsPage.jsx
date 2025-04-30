import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const subjectOptions = ['Математика', 'Українська мова', 'Фізика', 'Історія', 'Хімія'];

const TutorsPage = () => {
  const [tutors, setTutors] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let url = 'http://localhost:5000/api/user/tutors';
    if (subjectFilter) {
      url += `?subject=${encodeURIComponent(subjectFilter)}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => setTutors(data));
  }, [subjectFilter]);

  const openTutorProfile = (tutorId) => {
    navigate(`/tutor/${tutorId}`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Доступні викладачі</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>Фільтр за предметом:</label>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          style={{ marginLeft: '1rem', padding: '0.3rem' }}
        >
          <option value="">Всі</option>
          {subjectOptions.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {tutors.map(tutor => (
          <div
            key={tutor._id}
            onClick={() => openTutorProfile(tutor._id)}
            style={{ cursor: 'pointer', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}
          >
            {tutor.avatarUrl && (
              <img
                src={`http://localhost:5000${tutor.avatarUrl}`}
                alt="Аватар"
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <h3>{tutor.firstName} {tutor.lastName}</h3>
            <p>Стать: {tutor.gender}</p>
            <p>Вік: {tutor.age}</p>
            <p>Предмети: {Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : '—'}</p>
            <p>Email: {tutor.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorsPage;
