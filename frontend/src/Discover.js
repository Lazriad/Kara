import React, { useState, useEffect } from 'react';
import MatchCard from './components/MatchCard';

function Discover() {
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/users', {
        credentials: 'include'
      });
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
        // Fetch matches for each user
        const matchPromises = usersData.map(user =>
          fetch(`http://localhost:5000/match/${user.id}`, {
            credentials: 'include'
          }).then(res => res.json()).then(match => ({ id: user.id, ...match }))
        );
        const matchResults = await Promise.all(matchPromises);
        const matchMap = {};
        matchResults.forEach(match => {
          matchMap[match.id] = match;
        });
        setMatches(matchMap);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return (
    <div>
      <h2>Discover</h2>
      <div className="user-cards">
        {users.map(user => (
          <MatchCard
            key={user.id}
            user={user}
            compatibility={matches[user.id]?.compatibility}
            sharedArtists={matches[user.id]?.shared_artists || []}
          />
        ))}
      </div>
    </div>
  );
}

export default Discover;