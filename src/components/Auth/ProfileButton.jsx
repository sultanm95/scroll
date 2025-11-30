import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import "./ProfileButton.css";

export function ProfileButton() {
  const { user } = useAuth();
  const [forceUpdate, setForceUpdate] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Слушаем события обновления аватара и фона
    const handleAvatarUpdate = () => {
      console.log('Avatar updated event received');
      setForceUpdate(prev => prev + 1);
    };
    
    const handleBackgroundUpdate = () => {
      console.log('Background updated event received');
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    window.addEventListener('backgroundUpdated', handleBackgroundUpdate);

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
      window.removeEventListener('backgroundUpdated', handleBackgroundUpdate);
    };
  }, []);

  const handleProfileClick = () => {
    navigate("/profile");
  };

  // Показываем профиль только если пользователь авторизован
  if (!user) {
    return null;
  }

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

export default ProfileButton;
