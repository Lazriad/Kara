import React, { useState } from 'react';

function CreatePlaylistButton({ otherUserId }) {
  const [playlistUrl, setPlaylistUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const createPlaylist = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/create-shared-playlist/${otherUserId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPlaylistUrl(data.playlistUrl);
      } else {
        alert('Error creating playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Error creating playlist');
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={createPlaylist} disabled={loading}>
        {loading ? 'Creating...' : 'Create Shared Playlist'}
      </button>
      {playlistUrl && (
        <p>
          Playlist created: <a href={playlistUrl} target="_blank" rel="noopener noreferrer">{playlistUrl}</a>
        </p>
      )}
    </div>
  );
}

export default CreatePlaylistButton;