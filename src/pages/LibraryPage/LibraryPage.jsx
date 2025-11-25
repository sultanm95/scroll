import React from 'react';
import { useAuth } from "../../hooks/useAuth";
import UserAniListLibrary from '../../components/MangaDetails/UserAniListLibrary/UserAniListLibrary';
import './LibraryPage.css';

export function LibraryPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="library-page">
        <div className="library-empty">
          Пожалуйста, войдите в аккаунт для просмотра библиотеки
        </div>
      </div>
    );
  }

  return (
    <div className="library-page">
      <UserAniListLibrary username={user?.username} userId={user?.id} />
    </div>
  );
}