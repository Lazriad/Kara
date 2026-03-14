import React, { useState, useEffect } from 'react';

function ListeningRooms() {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    fetchRooms();
    checkPremium();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('http://localhost:5000/rooms', {
        credentials: 'include'
      });
      if (response.ok) {
        const roomsData = await response.json();
        setRooms(roomsData);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const checkPremium = async () => {
    try {
      const response = await fetch('http://localhost:5000/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const user = await response.json();
        setIsPremium(user.premium);
      }
    } catch (error) {
      console.error('Error checking premium:', error);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const response = await fetch('http://localhost:5000/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ roomName: newRoomName })
      });
      if (response.ok) {
        setNewRoomName('');
        fetchRooms();
      } else {
        alert('Error creating room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const joinRoom = async (roomId) => {
    try {
      const response = await fetch(`http://localhost:5000/rooms/join/${roomId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        alert('Joined room!');
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <div>
      <h2>Listening Rooms</h2>
      {isPremium && (
        <div>
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Room name"
          />
          <button onClick={createRoom}>Create Room</button>
        </div>
      )}
      <div className="rooms-list">
        {rooms.map((room) => (
          <div key={room.id} className="room-card">
            <h3>{room.room_name}</h3>
            <button onClick={() => joinRoom(room.id)}>Join Room</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ListeningRooms;