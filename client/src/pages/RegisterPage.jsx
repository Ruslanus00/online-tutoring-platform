import React, { useState } from 'react';
import RegisterForm from '../components/RegisterForm';

const RegisterPage = () => {
  const [emailSent, setEmailSent] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({ email: '' });

  const handleRegister = async (data) => {
    setFormData(data);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);
      setEmailSent(true);
      setMessage(responseData.message);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const resendEmail = async () => {
    const res = await fetch('http://localhost:5000/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formData.email }),
    });
    const data = await res.json();
    alert(data.message);
  };

  return (
    <div>
      {emailSent ? (
        <div>
          <h2>Підтвердження email</h2>
          <p>{message}</p>
          <button onClick={resendEmail}>Надіслати лист ще раз</button>
        </div>
      ) : (
        <>
          <h1>Реєстрація</h1>
          {message && <p style={{ color: 'red' }}>{message}</p>}
          <RegisterForm onSubmit={handleRegister} />
        </>
      )}
    </div>
  );
};

export default RegisterPage;