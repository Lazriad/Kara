import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

function CompatibilityCard({ userA, userB, compatibility, sharedArtists }) {
  const cardRef = useRef();

  const shareLink = `${window.location.origin}/share/match/${userA}/${userB}`;

  const downloadImage = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current);
      const link = document.createElement('a');
      link.download = 'compatibility-card.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div>
      <div ref={cardRef} className="compatibility-card">
        <h2>{userA} + {userB}</h2>
        <p>Music Compatibility: {compatibility}%</p>
        <p>Shared Artists: {sharedArtists.join(', ')}</p>
      </div>
      <button onClick={() => navigator.share({ title: 'Check our music compatibility!', url: shareLink })}>
        Share
      </button>
      <button onClick={downloadImage}>Download Image</button>
    </div>
  );
}

export default CompatibilityCard;