import React, { useState, useEffect } from 'react';
import './ReleaseDetails.css';

const ReleaseDetails = ({ releaseData, onAddToLibrary }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (releaseData?.id) {
      loadTracks();
    }
  }, [releaseData?.id]);

  const loadTracks = async () => {
    if (!releaseData.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3001/api/discogs/release/${releaseData.id}/tracks`
      );
      const data = await response.json();

      if (data.success) {
        setTracks(data.data.tracks || []);
      } else {
        setError('Ошибка при загрузке трека');
      }
    } catch (err) {
      setError('Ошибка при подключении');
    } finally {
      setLoading(false);
    }
  };

  const getImage = () => {
    if (releaseData?.thumb) return releaseData.thumb;
    if (releaseData?.cover_image) return releaseData.cover_image;
    if (releaseData?.images?.[0]?.uri) return releaseData.images[0].uri;
    return '/default-album.png';
  };

  const getYear = () => {
    if (releaseData?.year) return releaseData.year;
    if (releaseData?.basic_information?.year) return releaseData.basic_information.year;
    return 'Unknown';
  };

  const getArtist = () => {
    if (releaseData?.artists?.[0]?.name) return releaseData.artists[0].name;
    if (releaseData?.basic_information?.artists?.[0]?.name) {
      return releaseData.basic_information.artists[0].name;
    }
    return 'Unknown Artist';
  };

  return (
    <div className="release-details">
      <div className="release-header">
        <div className="release-cover">
          <img
            src={getImage()}
            alt={releaseData?.title || 'Album'}
            onError={(e) => {
              e.target.src = '/default-album.png';
            }}
          />
        </div>

        <div className="release-info">
          <h2 className="release-title">{releaseData?.title || 'Unknown Album'}</h2>
          <p className="release-artist">{getArtist()}</p>

          <div className="release-meta">
            {getYear() && <span className="meta-item">🗓️ {getYear()}</span>}
            {releaseData?.format && (
              <span className="meta-item">💿 {releaseData.format.join(', ')}</span>
            )}
            {releaseData?.genres && (
              <span className="meta-item">🎵 {releaseData.genres.join(', ')}</span>
            )}
          </div>

          {releaseData?.labels && releaseData.labels.length > 0 && (
            <div className="release-labels">
              <p className="labels-title">Лейблы:</p>
              <div className="labels-list">
                {releaseData.labels.map((label, idx) => (
                  <span key={idx} className="label-badge">
                    {typeof label === 'string' ? label : label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            className="add-to-library-btn"
            onClick={() => onAddToLibrary?.(releaseData)}
          >
            ➕ Добавить в библиотеку
          </button>
        </div>
      </div>

      {releaseData?.description && (
        <div className="release-description">
          <h3>Описание</h3>
          <p>{releaseData.description}</p>
        </div>
      )}

      <div className="tracklist-section">
        <h3>Треклист ({tracks.length})</h3>

        {loading && <div className="loading">Загрузка трека...</div>}
        {error && <div className="error">{error}</div>}

        {tracks.length > 0 ? (
          <div className="tracklist">
            {tracks.map((track, index) => (
              <div key={index} className="track-item">
                <span className="track-position">{track.position || index + 1}</span>
                <div className="track-content">
                  <p className="track-title">{track.title}</p>
                  {track.artists && track.artists.length > 0 && (
                    <p className="track-artists">
                      {track.artists.map(a => a.name || a).join(', ')}
                    </p>
                  )}
                </div>
                {track.duration && (
                  <span className="track-duration">{track.duration}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          !loading && <div className="no-tracks">Треклист не найден</div>
        )}
      </div>

      {releaseData?.master_id && (
        <div className="master-info">
          <p>Master ID: {releaseData.master_id}</p>
        </div>
      )}
    </div>
  );
};

export default ReleaseDetails;
