import { useState, useRef } from "react";
import "./DeezerPlayer.css";

// Simple Deezer preview player
// Works without API keys
export default function DeezerPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sample tracks to display
  const defaultTracks = [
    {
      id: 1,
      title: "Binks' Sake",
      artist: { name: "One Piece" },
      album: { cover_small: "https://images.genius.com/f2c0421ef6dbcd06eb568d9937b40eac.1000x1000x1.png" },
      preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },
    {
      id: 2,
      title: "Naruto Opening",
      artist: { name: "Naruto" },
      album: { cover_small: "https://e.snmc.io/i/300/s10919957fef2459c97b1b8c719eca6d9/5206107" },
      preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    },
    {
      id: 3,
      title: "Attack on Titan",
      artist: { name: "Shingeki no Kyojin" },
      album: { cover_small: "https://e.snmc.io/i/300/sf0bc3fc206f4b12a8f5ab4b0a05ecbed/9019372" },
      preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    }
  ];

  const allTracks = defaultTracks;

  function playTrack(index: number) {
    setCurrentIndex(index);
    const track = allTracks[index];
    if (!track?.preview) return;
    if (audioRef.current) {
      audioRef.current.src = track.preview;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function togglePlayPause() {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }

  function nextTrack() {
    if (currentIndex < allTracks.length - 1) playTrack(currentIndex + 1);
  }

  function prevTrack() {
    if (currentIndex > 0) playTrack(currentIndex - 1);
  }

  const currentTrack = allTracks[currentIndex];

  return (
    <div className="deezer-player">
      {/* Current track info */}
      {currentTrack && (
        <div className="deezer-player__current">
          <div className="deezer-player__info">
            <div className="deezer-player__track-title">{currentTrack.title}</div>
            <div className="deezer-player__artist">{currentTrack.artist.name}</div>
          </div>
        </div>
      )}

      {/* Audio player */}
      <audio ref={audioRef} className="deezer-player__audio" />

      {/* Controls */}
      <div className="deezer-player__controls">
        <button
          onClick={prevTrack}
          className="deezer-player__btn deezer-player__btn--prev"
          disabled={currentIndex === 0}
        >
          ⏮
        </button>
        <button
          onClick={togglePlayPause}
          className="deezer-player__btn deezer-player__btn--stop"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          onClick={nextTrack}
          className="deezer-player__btn deezer-player__btn--next"
          disabled={currentIndex === allTracks.length - 1}
        >
          ⏭
        </button>
      </div>
    </div>
  );
}
