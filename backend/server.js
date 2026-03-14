const express = require('express');
const axios = require('axios');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();
const db = require('./database');
const match = require('./match');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Add platform configs
const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
const SOUNDCLOUD_CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET;
const APPLE_MUSIC_TOKEN = process.env.APPLE_MUSIC_TOKEN;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const app = express();
const PORT = 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // for http
}));

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.get('/login', (req, res) => {
  const scope = 'user-top-read playlist-modify-public';
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const ref = req.query.ref;
  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = response.data;
    req.session.access_token = access_token;

    // Fetch user profile
    const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const { id: spotify_id, display_name } = profileResponse.data;

    // Fetch top artists
    const topArtistsResponse = await axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const topArtists = topArtistsResponse.data.items.map(artist => ({
      id: artist.id,
      name: artist.name
    }));

    // Store in user_artists
    for (let i = 0; i < topArtists.length; i++) {
      const weight = 10 - i; // Higher weight for top artists
      await db.addUserArtist(user.id, topArtists[i].name, 'spotify', weight);
    }

    // Store connected account
    await db.addConnectedAccount(user.id, 'spotify', access_token, null);

    // Check if user exists
    let user = await db.getUserBySpotifyId(spotify_id);
    if (user) {
      // Update top artists
      await db.updateUserTopArtists(spotify_id, topArtists);
    } else {
      // Create new user
      const referralCode = Math.random().toString(36).substring(2, 15);
      let referredBy = null;
      if (ref) {
        const referrer = await db.getUserByReferralCode(ref);
        if (referrer) {
          referredBy = referrer.id;
        }
      }
      user = await db.createUser(spotify_id, display_name, topArtists);
      await db.updateUserReferral(user.id, referralCode, referredBy);
    }

    req.session.user_id = user.id;
    res.redirect('http://localhost:3000');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error during authentication');
  }
});

app.get('/top-artists', async (req, res) => {
  const access_token = req.session.access_token;
  if (!access_token) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching top artists');
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching users');
  }
});

app.get('/match/:id', async (req, res) => {
  const currentUserId = req.session.user_id;
  const otherUserId = req.params.id;

  if (!currentUserId) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const currentUser = await db.getUserById(currentUserId);
    const otherUser = await db.getUserById(otherUserId);

    if (!currentUser || !otherUser) {
      return res.status(404).send('User not found');
    }

    const compatibility = match.calculateCompatibility(currentUser.top_artists, otherUser.top_artists);
    res.json(compatibility);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error calculating match');
  }
});

app.get('/user/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching user');
  }
});

app.get('/me', async (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).send('Not authenticated');
  }
  try {
    const user = await db.getUserById(userId);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching user');
  }
});

app.get('/messages/:userId', async (req, res) => {
  const currentUserId = req.session.user_id;
  const otherUserId = req.params.userId;

  if (!currentUserId) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const messages = await db.getMessagesBetweenUsers(currentUserId, otherUserId);
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching messages');
  }
});

app.post('/messages', express.json(), async (req, res) => {
  const currentUserId = req.session.user_id;
  const { receiverId, messageText } = req.body;

  if (!currentUserId) {
    return res.status(401).send('Not authenticated');
  }

  if (!receiverId || !messageText) {
    return res.status(400).send('Missing receiverId or messageText');
  }

  try {
    const message = await db.createMessage(currentUserId, receiverId, messageText);
    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending message');
  }
});

app.post('/create-shared-playlist/:userId', async (req, res) => {
  const currentUserId = req.session.user_id;
  const otherUserId = req.params.userId;
  const access_token = req.session.access_token;

  if (!currentUserId || !access_token) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const currentUser = await db.getUserById(currentUserId);
    const otherUser = await db.getUserById(otherUserId);

    if (!currentUser || !otherUser) {
      return res.status(404).send('User not found');
    }

    // Get current user's Spotify ID
    const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const spotifyUserId = profileResponse.data.id;

    // Combine artists
    const allArtists = [...currentUser.top_artists, ...otherUser.top_artists];
    const uniqueArtists = allArtists.filter((artist, index, self) =>
      index === self.findIndex(a => a.id === artist.id)
    );

    // Get top tracks for each artist
    const trackPromises = uniqueArtists.slice(0, 5).map(async (artist) => {
      const tracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      return tracksResponse.data.tracks.slice(0, 2); // 2 tracks per artist
    });

    const tracksArrays = await Promise.all(trackPromises);
    const tracks = tracksArrays.flat().map(track => track.uri);

    // Create playlist
    const playlistResponse = await axios.post(`https://api.spotify.com/v1/users/${spotifyUserId}/playlists`, {
      name: `Kara Shared Playlist - ${currentUser.display_name} & ${otherUser.display_name}`,
      description: 'A playlist created by Kara based on shared music taste',
      public: true
    }, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const playlistId = playlistResponse.data.id;

    // Add tracks
    await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      uris: tracks
    }, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ playlistUrl: playlistResponse.data.external_urls.spotify });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating playlist');
  }
});

app.get('/feed', async (req, res) => {
  const currentUserId = req.session.user_id;
  if (!currentUserId) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const currentUser = await db.getUserById(currentUserId);
    const allUsers = await db.getAllUsers();
    const otherUsers = allUsers.filter(user => user.id !== currentUserId);

    const matches = otherUsers.map(user => {
      const compatibility = match.calculateCompatibility(currentUser.top_artists, user.top_artists);
      return {
        user_id: user.id,
        display_name: user.display_name,
        compatibility: compatibility.compatibility,
        shared_artists: compatibility.shared_artists
      };
    });

    // Sort by compatibility descending
    matches.sort((a, b) => b.compatibility - a.compatibility);

    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching feed');
  }
});

app.get('/trending-artists', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    const artistCount = {};

    users.forEach(user => {
      user.top_artists.forEach(artist => {
        if (artistCount[artist.name]) {
          artistCount[artist.name]++;
        } else {
          artistCount[artist.name] = 1;
        }
      });
    });

    const trending = Object.entries(artistCount)
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    res.json(trending);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching trending artists');
  }
});

app.get('/ads', async (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const user = await db.getUserById(userId);
    if (user.premium) {
      return res.json([]);
    }
    const ads = await db.getAllAds();
    res.json(ads);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching ads');
  }
});

app.get('/promoted-tracks', async (req, res) => {
  try {
    const tracks = await db.getAllPromotedTracks();
    res.json(tracks);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching promoted tracks');
  }
});

app.post('/create-checkout-session', async (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Kara Premium Subscription',
            description: 'Monthly premium subscription for Kara',
          },
          unit_amount: 600, // $6.00
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
      metadata: {
        user_id: userId.toString(),
      },
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating checkout session');
  }
});

// Webhook for Stripe (simplified, in production use proper webhook)
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  // Verify signature in production
  const event = req.body;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.user_id;
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    await db.updateUserPremium(userId, 1, start.toISOString(), end.toISOString());
  }

  res.json({ received: true });
});

app.post('/rooms', async (req, res) => {
  const userId = req.session.user_id;
  const { roomName } = req.body;

  if (!userId) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const user = await db.getUserById(userId);
    if (!user.premium) {
      return res.status(403).send('Premium required to create rooms');
    }
    const room = await db.createRoom(userId, roomName);
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating room');
  }
});

app.get('/rooms', async (req, res) => {
  try {
    const rooms = await db.getAllRooms();
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching rooms');
  }
});

app.post('/rooms/join/:roomId', async (req, res) => {
  const userId = req.session.user_id;
  const roomId = req.params.roomId;

  if (!userId) {
    return res.status(401).send('Not authenticated');
  }

  // For now, just return success, in real app handle participants
  res.json({ message: 'Joined room' });
});

app.get('/admin/stats', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    const premiumUsers = users.filter(u => u.premium);
    res.json({
      totalUsers: users.length,
      premiumUsers: premiumUsers.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching stats');
  }
});

app.post('/admin/ads', express.json(), async (req, res) => {
  const { advertiserName, imageUrl, redirectUrl, targetingGenres } = req.body;
  try {
    const ad = await db.createAd(advertiserName, imageUrl, redirectUrl, targetingGenres);
    res.json(ad);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating ad');
  }
});

app.get('/share/match/:userA/:userB', async (req, res) => {
  const userAId = req.params.userA;
  const userBId = req.params.userB;

  try {
    const userA = await db.getUserById(userAId);
    const userB = await db.getUserById(userBId);

    if (!userA || !userB) {
      return res.status(404).send('User not found');
    }

    const compatibility = match.calculateCompatibility(userA.top_artists, userB.top_artists);

    res.json({
      userA: userA.display_name,
      userB: userB.display_name,
      compatibility: compatibility.compatibility,
      shared_artists: compatibility.shared_artists,
      profileLinkA: `${req.protocol}://${req.get('host')}/u/${userA.display_name}`,
      profileLinkB: `${req.protocol}://${req.get('host')}/u/${userB.display_name}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating share card');
  }
});

app.get('/u/:username', async (req, res) => {
  const username = req.params.username;

  try {
    // Assuming display_name is unique, but in real app, use username field
    const users = await db.getAllUsers();
    const user = users.find(u => u.display_name === username);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // For public view, return basic info
    res.json({
      display_name: user.display_name,
      top_artists: user.top_artists,
      campus_name: user.campus_name
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching public profile');
  }
});

app.get('/referrals/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const referrals = await db.getReferrals(userId);
    res.json({ count: referrals.length, referrals });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching referrals');
  }
});

app.get('/campus/:campusName', async (req, res) => {
  const campusName = req.params.campusName;

  try {
    const users = await db.getUsersByCampus(campusName);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching campus users');
  }
});

app.get('/notifications', async (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const notifications = await db.getNotifications(userId);
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching notifications');
  }
});

app.post('/notifications', express.json(), async (req, res) => {
  const { userId, type, message } = req.body;

  try {
    const notification = await db.createNotification(userId, type, message);
    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating notification');
  }
});

app.get('/login/soundcloud', (req, res) => {
  const scope = 'non-expiring';
  const authUrl = `https://api.soundcloud.com/connect?client_id=${SOUNDCLOUD_CLIENT_ID}&redirect_uri=${encodeURIComponent('http://localhost:5000/callback/soundcloud')}&response_type=code_and_token&scope=${encodeURIComponent(scope)}&display=popup`;
  res.redirect(authUrl);
});

app.get('/callback/soundcloud', async (req, res) => {
  const code = req.query.code;
  const userId = req.session.user_id;

  if (!userId) {
    return res.status(401).send('Not authenticated');
  }

  try {
    // Exchange code for token
    const tokenResponse = await axios.post('https://api.soundcloud.com/oauth2/token', {
      client_id: SOUNDCLOUD_CLIENT_ID,
      client_secret: SOUNDCLOUD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:5000/callback/soundcloud',
      code: code
    });

    const accessToken = tokenResponse.data.access_token;

    // Fetch followed artists
    const followingsResponse = await axios.get('https://api.soundcloud.com/me/followings', {
      headers: { 'Authorization': `OAuth ${accessToken}` },
      params: { limit: 50 }
    });

    const artists = followingsResponse.data.collection.filter(item => item.kind === 'user');

    // Store artists
    for (let i = 0; i < artists.length; i++) {
      await db.addUserArtist(userId, artists[i].username, 'soundcloud', 5);
    }

    // Store connected account
    await db.addConnectedAccount(userId, 'soundcloud', accessToken, null);

    res.redirect('http://localhost:3000');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error connecting SoundCloud');
  }
});

app.get('/user-artists/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const artists = await db.getUserArtists(userId);
    res.json(artists);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching user artists');
  }
});

app.get('/connected-accounts', async (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const accounts = await db.getConnectedAccounts(userId);
    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching connected accounts');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
