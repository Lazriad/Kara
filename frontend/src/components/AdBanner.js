import React, { useState, useEffect } from 'react';

function AdBanner({ ads }) {
  const [currentAd, setCurrentAd] = useState(null);

  useEffect(() => {
    if (ads.length > 0) {
      setCurrentAd(ads[Math.floor(Math.random() * ads.length)]);
    }
  }, [ads]);

  if (!currentAd) return null;

  return (
    <div className="ad-banner">
      <a href={currentAd.redirect_url} target="_blank" rel="noopener noreferrer">
        <img src={currentAd.image_url} alt={currentAd.advertiser_name} />
      </a>
    </div>
  );
}

export default AdBanner;