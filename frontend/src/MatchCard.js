import React from 'react';
import { Link } from 'react-router-dom';

function MatchCard({ user, match }) {
  return (
    <div className="match-card">
      <h3>{user.display_name}</h3>
      {match && (
        <div>
          <p>Compatibility: {match.compatibility}%</p>
          <p>Shared Artists: {match.shared_artists.join(', ')}</p>
        </div>
      )}
      <Link to={`/profile/${user.id}`}>View Profile</Link>
    </div>
  );
}

export default MatchCard;