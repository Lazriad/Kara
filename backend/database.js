const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'kara.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spotify_id TEXT UNIQUE,
      display_name TEXT,
      top_artists TEXT,
      premium BOOLEAN DEFAULT 0,
      subscription_start DATETIME,
      subscription_end DATETIME,
      referral_code TEXT,
      referred_by INTEGER,
      campus_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Add columns if they don't exist (ignore errors)
  db.run(`ALTER TABLE users ADD COLUMN premium BOOLEAN DEFAULT 0`, (err) => {});
  db.run(`ALTER TABLE users ADD COLUMN subscription_start DATETIME`, (err) => {});
  db.run(`ALTER TABLE users ADD COLUMN subscription_end DATETIME`, (err) => {});
  db.run(`ALTER TABLE users ADD COLUMN referral_code TEXT`, (err) => {});
  db.run(`ALTER TABLE users ADD COLUMN referred_by INTEGER`, (err) => {});
  db.run(`ALTER TABLE users ADD COLUMN campus_name TEXT`, (err) => {});
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      receiver_id INTEGER,
      message_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users (id),
      FOREIGN KEY (receiver_id) REFERENCES users (id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      advertiser_name TEXT,
      image_url TEXT,
      redirect_url TEXT,
      targeting_genres TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id INTEGER,
      room_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (host_id) REFERENCES users (id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS promoted_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artist_name TEXT,
      track_name TEXT,
      spotify_uri TEXT,
      targeting_genres TEXT,
      promotion_budget REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS user_artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      artist_name TEXT,
      source_platform TEXT,
      weight INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS connected_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      platform TEXT,
      access_token TEXT,
      refresh_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
});

function getUserBySpotifyId(spotifyId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE spotify_id = ?', [spotifyId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function createUser(spotifyId, displayName, topArtists) {
  return new Promise((resolve, reject) => {
    const topArtistsJson = JSON.stringify(topArtists);
    db.run(
      'INSERT INTO users (spotify_id, display_name, top_artists) VALUES (?, ?, ?)',
      [spotifyId, displayName, topArtistsJson],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

function updateUserTopArtists(spotifyId, topArtists) {
  return new Promise((resolve, reject) => {
    const topArtistsJson = JSON.stringify(topArtists);
    db.run(
      'UPDATE users SET top_artists = ? WHERE spotify_id = ?',
      [topArtistsJson, spotifyId],
      function(err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, spotify_id, display_name, top_artists FROM users', [], (err, rows) => {
      if (err) reject(err);
      else {
        const users = rows.map(row => ({
          ...row,
          top_artists: JSON.parse(row.top_artists)
        }));
        resolve(users);
      }
    });
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else if (row) {
        row.top_artists = JSON.parse(row.top_artists);
        resolve(row);
      } else {
        resolve(null);
      }
    });
  });
}

function getMessagesBetweenUsers(userId1, userId2) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `, [userId1, userId2, userId2, userId1], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function createMessage(senderId, receiverId, messageText) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)',
      [senderId, receiverId, messageText],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

function getAllAds() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM ads', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function createAd(advertiserName, imageUrl, redirectUrl, targetingGenres) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO ads (advertiser_name, image_url, redirect_url, targeting_genres) VALUES (?, ?, ?, ?)',
      [advertiserName, imageUrl, redirectUrl, JSON.stringify(targetingGenres)],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

function getAllRooms() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM rooms', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function createRoom(hostId, roomName) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO rooms (host_id, room_name) VALUES (?, ?)',
      [hostId, roomName],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

function getAllPromotedTracks() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM promoted_tracks', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function createPromotedTrack(artistName, trackName, spotifyUri, targetingGenres, budget) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO promoted_tracks (artist_name, track_name, spotify_uri, targeting_genres, promotion_budget) VALUES (?, ?, ?, ?, ?)',
      [artistName, trackName, spotifyUri, JSON.stringify(targetingGenres), budget],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

function updateUserPremium(userId, premium, start, end) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET premium = ?, subscription_start = ?, subscription_end = ? WHERE id = ?',
      [premium, start, end, userId],
      function(err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function getUserByReferralCode(referralCode) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE referral_code = ?', [referralCode], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function updateUserReferral(userId, referralCode, referredBy) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET referral_code = ?, referred_by = ? WHERE id = ?',
      [referralCode, referredBy, userId],
      function(err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function getReferrals(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users WHERE referred_by = ?', [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getUsersByCampus(campusName) {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, spotify_id, display_name, top_artists, campus_name FROM users WHERE campus_name = ?', [campusName], (err, rows) => {
      if (err) reject(err);
      else {
        const users = rows.map(row => ({
          ...row,
          top_artists: JSON.parse(row.top_artists)
        }));
        resolve(users);
      }
    });
  });
}

function getNotifications(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function createNotification(userId, type, message) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
      [userId, type, message],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

function getUserArtists(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM user_artists WHERE user_id = ?', [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function addUserArtist(userId, artistName, sourcePlatform, weight) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO user_artists (user_id, artist_name, source_platform, weight) VALUES (?, ?, ?, ?)',
      [userId, artistName, sourcePlatform, weight],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

function getConnectedAccounts(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM connected_accounts WHERE user_id = ?', [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function addConnectedAccount(userId, platform, accessToken, refreshToken) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO connected_accounts (user_id, platform, access_token, refresh_token) VALUES (?, ?, ?, ?)',
      [userId, platform, accessToken, refreshToken],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

module.exports = {
  getUserBySpotifyId,
  createUser,
  updateUserTopArtists,
  getAllUsers,
  getUserById,
  getMessagesBetweenUsers,
  createMessage,
  getAllAds,
  createAd,
  getAllRooms,
  createRoom,
  getAllPromotedTracks,
  createPromotedTrack,
  updateUserPremium,
  getUserByReferralCode,
  updateUserReferral,
  getReferrals,
  getUsersByCampus,
  getNotifications,
  createNotification,
  getUserArtists,
  addUserArtist,
  getConnectedAccounts,
  addConnectedAccount
};