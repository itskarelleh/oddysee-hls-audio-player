# @use-hls-player/react

A React hook that provides a simple, intuitive interface for HLS audio streaming using the core HLS audio player.

## Installation

```bash
npm install @use-hls-player/react
# or
yarn add @use-hls-player/react
# or
pnpm add @use-hls-player/react
```

## Quick Start

```tsx
import { useHlsAudioPlayer } from '@use-hls-player/react';

function AudioPlayer() {
  const { state, controls, isLoading, isPlaying } = useHlsAudioPlayer({
    src: { url: 'https://example.com/playlist.m3u8' },
    autoPlay: false,
  });

  return (
    <div>
      <button onClick={() => isPlaying ? controls.pause() : controls.play()}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <div>
        {isLoading ? 'Loading...' : `Duration: ${state.duration}s`}
      </div>
      {state.error && <div>Error: {state.error.message}</div>}
    </div>
  );
}
```

## API Reference

### `useHlsAudioPlayer(options)`

#### Options

```typescript
interface UseHlsAudioPlayerOptions {
  config?: PlayerConfig;
  src?: { url: string; options?: SourceOptions };
  autoPlay?: boolean;
  on?: Partial<{
    [K in PlayerEvent]: (data: PlayerEventMap[K]) => void
  }>;
}
```

- **config**: Global player configuration (see PlayerConfig below)
- **src**: Initial HLS source to load
- **autoPlay**: Automatically start playback when source is ready
- **on**: Event callbacks for player events

#### Return Value

```typescript
interface UseHlsAudioPlayerResult {
  player: HLSAudioPlayerInterface | null;
  state: PlayerState;
  isPlaying: boolean;
  duration: number;
  isLoading: boolean;
  loading: boolean;
  error: PlayerError | null;
  readyState: number;
  controls: {
    setSource: (url: string, options?: SourceOptions) => Promise<void>;
    play: () => Promise<void>;
    pause: () => void;
    setVolume: (volume: number) => void;
    setCurrentTime: (time: number) => void;
  };
}
```

### Player State

```typescript
interface PlayerState {
  track: Track | null;
  currentTime: number;
  duration: number | null;
  volume: number;
  loading: boolean;
  error: PlayerError | null;
  readyState: number;
  isPlaying: boolean;
}
```

### Configuration Types

```typescript
interface PlayerConfig {
  network?: {
    headers?: Record<string, string>;
    timeout?: number;
    retryCount?: number;
  };
  audio?: {
    crossfade?: boolean;
    normalization?: boolean;
    preload?: boolean;
    volume?: number;
  };
  playback?: {
    autoPlay?: boolean;
    startTime?: number;
  };
}

interface SourceOptions {
  headers?: Record<string, string>;
  startTime?: number;
  [key: string]: any;
}
```

## Examples

### Basic Audio Player

```tsx
import { useHlsAudioPlayer } from '@use-hls-player/react';

export default function BasicPlayer() {
  const { state, controls, isLoading, isPlaying } = useHlsAudioPlayer({
    src: { url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  });

  const togglePlay = () => {
    if (isPlaying) {
      controls.pause();
    } else {
      controls.play();
    }
  };

  return (
    <div className="player">
      <button onClick={togglePlay} disabled={isLoading}>
        {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
      </button>
      
      <div className="progress">
        <input
          type="range"
          min={0}
          max={state.duration ?? 0}
          value={state.currentTime}
          onChange={(e) => controls.setCurrentTime(Number(e.target.value))}
        />
        <span>{state.currentTime.toFixed(0)}s / {state.duration?.toFixed(0) ?? '--'}s</span>
      </div>
      
      <div className="volume">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={state.volume}
          onChange={(e) => controls.setVolume(parseFloat(e.target.value))}
        />
        <span>Volume: {Math.round(state.volume * 100)}%</span>
      </div>
      
      {state.error && (
        <div className="error">Error: {state.error.message}</div>
      )}
    </div>
  );
}
```

### Playlist Player

```tsx
import { useState } from 'react';
import { useHlsAudioPlayer } from '@use-hls-player/react';

const playlist = [
  { id: 1, url: 'https://pl.streamingvideoprovider.com/mp3-playlist/playlist.m3u8', title: 'Music Playlist' },
  { id: 2, url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', title: 'Test Stream' },
  { id: 3, url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8', title: 'Live Stream' },
];

export default function PlaylistPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const currentTrack = playlist[currentTrackIndex];

  const { state, controls, isLoading, isPlaying } = useHlsAudioPlayer({
    src: { url: currentTrack.url },
    autoPlay: true,
  });

  const playTrack = (index: number) => {
    setCurrentTrackIndex(index);
  };

  const playNext = () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
  };

  const playPrevious = () => {
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
  };

  return (
    <div className="playlist-player">
      <div className="current-track">
        <h3>{currentTrack.title}</h3>
        <p>{isLoading ? 'Loading...' : isPlaying ? 'Playing' : 'Paused'}</p>
      </div>
      
      <div className="controls">
        <button onClick={playPrevious}>Previous</button>
        <button onClick={() => isPlaying ? controls.pause() : controls.play()}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={playNext}>Next</button>
      </div>
      
      <div className="playlist">
        {playlist.map((track, index) => (
          <button
            key={track.id}
            onClick={() => playTrack(index)}
            className={index === currentTrackIndex ? 'active' : ''}
          >
            {track.title}
          </button>
        ))}
      </div>
      
      {state.error && (
        <div className="error">Error: {state.error.message}</div>
      )}
    </div>
  );
}
```

### Advanced Configuration with Headers

```tsx
import { useHlsAudioPlayer } from '@use-hls-player/react';

export default function AuthenticatedPlayer() {
  const { state, controls, isLoading } = useHlsAudioPlayer({
    src: { 
      url: 'https://protected-stream.example.com/playlist.m3u8',
      options: {
        headers: {
          'Authorization': 'Bearer your-token-here',
          'User-Agent': 'MyAudioPlayer/1.0'
        }
      }
    },
    config: {
      network: {
        timeout: 10000,
        retryCount: 3
      },
      audio: {
        volume: 0.8,
        preload: true
      }
    },
    on: {
      error: (error) => console.error('Player error:', error),
      loading: () => console.log('Loading started'),
      canplay: () => console.log('Can play')
    }
  });

  return (
    <div>
      <button onClick={() => controls.play()} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Play'}
      </button>
      {state.error && <div>Authentication failed: {state.error.message}</div>}
    </div>
  );
}
```

### Event Handling

```tsx
import { useState } from 'react';
import { useHlsAudioPlayer } from '@use-hls-player/react';

export default function EventHandlingPlayer() {
  const [events, setEvents] = useState<string[]>([]);

  const { state, controls } = useHlsAudioPlayer({
    src: { url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    on: {
      play: () => setEvents(prev => [...prev, 'Playback started']),
      pause: () => setEvents(prev => [...prev, 'Playback paused']),
      loading: () => setEvents(prev => [...prev, 'Loading...']),
      canplay: () => setEvents(prev => [...prev, 'Ready to play']),
      error: (error) => setEvents(prev => [...prev, `Error: ${error.message}`]),
      timeupdate: ({ currentTime, duration }) => 
        setEvents(prev => [...prev, `Time: ${currentTime.toFixed(1)}s / ${duration?.toFixed(1) ?? '--'}s`]),
    }
  });

  return (
    <div>
      <div className="controls">
        <button onClick={() => controls.play()}>Play</button>
        <button onClick={() => controls.pause()}>Pause</button>
      </div>
      
      <div className="events">
        <h4>Events:</h4>
        {events.slice(-5).map((event, index) => (
          <div key={index}>{event}</div>
        ))}
      </div>
    </div>
  );
}
```

## Features

- **Simple Hook Interface**: Just call `useHlsAudioPlayer()` and get everything you need
- **Reactive State**: All player state is automatically synchronized with React
- **Event Handling**: Built-in support for all player events
- **TypeScript Support**: Full type safety and IntelliSense
- **Custom Headers**: Support for authenticated streams
- **Playlist Management**: Easy switching between multiple streams
- **Error Handling**: Comprehensive error reporting
- **Performance Optimized**: Efficient re-renders and cleanup

## Dependencies

- React 18+
- @hls-audio-player/core (peer dependency)

## License

Apache-2.0
