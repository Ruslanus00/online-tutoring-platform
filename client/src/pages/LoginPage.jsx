import React from 'react';
import LoginForm from '../components/LoginForm';
import { useSearchParams } from 'react-router-dom';

const LoginPage = () => {
  const [params] = useSearchParams();
  const verified = params.get('verified');
  return (
    <div>
      {verified === 'true' && <p style={{ color: 'green' }}>Email підтверджено. Можете увійти.</p>}
      <LoginForm />
    </div>
  );
};

export default LoginPage;