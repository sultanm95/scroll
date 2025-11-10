import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import './SettingsPage.css';

interface UserInfo {
  username: string;
  avatar?: string;
  background?: string;
  email?: string;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  avatar?: string;
  background?: string;
}

type ModalType = 'username' | 'email' | 'password' | 'avatar' | 'background' | 'avatarFrame' | 'logout' | null;

interface FormData {
  newUsername: string;
  newEmail: string;
  oldPassword: string;
  newPassword: string;
  newPassword2: string;
  currentPassword: string;
}

export function SettingsPage() {
  const auth = useAuth() as any;
  const { user, signOut, updateUser } = auth;
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [formData, setFormData] = useState<FormData>({
    newUsername: '',
    newEmail: '',
    oldPassword: '',
    newPassword: '',
    newPassword2: '',
    currentPassword: ''
  });
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [uploadedBackground, setUploadedBackground] = useState<File | null>(null);
  const [avatarFrame, setAvatarFrame] = useState<string>('none');

  // Используем username из user, если есть, иначе из localStorage
  const username = (user as any)?.username || localStorage.getItem('signedInUser');
  const authToken = localStorage.getItem('authToken');

  useEffect(() => {
    // Проверка авторизации
    console.log('useEffect triggered - user:', user, 'username from state:', username, 'authToken:', authToken);
    
    if (!user || !username || !authToken) {
      console.log('User not authenticated');
      setLoading(false);
      return;
    }
    
    loadUserData();
  }, [user, username, authToken]);

  const loadUserData = async () => {
    try {
      console.log('Loading user data for:', username);
      const res = await fetch('http://localhost:3001/api/user/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      console.log('User info response status:', res.status);
      if (res.ok) {
        const data: UserInfo = await res.json();
        console.log('User info loaded:', data);
        setUserInfo(data);
      } else {
        console.error('Failed to load user info:', res.status, res.statusText);
      }
    } catch (e) {
      console.error('Error loading user info:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchJSON = async <T,>(url: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(url, options);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as any).error || 'Ошибка запроса');
    }
    return res.json();
  };

  const closeModal = () => {
    console.log('Closing modal');
    setActiveModal(null);
    setFormData({
      newUsername: '',
      newEmail: '',
      oldPassword: '',
      newPassword: '',
      newPassword2: '',
      currentPassword: ''
    });
    setSelectedAvatar(null);
    setUploadedFile(null);
    setSelectedBackground(null);
    setUploadedBackground(null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (type: 'username' | 'email' | 'password') => {
    try {
      let updateData: Record<string, string | null> = {
        username: username!,
        currentPassword: formData.currentPassword
      };

      switch (type) {
        case 'username':
          if (!formData.newUsername || !formData.currentPassword) {
            return alert('Введите новый логин и текущий пароль!');
          }
          updateData.newUsername = formData.newUsername;
          updateData.newEmail = null;
          updateData.newPassword = null;
          break;

        case 'email':
          if (!formData.newEmail || !formData.currentPassword) {
            return alert('Введите новый email и текущий пароль!');
          }
          updateData.newEmail = formData.newEmail;
          updateData.newUsername = null;
          updateData.newPassword = null;
          break;

        case 'password':
          if (!formData.oldPassword || !formData.newPassword || !formData.newPassword2) {
            return alert('Заполните все поля!');
          }
          if (formData.newPassword !== formData.newPassword2) {
            return alert('Новые пароли не совпадают!');
          }
          if (formData.newPassword.length < 3) {
            return alert('Новый пароль слишком короткий!');
          }
          updateData = {
            username: username!,
            newPassword: formData.newPassword,
            newEmail: null,
            newUsername: null,
            currentPassword: formData.oldPassword
          };
          break;
      }

      const response = await fetch('http://localhost:3001/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert('Обновление выполнено успешно!');
        
        // Обновляем localStorage и локальное состояние
        if (type === 'username' && formData.newUsername) {
          localStorage.setItem('signedInUser', formData.newUsername);
          updateUser({ username: formData.newUsername });
          window.location.reload();
        } else if (type === 'email' && formData.newEmail) {
          localStorage.setItem('userEmail', formData.newEmail);
          updateUser({ email: formData.newEmail });
          closeModal();
          loadUserData();
        } else if (type === 'password') {
          // Пароль успешно изменён
          updateUser({ passwordChanged: true });
          closeModal();
          loadUserData();
        }
      } else {
        alert(data.error || 'Произошла ошибка при обновлении');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Произошла ошибка при обновлении');
    }
  };

  const handleAvatarSave = async () => {
    if (!uploadedFile && !selectedAvatar) {
      return alert('Выберите или загрузите аватар!');
    }

    try {
      let avatarUrl: string;
      console.log('Avatar save started - uploadedFile:', !!uploadedFile, 'selectedAvatar:', selectedAvatar);

      if (uploadedFile) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(uploadedFile.type)) {
          return alert('Неверный формат файла');
        }
        if (uploadedFile.size > 2 * 1024 * 1024) {
          return alert('Файл слишком большой (макс 2MB)');
        }

        const formData = new FormData();
        formData.append('avatar', uploadedFile);
        formData.append('username', username!);
        console.log('Uploading avatar for user:', username, 'file:', uploadedFile.name);

        const data = await fetchJSON<ApiResponse>('http://localhost:3001/api/user/avatar/upload', {
          method: 'POST',
          body: formData
        });
        console.log('Avatar upload response:', data);
        avatarUrl = data.avatar!;
      } else {
        const seedMatch = selectedAvatar!.match(/seed=(\d+)/);
        avatarUrl = `https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${seedMatch ? seedMatch[1] : '1'}`;
        console.log('Saving avatar URL:', avatarUrl, 'for user:', username);
        const saveResponse = await fetchJSON<any>('http://localhost:3001/api/user/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, avatar: avatarUrl })
        });
        console.log('Avatar save response:', saveResponse);
        avatarUrl = saveResponse.avatar || avatarUrl;
      }

      console.log('Final avatar URL:', avatarUrl);
      localStorage.setItem('profileAvatar', avatarUrl);
      alert('Аватар успешно обновлен!');
      console.log('Calling updateUser with:', { avatar: avatarUrl });
      updateUser({ avatar: avatarUrl });
      console.log('updateUser called, user is now:', auth.user);
      
      // Очищаем выбранные файлы
      setSelectedAvatar(null);
      setUploadedFile(null);
      
      closeModal();
      loadUserData();
      window.dispatchEvent(new Event('avatarUpdated'));
    } catch (e) {
      console.error('Avatar save error:', e);
      alert('Ошибка при обновлении аватара: ' + (e as any).message);
    }
  };

  const handleBackgroundSave = async () => {
    if (!uploadedBackground && !selectedBackground) {
      return alert('Выберите или загрузите фон!');
    }

    try {
      let backgroundUrl: string;

      if (uploadedBackground) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(uploadedBackground.type)) {
          return alert('Неверный формат файла');
        }
        if (uploadedBackground.size > 5 * 1024 * 1024) {
          return alert('Файл слишком большой (макс 5MB)');
        }

        const formData = new FormData();
        formData.append('background', uploadedBackground);
        formData.append('username', username!);

        const data = await fetchJSON<ApiResponse>('http://localhost:3001/api/user/background/upload', {
          method: 'POST',
          body: formData
        });
        backgroundUrl = data.background!;
      } else {
        backgroundUrl = selectedBackground!;
        const saveResponse = await fetchJSON<any>('http://localhost:3001/api/user/background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, background: backgroundUrl })
        });
        backgroundUrl = saveResponse.background || backgroundUrl;
      }

      localStorage.setItem('profileBackground', backgroundUrl);
      alert('Фон успешно обновлен!');
      updateUser({ background: backgroundUrl });
      closeModal();
      loadUserData();
      window.dispatchEvent(new Event('backgroundUpdated'));
    } catch (e) {
      console.error(e);
      alert('Ошибка при обновлении фона');
    }
  };

  const handleAvatarFrameSave = async () => {
    if (!avatarFrame) {
      return alert('Выберите рамку!');
    }

    try {
      await fetchJSON('http://localhost:3001/api/user/avatar-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, avatarFrame })
      });

      localStorage.setItem('avatarFrame', avatarFrame);
      alert('Рамка аватара успешно обновлена!');
      updateUser({ avatarFrame });
      closeModal();
      loadUserData();
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Ошибка при обновлении рамки аватара');
    }
  };

  if (loading) {
    return <div className="settings-page"><p>Загрузка...</p></div>;
  }

  if (!user || !username || !authToken) {
    return (
      <div className="settings-page">
        <p>❌ Пожалуйста, войдите в систему</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Настройки профиля</h1>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2>Личная информация</h2>
          <p>Пользователь: <strong>{username}</strong></p>
          <div className="settings-grid">
            <button onClick={() => setActiveModal('username')}>
              Изменить имя пользователя
            </button>
            <button onClick={() => setActiveModal('email')}>
              Изменить email
            </button>
            <button onClick={() => setActiveModal('password')}>
              Изменить пароль
            </button>
            <button onClick={() => setActiveModal('avatar')}>
              Изменить аватар
            </button>
            <button onClick={() => setActiveModal('avatarFrame')}>
              Изменить рамку аватара
            </button>
            <button onClick={() => setActiveModal('background')}>
              Изменить фон
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h2>Действия с аккаунтом</h2>
          <div className="settings-grid">
            <button className="danger" onClick={() => setActiveModal('logout')}>
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

      {activeModal === 'avatar' && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <h2>Изменить аватар</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setUploadedFile(e.target.files?.[0] || null);
                setSelectedAvatar(null);
              }}
            />
            <p style={{ marginTop: '10px' }}>Или выберите из предложенных:</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <img
                  key={i}
                  src={`https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${i}`}
                  alt={`Avatar ${i}`}
                  onClick={() => {
                    setSelectedAvatar(`https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${i}`);
                    setUploadedFile(null);
                  }}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: selectedAvatar === `https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${i}` ? '3px solid #ff4c4c' : '3px solid #444'
                  }}
                />
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={closeModal}>Отмена</button>
              <button onClick={handleAvatarSave}>Сохранить</button>
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

      {activeModal === 'background' && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <h2>Изменить фон</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setUploadedBackground(e.target.files?.[0] || null);
                setSelectedBackground(null);
              }}
            />
            <p style={{ marginTop: '10px' }}>Или выберите из предложенных:</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
              {['images/onepiece/1/01.jpg', 'images/onepiece/693/01.jpg', 'images/bleach/1/01.jpg', 'images/naruto/1/01.jpg', 'images/deathnote/1/01.jpg'].map((bg, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedBackground(`http://localhost:3001/${bg}`);
                    setUploadedBackground(null);
                  }}
                  style={{
                    width: '100px',
                    height: '100px',
                    backgroundImage: `url('http://localhost:3001/${bg}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: selectedBackground === `http://localhost:3001/${bg}` ? '3px solid #ff4c4c' : '3px solid #444'
                  }}
                />
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={closeModal}>Отмена</button>
              <button onClick={handleBackgroundSave}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'avatarFrame' && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <h2>Изменить рамку аватара</h2>
            <p>Выберите стиль рамки:</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              {[
                { name: 'none', label: 'Без рамки' },
                { name: 'gold', label: 'Золотая' },
                { name: 'silver', label: 'Серебряная' },
                { name: 'bronze', label: 'Бронзовая' },
                { name: 'diamond', label: 'Алмазная' },
                { name: 'neon', label: 'Неоновая' }
              ].map(frame => (
                <button
                  key={frame.name}
                  onClick={() => setAvatarFrame(frame.name)}
                  style={{
                    padding: '10px 15px',
                    borderRadius: '8px',
                    border: avatarFrame === frame.name ? '3px solid #ff4c4c' : '2px solid #666',
                    backgroundColor: avatarFrame === frame.name ? '#ff4c4c' : '#333',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {frame.label}
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={closeModal}>Отмена</button>
              <button onClick={handleAvatarFrameSave}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
