import React from 'react';
import './TrackList.css';

const TrackList = ({ tracks }) => {
  return (
    <div className="track-list">
      <table className="tracks-table">
        <thead>
          <tr>
            <th className="track-number">#</th>
            <th className="track-title">Трек</th>
            <th className="track-artist">Артист</th>
            <th className="track-duration">Длительность</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => (
            <tr key={index} className="track-row">
              <td className="track-number">{track.position || index + 1}</td>
              <td className="track-title">{track.title}</td>
              <td className="track-artist">
                {track.artists?.map(a => a.name).join(', ') || 'Unknown'}
              </td>
              <td className="track-duration">{track.duration || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrackList;
