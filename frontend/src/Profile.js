import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`http://localhost:5000/users`, {
        credentials: 'include'
      });
      if (response.ok) {
        const users = await response.json();
        const foundUser = users.find(u => u.id == id);
        setUser(foundUser);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>{user.display_name}'s Profile</h2>
      <h3>Top Artists</h3>
      <ul>
        {user.top_artists.map((artist, index) => (
          <li key={artist.id}>
            {index + 1}. {artist.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Profile;