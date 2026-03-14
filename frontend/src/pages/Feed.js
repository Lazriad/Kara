import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import AdBanner from '../components/AdBanner';
import PromotedTrackCard from '../components/PromotedTrackCard';

function Feed() {
  const [feed, setFeed] = useState([]);
  const [trending, setTrending] = useState([]);
  const [ads, setAds] = useState([]);
  const [promotedTracks, setPromotedTracks] = useState([]);

  useEffect(() => {
    fetchFeed();
    fetchTrending();
    fetchAds();
    fetchPromotedTracks();

    // Polling every 30 seconds
    const interval = setInterval(() => {
      fetchFeed();
      fetchTrending();
      fetchAds();
      fetchPromotedTracks();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await fetch('http://localhost:5000/feed', {
        credentials: 'include'
      });
      if (response.ok) {
        const feedData = await response.json();
        setFeed(feedData);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await fetch('http://localhost:5000/trending-artists', {
        credentials: 'include'
      });
      if (response.ok) {
        const trendingData = await response.json();
        setTrending(trendingData);
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
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

  const fetchPromotedTracks = async () => {
    try {
      const response = await fetch('http://localhost:5000/promoted-tracks', {
        credentials: 'include'
      });
      if (response.ok) {
        const tracksData = await response.json();
        setPromotedTracks(tracksData);
      }
    } catch (error) {
      console.error('Error fetching promoted tracks:', error);
    }
  };

  return (
    <div>
      <h2>Your Music Compatibility Feed</h2>
      <AdBanner ads={ads} />
      <div className="feed">
        {feed.map((item, index) => (
          <React.Fragment key={item.user_id}>
            <MatchCard
              user={item}
              compatibility={item.compatibility}
              sharedArtists={item.shared_artists}
            />
            {(index + 1) % 3 === 0 && <AdBanner ads={ads} />}
          </React.Fragment>
        ))}
      </div>
      {promotedTracks.length > 0 && (
        <div className="promoted-section">
          <h3>Featured Tracks</h3>
          {promotedTracks.map((track) => (
            <PromotedTrackCard key={track.id} track={track} />
          ))}
        </div>
      )}
      <div className="trending">
        <h3>Trending on Kara</h3>
        <ul>
          {trending.map((artist, index) => (
            <li key={index}>
              {artist.artist} ({artist.count} users)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Feed;