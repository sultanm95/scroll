import React, { useState, useEffect } from 'react';
import SignInModal from './SignInModal';
import './AuthModals.css';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  avatar: string;
}

interface AuthModalsProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'register';
  onLoginSuccess: () => void;
}

const AuthModals: React.FC<AuthModalsProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'signin', 
  onLoginSuccess 
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [registerData, setRegisterData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    avatar: 'https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=1'
  });

  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#login') {
        setMode('signin');
      } else if (window.location.hash === '#register') {
        setMode('register');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Close modals on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!registerData.username || !registerData.email || !registerData.password) {
      return alert('Пожалуйста, заполните все поля!');
    }

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
        setMode('signin');
        setRegisterData({
          username: '',
          email: '',
          password: '',
          avatar: 'https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=1'
        });
      } else {
        alert(data.error || 'Ошибка регистрации');
      }
    } catch (err) {
      alert('Ошибка сети или сервера. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (seed: number) => {
    setRegisterData(prev => ({
      ...prev,
      avatar: `https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${seed}`
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* SignIn Modal */}
      {mode === 'signin' && (
        <SignInModal
          isOpen={isOpen}
          onClose={onClose}
          onLoginSuccess={onLoginSuccess}
        />
      )}

      {/* Register Modal */}
      {mode === 'register' && (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-window" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
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

              <button 
                type="submit" 
                className="btn auth-btn"
                disabled={loading}
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthModals;