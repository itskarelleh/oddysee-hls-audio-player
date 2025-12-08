# @hls-audio-player/core

Low-level, strongly-typed audio player built on top of [hls.js](https://github.com/video-dev/hls.js), focused on audio streaming. This package does **not** depend on React – it just gives you a clean class API you can wire into any UI.

---

## Installation

```bash
npm install @hls-audio-player/core hls.js
# or
yarn add @hls-audio-player/core hls.js
```

---

## Quick start

```ts
import { HLSAudioPlayer } from '@hls-audio-player/core';

const player = new HLSAudioPlayer({
  network: {
    headers: {
      Authorization: 'Bearer <token>',
    },
  },
  playback: {
    autoPlay: true,
  },
});

// Load a stream (HLS or regular audio URL)
await player.setSource('https://example.com/audio/stream.m3u8');

// Start playback
player.play();
```

---

## Core concepts

- **Player instance** – `new HLSAudioPlayer(config?)` creates and owns an internal `<audio>` element and an `Hls` instance.
- **Source** – `setSource(url, options?)` loads an HLS manifest or direct audio URL.
- **Events** – subscribe with `on(event, callback)` to react to playback, errors, time updates, etc.
- **State** – call `getState()` to read the current track & playback state in one object.
- **Audio element** – call `getAudioElement()` to integrate with existing UI or audio pipelines.

---

## Configuration

```ts
type PlayerConfig = {
  network?: {
    headers?: Record<string, string>;
    timeout?: number;
    retryCount?: number;
  };
  audio?: {
    crossfade?: boolean;
    normalization?: boolean;
    preload?: boolean;
    volume?: number; // 0–1
  };
  playback?: {
    autoPlay?: boolean;
    startTime?: number; // seconds
  };
};
```

All fields are optional – you can start with `new HLSAudioPlayer()` and grow as needed.

---

## Loading a source

```ts
await player.setSource('https://example.com/audio/stream.m3u8', {
  headers: {
    'X-Custom-Header': 'value',
  },
  startTime: 30, // start at 30s if supported by the stream
});

// You can now call player.play()
```

`setSource` returns a `Promise<HLSAudioPlayer>` and resolves when the manifest is parsed and the playlist is ready.

---

## Listening to events

Events are strongly typed. Available events:

- `play`, `pause`, `track-end`
- `loading`, `canplay`, `playlist-ready`
- `loadedmetadata`, `timeupdate`
- `quality-change`, `error`

```ts
// Time updates (progress bar, elapsed time)
player.on('timeupdate', ({ currentTime, duration }) => {
  console.log('time:', currentTime, 'duration:', duration);
});

// Track metadata
player.on('loadedmetadata', (track) => {
  console.log('track loaded:', track);
});

// Errors
player.on('error', (error) => {
  console.error('player error:', error.code, error.message, error.details);
});

// Quality changes
player.on('quality-change', (quality) => {
  console.log('quality:', quality.name, quality.bitrate);
});

// Unsubscribe
const onPause = () => console.log('paused');
player.on('pause', onPause);
player.off('pause', onPause);
```

---

## Reading state

Use `getState()` when you need a snapshot of the current player state (e.g. in a polling loop or to initialize UI):

```ts
const state = player.getState();

console.log(state.track);       // current Track | null
console.log(state.currentTime); // seconds
console.log(state.duration);    // seconds | null
console.log(state.volume);      // 0–1
console.log(state.loading);     // boolean
console.log(state.error);       // PlayerError | null
console.log(state.readyState);  // HTMLMediaElement.readyState
```

You can still call `getCurrentTrack()` directly if you only care about the track:

```ts
const track = player.getCurrentTrack();
```

---

## Controlling playback & quality

```ts
// Basic controls
player.play();
player.pause();

// Volume (0–1)
player.setVolume(0.5);
const volume = player.getVolume();

// Quality levels
const levels = player.getQualityLevels();
// e.g. [{ id: 0, name: 'low', bitrate: 128000 }, ...]

// Set by id
player.setQuality(levels[0].id);

// Or by name ('low' | 'medium' | 'high')
player.setQuality('high');
```

---

## Accessing the underlying `<audio>` element

If you need direct access to the `HTMLAudioElement` (for attaching to your DOM, using Web Audio API, etc.):

```ts
const audioElement = player.getAudioElement();

// Example: attach to DOM
document.body.appendChild(audioElement);

// Example: adjust native properties
audioElement.playbackRate = 1.25;
```

The core class manages this element’s lifecycle, so prefer using the `player` methods for playback/volume when possible.

---

## Cleanup

```ts
player.destroy();
```

`destroy()` will:

- Tear down the underlying `hls.js` instance.
- Remove the internal `<audio>` element from the DOM.
- Clear all event listeners and reset internal state.

You can safely call `destroy()` multiple times; extra calls are ignored.

---

## TypeScript support

This package ships with TypeScript types out of the box, including:

- `HLSAudioPlayerInterface`
- `Track`, `QualityLevel`, `PlayerError`
- `PlayerState`, `PlayerEvent`, `PlayerEventMap`

These types make it straightforward to build your own providers, hooks, or UI components on top of the core player.

