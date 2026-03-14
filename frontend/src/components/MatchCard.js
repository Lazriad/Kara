import React from 'react';
import { Link } from 'react-router-dom';

function MatchCard({ user, compatibility, sharedArtists }) {
  return (
    <div className="match-card">
      <h3>{user.display_name}</h3>
      <p>Compatibility: {compatibility}%</p>
      <p>Shared Artists: {sharedArtists.join(', ')}</p>
      <Link to={`/profile/${user.id || user.user_id}`}>View Profile</Link>
    </div>
  );
}

export default MatchCard;