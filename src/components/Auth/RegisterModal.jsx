import React, { useState, useEffect } from 'react';
import './AuthModals.css';

const RegisterModal = ({ isOpen, onClose }) => {
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    avatar: 'https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=1'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleAvatarSelect = (seed) => {
    setRegisterData(prev => ({
      ...prev,
      avatar: `https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${seed}`
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerData.username || !registerData.email || !registerData.password)
      return alert('Пожалуйста, заполните все поля!');

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      const data = await res.json();

      if (res.ok) {
        alert('Регистрация успешна! Теперь войдите.');
        onClose();
        setRegisterData({
          username: '',
          email: '',
          password: '',
          avatar: 'https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=1'
        });
        window.location.hash = '#login';
      } else {
        alert(data.error || 'Ошибка регистрации');
      }
    } catch {
      alert('Ошибка сети или сервера. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Регистрация</h2>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Логин"
            value={registerData.username}
            onChange={e => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={registerData.email}
            onChange={e => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={registerData.password}
            onChange={e => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
            required
          />

          <div className="avatar-chooser">
            {[...Array(10)].map((_, i) => (
              <img
                key={i + 1}
                className={`avatar-option ${registerData.avatar.includes(`seed=${i + 1}`) ? 'selected' : ''}`}
                src={`https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${i + 1}`}
                alt={`avatar${i + 1}`}
                onClick={() => handleAvatarSelect(i + 1)}
              />
            ))}
          </div>

          <div className="register-requirements">
            <strong>Требования к регистрации:</strong>
            <ul>
              <li>Логин — не менее 3 символов</li>
              <li>Пароль — не менее 8 символов</li>
              <li>Email — должен быть реальным адресом</li>
            </ul>
          </div>

          <button type="submit" className="btn auth-btn" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
