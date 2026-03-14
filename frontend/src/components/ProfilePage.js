import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Chat from './Chat';
import CreatePlaylistButton from './CreatePlaylistButton';
import AdBanner from './AdBanner';
import CompatibilityCard from './CompatibilityCard';

function ProfilePage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [match, setMatch] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchMatch();
    fetchCurrentUser();
    fetchAds();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`http://localhost:5000/user/${id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchMatch = async () => {
    try {
      const response = await fetch(`http://localhost:5000/match/${id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const matchData = await response.json();
        setMatch(matchData);
      }
    } catch (error) {
      console.error('Error fetching match:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('http://localhost:5000/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchAds = async () => {
    try {
      const response = await fetch('http://localhost:5000/ads', {
        credentials: 'include'
      });
      if (response.ok) {
        const adsData = await response.json();
        setAds(adsData);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const upgradeToPremium = async () => {
    try {
      const response = await fetch('http://localhost:5000/create-checkout-session', {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error upgrading:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>{user.display_name}'s Profile</h2>
      {match && (
        <div>
          <p>Compatibility: {match.compatibility}%</p>
          <p>Shared Artists: {match.shared_artists.join(', ')}</p>
        </div>
      )}
      <AdBanner ads={ads} />
      <h3>Top Artists</h3>
      <ul>
        {user.top_artists.map((artist, index) => (
          <li key={artist.id}>
            {index + 1}. {artist.name}
          </li>
        ))}
      </ul>
      <CreatePlaylistButton otherUserId={id} />
      {!currentUser?.premium && (
        <button onClick={upgradeToPremium}>Upgrade to Premium</button>
      )}
      <button onClick={() => setShowShare(!showShare)}>Share Compatibility</button>
      {showShare && match && currentUser && (
        <CompatibilityCard
          userA={currentUser.display_name}
          userB={user.display_name}
          compatibility={match.compatibility}
          sharedArtists={match.shared_artists}
        />
      )}
      <Chat otherUserId={id} otherUserName={user.display_name} currentUserId={currentUser?.id} />
    </div>
  );
}

export default ProfilePage;