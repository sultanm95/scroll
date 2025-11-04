import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './SettingsPage.css';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({
    newUsername: '',
    newEmail: '',
    oldPassword: '',
    newPassword: '',
    newPassword2: '',
    currentPassword: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const closeModal = () => {
    setActiveModal(null);
    setFormData({
      ...formData,
      newUsername: '',
      newEmail: '',
      oldPassword: '',
      newPassword: '',
      newPassword2: '',
      currentPassword: ''
    });
  };

  const handleUpdateProfile = async (type) => {
    try {
      let updateData = {
        username: user.username,
        currentPassword: formData.currentPassword
      };

      switch (type) {
        case 'username':
          if (!formData.newUsername || !formData.currentPassword) {
            alert('Введите новый логин и текущий пароль!');
            return;
          }
          updateData.newUsername = formData.newUsername;
          break;

        case 'email':
          if (!formData.newEmail || !formData.currentPassword) {
            alert('Введите новый email и текущий пароль!');
            return;
          }
          updateData.newEmail = formData.newEmail;
          break;

        case 'password':
          if (!formData.oldPassword || !formData.newPassword || !formData.newPassword2) {
            alert('Заполните все поля!');
            return;
          }
          if (formData.newPassword !== formData.newPassword2) {
            alert('Новые пароли не совпадают!');
            return;
          }
          if (formData.newPassword.length < 3) {
            alert('Новый пароль слишком короткий!');
            return;
          }
          updateData = {
            ...updateData,
            newPassword: formData.newPassword,
            currentPassword: formData.oldPassword
          };
          break;

        default:
          return;
      }

      const response = await fetch('http://localhost:3001/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert('Обновление выполнено успешно!');
        closeModal();
      } else {
        alert(data.error || 'Произошла ошибка при обновлении');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Произошла ошибка при обновлении');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Настройки профиля</h1>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2>Личная информация</h2>
          <div className="settings-grid">
            <button onClick={() => setActiveModal('username')}>
              <span className="material-icons">person</span>
              Изменить имя пользователя
            </button>
            <button onClick={() => setActiveModal('email')}>
              <span className="material-icons">email</span>
              Изменить email
            </button>
            <button onClick={() => setActiveModal('password')}>
              <span className="material-icons">lock</span>
              Изменить пароль
            </button>
            <button onClick={() => setActiveModal('avatar')}>
              <span className="material-icons">image</span>
              Изменить аватар
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h2>Действия с аккаунтом</h2>
          <div className="settings-grid">
            <button className="danger" onClick={() => setActiveModal('logout')}>
              <span className="material-icons">logout</span>
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>

      {/* Модальные окна */}
      {activeModal === 'username' && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <h2>Изменить имя пользователя</h2>
            <input
              type="text"
              name="newUsername"
              placeholder="Новое имя пользователя"
              value={formData.newUsername}
              onChange={handleInputChange}
            />
            <input
              type="password"
              name="currentPassword"
              placeholder="Текущий пароль"
              value={formData.currentPassword}
              onChange={handleInputChange}
            />
            <div className="modal-actions">
              <button onClick={closeModal}>Отмена</button>
              <button onClick={() => handleUpdateProfile('username')}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'email' && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <h2>Изменить email</h2>
            <input
              type="email"
              name="newEmail"
              placeholder="Новый email"
              value={formData.newEmail}
              onChange={handleInputChange}
            />
            <input
              type="password"
              name="currentPassword"
              placeholder="Текущий пароль"
              value={formData.currentPassword}
              onChange={handleInputChange}
            />
            <div className="modal-actions">
              <button onClick={closeModal}>Отмена</button>
              <button onClick={() => handleUpdateProfile('email')}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'password' && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <h2>Изменить пароль</h2>
            <input
              type="password"
              name="oldPassword"
              placeholder="Текущий пароль"
              value={formData.oldPassword}
              onChange={handleInputChange}
            />
            <input
              type="password"
              name="newPassword"
              placeholder="Новый пароль"
              value={formData.newPassword}
              onChange={handleInputChange}
            />
            <input
              type="password"
              name="newPassword2"
              placeholder="Подтвердите новый пароль"
              value={formData.newPassword2}
              onChange={handleInputChange}
            />
            <div className="modal-actions">
              <button onClick={closeModal}>Отмена</button>
              <button onClick={() => handleUpdateProfile('password')}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'logout' && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <h2>Выйти из аккаунта</h2>
            <p>Вы уверены, что хотите выйти?</p>
            <div className="modal-actions">
              <button onClick={closeModal}>Отмена</button>
              <button className="danger" onClick={signOut}>Выйти</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}