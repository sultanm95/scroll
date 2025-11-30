import React, { useState, useEffect } from "react";
import "./MusicPage.css";
import { useAuth } from "../../components/Auth/AuthContext";
import MagicBentoMusic from "../../components/MagicBento/MagicBentoMusic";

function MusicPage() {
  const { user } = useAuth();
  const [library, setLibrary] = useState([]);

  useEffect(() => {
    if (user) {
      loadUserLibrary();
    }
  }, [user]);

  const loadUserLibrary = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/${user.id}/music-library`);
      if (response.ok) {
        const data = await response.json();
        setLibrary(data || []);
      }
    } catch (err) {
      console.error('Error loading library:', err);
    }
  };

  const handleRemoveFromLibrary = async (releaseId) => {
    if (!user) return;

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${user.id}/music-library/${releaseId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        alert('✅ Альбом удален из библиотеки');
        loadUserLibrary();
      }
    } catch (err) {
      console.error('Error removing from library:', err);
    }
  };

  return (
    <div className="music-page">
      <MagicBentoMusic />
    </div>
  );
}

export default MusicPage;
