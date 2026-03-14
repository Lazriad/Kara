import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Discover from './Discover';
import ProfilePage from './components/ProfilePage';
import Feed from './pages/Feed';
import ListeningRooms from './pages/ListeningRooms';
import PublicProfile from './pages/PublicProfile';
import Campus from './pages/Campus';
import Notifications from './components/Notifications';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/top-artists', {
        credentials: 'include'
      });
      if (response.ok) {
        setIsLoggedIn(true);
        // Fetch current user
        const userResponse = await fetch('http://localhost:5000/me', {
          credentials: 'include'
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentUser(userData);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error checking login:', error);
      setIsLoggedIn(false);
    }
  };

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Kara</h1>
          <button onClick={handleLogin}>Login with Spotify</button>
        </header>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Kara</h1>
          <nav>
            <Link to="/feed">Feed</Link>
            <Link to="/discover">Discover</Link>
            <Link to="/rooms">Rooms</Link>
            <Notifications />
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/rooms" element={<ListeningRooms />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route path="/campus/:campusName" element={<Campus />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;