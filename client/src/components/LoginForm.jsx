import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const LoginForm = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      login(data.token, data.user);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Вхід</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Увійти</button>
    </form>
  );
};

export default LoginForm;