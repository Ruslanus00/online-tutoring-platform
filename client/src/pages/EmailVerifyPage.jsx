import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EmailVerifyPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/verify/${token}`);
        if (!res.ok) throw new Error('Невірне або прострочене посилання');
        setStatus('success');

        setTimeout(() => {
          navigate('/login?verified=true');
        }, 2500);
      } catch (err) {
        setStatus('error');
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div>
      {status === 'loading' && <p>Перевіряємо підтвердження...</p>}
      {status === 'success' && <p>✅ Email підтверджено! Переадресація...</p>}
      {status === 'error' && <p style={{ color: 'red' }}>❌ Посилання недійсне або вже використано</p>}
    </div>
  );
};

export default EmailVerifyPage;
