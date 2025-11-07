import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './AuthModals.css';

interface SignInData {
  username: string;
  password: string;
}

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [signInData, setSignInData] = useState<SignInData>({ username: '', password: '' });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const { signIn } = useAuth();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn(signInData.username, signInData.password);
      
      if (result.success) {
        onClose();
        setSignInData({ username: '', password: '' });
        onLoginSuccess?.(); // Navigate to /profile without page reload
      } else {
        alert(result.message || 'Неверный логин или пароль');
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
      <div className="modal-window" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Вход</h2>
        <form onSubmit={handleSignIn}>
          <input
            type="text"
            placeholder="Логин"
            value={signInData.username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setSignInData(prev => ({ ...prev, username: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={signInData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setSignInData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          <button type="submit" className="btn auth-btn" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignInModal;