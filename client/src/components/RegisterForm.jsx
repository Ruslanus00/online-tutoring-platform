import React, { useState } from 'react';

const subjectsList = ['Математика', 'Українська мова', 'Фізика', 'Історія', 'Хімія'];

const RegisterForm = ({ onSubmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', gender: '', age: '',
    role: '', subjects: [], email: '', password: '', confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const nextStep = () => {
    if (step === 2 && formData.role === 'батьки') setStep(3);
    else setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password.length < 6) return alert('Пароль має бути щонайменше 6 символів');
    if (formData.password !== formData.confirmPassword) return alert('Паролі не збігаються');
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {step === 1 && (
        <div>
          <h3>Крок 1: Персональні дані</h3>
          <input name="firstName" placeholder="Ім'я" value={formData.firstName} onChange={handleChange} required />
          <input name="lastName" placeholder="Прізвище" value={formData.lastName} onChange={handleChange} required />
          <select name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="">Оберіть стать</option>
            <option value="чоловіча">Чоловіча</option>
            <option value="жіноча">Жіноча</option>
          </select>
          <input name="age" type="number" placeholder="Вік" value={formData.age} onChange={handleChange} required />
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Крок 2: Роль</h3>
          <select name="role" value={formData.role} onChange={handleChange} required>
            <option value="">Оберіть роль</option>
            <option value="викладач">Викладач</option>
            <option value="батьки">Батьки</option>
          </select>
          {formData.role === 'викладач' && (
            <div>
              <p>Оберіть предмети:</p>
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
        </div>
      )}

      {step === 3 && (
        <div>
          <h3>Крок 3: Доступ</h3>
          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Пароль" value={formData.password} onChange={handleChange} required />
          <input name="confirmPassword" type="password" placeholder="Підтвердіть пароль" value={formData.confirmPassword} onChange={handleChange} required />
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        {step > 1 && <button type="button" onClick={prevStep}>Назад</button>}
        {step < 3 && <button type="button" onClick={nextStep}>Далі</button>}
        {step === 3 && <button type="submit">Зареєструватися</button>}
      </div>
    </form>
  );
};

export default RegisterForm;