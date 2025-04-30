import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TutorProfilePage = () => {
  const { tutorId } = useParams();
  const { user } = useContext(AuthContext);
  const [tutor, setTutor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/api/user/tutors`)
      .then(res => res.json())
      .then(data => {
        const found = data.find(t => t._id === tutorId);
        if (found) setTutor(found);
      });

    fetch(`http://localhost:5000/api/reviews/${tutorId}`)
      .then(res => res.json())
      .then(data => setReviews(data));
  }, [tutorId]);

  useEffect(() => {
    if (user) {
      const myReview = reviews.find(r => r.userId === user.id);
      if (myReview) {
        setEditingReviewId(myReview._id);
        setReviewForm({ rating: myReview.rating, comment: myReview.comment });
      }
    }
  }, [user, reviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({ ...prev, [name]: value }));
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return;

    const url = 'http://localhost:5000/api/reviews';
    const method = editingReviewId ? 'PUT' : 'POST';
    const payload = editingReviewId
      ? { reviewId: editingReviewId, ...reviewForm }
      : { tutorId, userId: user.id, parentName: user.name, ...reviewForm };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      setReviewForm({ rating: 5, comment: '' });
      setEditingReviewId(null);
      setMessage(data.message);
      fetch(`http://localhost:5000/api/reviews/${tutorId}`)
        .then(res => res.json())
        .then(data => setReviews(data));
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(data.message);
    }
  };

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const handleMessageClick = () => {
    navigate(`/chat/${tutorId}`);
  };

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/tutor/${tutorId}`;
    navigator.clipboard.writeText(profileUrl)
      .then(() => setMessage('Посилання скопійовано!'))
      .catch(() => setMessage('Не вдалося скопіювати посилання.'));
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div style={{ padding: '2rem' }}>
      {tutor ? (
        <div>
          <h2>{tutor.firstName} {tutor.lastName}</h2>
          {tutor.avatarUrl && <img src={`http://localhost:5000${tutor.avatarUrl}`} alt="avatar" style={{ width: '120px', borderRadius: '50%' }} />}

          <p>Предмети: {Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : '—'}</p>
          <p>⭐ Середній рейтинг: {averageRating} / 5</p>
          <p>Зареєстрований з: {new Date(tutor.createdAt).toLocaleDateString('uk-UA')}</p>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button onClick={handleMessageClick}>Написати</button>
            <button onClick={handleShare}>Поділитись</button>
          </div>

          <h3>{editingReviewId ? 'Редагувати відгук' : 'Залишити відгук'}</h3>
          {message && <p style={{ color: 'green' }}>{message}</p>}
          {user ? (
            <form onSubmit={submitReview}>
              <select name="rating" value={reviewForm.rating} onChange={handleChange}>
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <textarea
                name="comment"
                placeholder="Коментар"
                value={reviewForm.comment}
                onChange={handleChange}
                required
              ></textarea>
              <button type="submit">{editingReviewId ? 'Оновити' : 'Надіслати'}</button>
            </form>
          ) : <p>Щоб залишити відгук, увійдіть у свій акаунт</p>}

          <h3>Відгуки</h3>
          {reviews.length === 0 && <p>Ще немає відгуків.</p>}
          {reviews.map((rev, idx) => (
            <div key={idx} style={{ borderTop: '1px solid #ccc', marginTop: '1rem', paddingTop: '0.5rem' }}>
              <strong>{rev.parentName}</strong> ({rev.rating} ⭐)
              <p>{rev.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>Завантаження профілю...</p>
      )}
    </div>
  );
};

export default TutorProfilePage;
