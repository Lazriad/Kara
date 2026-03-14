import React from 'react';

function PromotedTrackCard({ track }) {
  const openSpotify = () => {
    window.open(`https://open.spotify.com/track/${track.spotify_uri.split(':')[2]}`, '_blank');
  };

  return (
    <div className="promoted-track-card">
      <h4>{track.track_name}</h4>
      <p>by {track.artist_name}</p>
      <button onClick={openSpotify}>Play on Spotify</button>
    </div>
  );
}

export default PromotedTrackCard;