# Kara

A music compatibility social platform that helps you find your musical match across multiple streaming services.

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### 🚀 Easiest Way: One-Command Preview

```bash
./preview.sh
```

This automated script handles everything:
- ✅ Checks and installs dependencies
- ✅ Creates `.env` file with placeholders
- ✅ Starts both backend (port 5000) and frontend (port 3000)
- ✅ Opens browser automatically (when possible)

**What you'll see:**
- Login page with Spotify authentication
- After login: Feed, Discover, Rooms navigation
- Music compatibility matching features
- Social features (messages, playlists, rooms)

### Manual Setup

If you prefer step-by-step setup:

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lazriad/Kara.git
   cd Kara
   ```

### Quick Preview (Easiest)

```bash
./preview.sh
```

This automated script will:
- Check and install dependencies
- Create a basic `.env` file if needed
- Start both development servers

### Manual Setup

```bash
# Install all dependencies
npm run setup

# Check everything is ready
npm run status

# Start development servers
npm run preview
```

### Alternative Manual Setup

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Start development servers
npm run dev
```

## Features

- **Multi-platform music matching**: Connect Spotify, SoundCloud, Apple Music, and YouTube Music
- **Social features**: Messages, shared playlists, listening rooms
- **Campus discovery**: Find matches at your school
- **Premium features**: Ad-free experience, advanced matching
- **Real-time notifications**: Stay updated with your matches

## API Keys Setup

For full functionality, add your API keys to the `.env` file:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret
APPLE_MUSIC_TOKEN=your_apple_music_token
YOUTUBE_API_KEY=your_youtube_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Development

- Backend: Node.js + Express + SQLite
- Frontend: React + React Router
- Database: SQLite with user authentication and music data

## Troubleshooting

- Make sure you're running commands from the root directory (`/workspaces/Kara`)
- Ensure ports 3000 and 5000 are available
- Check that all dependencies are installed with `npm run setup`