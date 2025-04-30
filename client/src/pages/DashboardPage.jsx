import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <div>
      <h1>Кабінет</h1>
      <p>Вітаю, {user?.name}</p>
      <button onClick={logout}>Вийти</button>
    </div>
  );
};

export default DashboardPage;