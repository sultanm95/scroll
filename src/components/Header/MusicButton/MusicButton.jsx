import React from 'react';
import { Link } from 'react-router-dom';
import './MusicButton.css';

const MusicButton = () => {
  return (
    <Link to="/music" className="music-btn" title="Музыка">
      <div className="music-text">Музыка</div>
        <img 
          src="/musicicon.svg" 
          alt="Music" 
          className="music-icon" 
        />
    </Link>
  );
};

export default MusicButton;