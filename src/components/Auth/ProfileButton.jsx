import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import AuthModals from "./AuthModals";
import { useNavigate } from "react-router-dom"; // ✅ импортируем навигацию
import "./ProfileButton.css";

export function ProfileButton() {
  const { user, signOut } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("signin");
  const navigate = useNavigate(); // ✅ создаём хук

  const handleSignInClick = () => {
    setModalMode("signin");
    setShowModal(true);
  };

  const handleRegisterClick = () => {
    setModalMode("register");
    setShowModal(true);
  };

  const handleProfileClick = () => {
    navigate("/profile"); // ✅ переход на страницу профиля
  };

  if (user) {
    return (
      <div className="profile-container">
        <button
          className="profile-btn"
          onClick={handleProfileClick}
          title="Профиль"
        >
          <div className="avatar-container">
            {user.avatar ? (
              <>
                <img
                  src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:3001${user.avatar}`}
                  alt="Профиль"
                  className="avatar"
                />
                {user.avatarFrame && (
                  <img
                    src={user.avatarFrame.startsWith('http') ? user.avatarFrame : `http://localhost:3001${user.avatarFrame}`}
                    alt=""
                    className="avatar-frame"
                  />
                )}
              </>
            ) : (
              <div className="avatar-placeholder">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

                      </div>
                    </button>
                  </div>
                );
              }

  return (
    <>
      <div className="auth-buttons">
        <button className="auth-btn signin-btn" onClick={handleSignInClick}>
          Вход
        </button>
        <button className="auth-btn register-btn" onClick={handleRegisterClick}>
          Регистрация
        </button>
      </div>

      <AuthModals
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialMode={modalMode}
        onLoginSuccess={() => navigate("/profile")} // ✅ переход после входа
      />
    </>
  );
}

export default ProfileButton;
