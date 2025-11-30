import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth/AuthContext';
import AuthModals from '../../Auth/AuthModals';
import './HamburgerMenu.css';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalMode, setModalMode] = useState('signin');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    closeMenu();
  };

  const handleLogout = () => {
    signOut();
    closeMenu();
    navigate('/');
  };

  const handleSignIn = () => {
    setModalMode('signin');
    setShowAuthModal(true);
    closeMenu();
  };

  const handleRegister = () => {
    setModalMode('register');
    setShowAuthModal(true);
    closeMenu();
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    handleNavigate('/profile');
  };

  return (
    <div className="hamburger-menu">
      <button
        className={`hamburger-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {isOpen && <div className="hamburger-overlay" onClick={closeMenu}></div>}

      <nav className={`hamburger-nav ${isOpen ? 'open' : ''}`}>
        <div className="hamburger-nav-content">
          <button
            className="hamburger-nav-item"
            onClick={() => handleNavigate('/catalog')}
          >
            Каталог
          </button>

          <button
            className="hamburger-nav-item"
            onClick={() => handleNavigate('/music')}
          >
            Музыка
          </button>

          <div className="hamburger-nav-divider"></div>

          {user ? (
            <>
              <button
                className="hamburger-nav-item"
                onClick={() => handleNavigate('/profile')}
              >
                Профиль
              </button>
              <button
                className="hamburger-nav-item logout"
                onClick={handleLogout}
              >
                Выход
              </button>
            </>
          ) : (
            <>
              <button
                className="hamburger-nav-item"
                onClick={handleSignIn}
              >
                Вход
              </button>
              <button
                className="hamburger-nav-item"
                onClick={handleRegister}
              >
                Регистрация
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Модалка аутентификации */}
      <AuthModals
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={modalMode}
        onLoginSuccess={handleAuthSuccess}
      />
    </div>
  );
}
