# Sonar

A modern, cross-platform media player for IPTV streams and M3U playlists. Built with React, TypeScript, and Tauri for desktop distribution.

## Features

- **IPTV Support** - Connect to Xtream API servers for live TV streaming
- **M3U Playlist Support** - Import and play M3U playlist files
- **HLS Playback** - High-quality streaming with HLS.js
- **Modern UI** - Beautiful interface built with shadcn/ui components
- **Dark/Light Theme** - Automatic theme switching with system preference support
- **Focus Mode** - Audio-only playback for background listening
- **Cross-Platform** - Desktop app built with Tauri (Windows, macOS, Linux)
- **Fast & Responsive** - Built with React and optimized for performance

## Usage

### Adding IPTV Sources

1. Open the app and go to the channel selector
2. Enter your Xtream API credentials (URL, Username, Password)
3. Browse and select channels to play

### Loading M3U Playlists

1. Go to Settings in the control panel
2. Use the playlist import feature to load M3U files
3. Browse and play channels from your playlists

### Playback Controls

- **Grid View**: Browse channels in a grid layout
- **Focus Mode**: Toggle audio-only playback
- **Theme**: Switch between light/dark themes
- **Settings**: Access advanced options

## Project Structure

```
sonar/
├── apps/
│   ├── web/                    # Frontend React application
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── lib/           # Utilities and API clients
│   │   │   ├── routes/        # TanStack Router pages
│   │   │   └── store/         # Zustand state management
│   │   └── src-tauri/         # Tauri desktop app
├── packages/
│   ├── config/                # Shared TypeScript/Biome config
│   └── env/                   # Environment configuration
```

## Tech Stack

- **Frontend**: React 19, TypeScript, TanStack Router
- **Styling**: Tailwind CSS, shadcn/ui components
- **Video**: HLS.js, VidStack player
- **State**: Zustand
- **Build**: Vite, Turborepo
- **Desktop**: Tauri (Rust)
- **Linting**: Biome

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you find this project helpful, please consider starring the repository!