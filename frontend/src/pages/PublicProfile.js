import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function PublicProfile() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchUser();
    checkLogin();
  }, [username]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`http://localhost:5000/u/${username}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const checkLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/top-artists', {
        credentials: 'include'
      });
      setIsLoggedIn(response.ok);
    } catch (error) {
      setIsLoggedIn(false);
    }
  };

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>{user.display_name}'s Public Profile</h2>
      {user.campus_name && <p>Campus: {user.campus_name}</p>}
      <h3>Top Artists</h3>
      <ul>
        {user.top_artists.map((artist, index) => (
          <li key={artist.id}>
            {index + 1}. {artist.name}
          </li>
        ))}
      </ul>
      {!isLoggedIn && (
        <button onClick={handleLogin}>Join Kara</button>
      )}
    </div>
  );
}

export default PublicProfile;