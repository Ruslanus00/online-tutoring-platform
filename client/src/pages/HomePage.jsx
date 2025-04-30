import React from 'react';
import { Link } from 'react-router-dom';
import previewImage from '../assets/preview.jpg';
import demoVideo from '../assets/demo.mp4';

const HomePage = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Ласкаво просимо на платформу онлайн-репетиторства!</h1>
      <p>
        Цей сайт — твій найкращий помічник у навчанні. Тут ти можеш знайти викладача або самостійно викладати,
        керувати заняттями, переглядати свій профіль, листуватися в чаті та навіть оплачувати навчання — усе в одному місці!
      </p>

      <h2>Чому ми?</h2>
      <ul>
        <li>🔍 Швидкий пошук репетиторів</li>
        <li>📚 Професійні викладачі з перевіреним досвідом</li>
        <li>💬 Онлайн чат між батьками та викладачами</li>
        <li>🎥 Інтеграція з відеозв’язком та дошкою</li>
        <li>🔐 Надійна система реєстрації та безпеки</li>
      </ul>

      <div style={{ marginTop: '2rem' }}>
        <img src={previewImage} alt="сайт прев'ю" style={{ maxWidth: '100%', borderRadius: '8px' }} />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <video controls width="100%" style={{ borderRadius: '8px' }}>
          <source src={demoVideo} type="video/mp4" />
          Ваш браузер не підтримує відтворення відео.
        </video>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link to="/register">
          <button style={{ padding: '1rem 2rem', fontSize: '1rem', cursor: 'pointer' }}>Спробувати безкоштовно</button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;