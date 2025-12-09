# HLS Audio Player
A library API that wraps around HLS.js for a better developer experience. Because audio streaming shouldn't require a PhD in streaming protocols.

## Background
I built this because I needed an audio player that supported HLS, but all the solutions I came across were either bloated or not maintained. 
Then I discovered HLS.js. It saved me but it wasn't easy! The developer experience feels like you're configuring a spaceship when all you want to do is play some music.
This library wraps all that complexity into a simple, audio-focused API that actually makes sense.

## Packages

- **[@hls-audio-player/core](./packages/core)** - Core player library (framework-agnostic)
- **[@hls-audio-player/react](./packages/react)** - React hooks wrapper

## Installation

### Core (Vanilla JS, or any framework)
```bash
npm install @hls-audio-player/core
```

### React Hook
```bash
npm install @hls-audio-player/react
```

## Quick Start

### Vanilla JavaScript
```typescript
import { HLSAudioPlayer } from '@hls-audio-player/core';

// Simple usage - because it should be this easy
const player = new HLSAudioPlayer();
await player.setSource('https://example.com/stream.m3u8');
player.play();

// Listen to events
player.on('play', () => console.log('Playing!'));
player.on('timeupdate', ({ currentTime, duration }) => {
  console.log(`${currentTime}s / ${duration}s`);
});
```

### React
```typescript
import { useHlsAudioPlayer } from '@hls-audio-player/react';

function AudioPlayer() {
  const { controls, state } = useHlsAudioPlayer({
    src: { url: 'https://example.com/stream.m3u8' },
    autoPlay: false
  });

  return (
    <div>
      <button onClick={controls.play}>Play</button>
      <button onClick={controls.pause}>Pause</button>
      <p>{state.currentTime}s / {state.duration}s</p>
    </div>
  );
}
```

### With Authentication
```typescript
const player = new HLSAudioPlayer({
  network: {
    headers: {
      'Authorization': 'Bearer your-token-here'
    }
  }
});
```

## Features
🎵 **Audio-first** - No video baggage, just pure audio streaming

🔐 **Built-in authentication** - Set headers once, use everywhere

🎛️ **Simple controls** - `play()`, `pause()`, `setVolume()` - no configuration hell

🎚️ **Quality switching** - Adaptive bitrate made easy

📊 **Event system** - Track playback state with clean, typed events

⚡ **Framework agnostic** - Works with React, Vue, Svelte, or vanilla JS

🛡️ **TypeScript ready** - Fully typed for autocomplete happiness

## API Documentation

See detailed documentation for each package:
- [Core API Documentation](./packages/core/README.md)
- [React Hook Documentation](./packages/react/README.md)

## FAQs

**Q: What the heck is HLS?**  
A: HLS (HTTP Live Streaming) is a streaming protocol created by Apple back in 2009. It works by breaking down video and audio into small chunks and serving them progressively. It's become the industry standard for streaming due to its adaptability and reliability compared to progressive download (MP3).

**Q: Why not just use HLS.js directly?**  
A: HLS.js is amazing, but it's low-level. It gives you 50+ configuration options and event handlers for everything. Want to play audio? Get ready to handle `MANIFEST_PARSED`, `LEVEL_LOADED`, `FRAG_LOADED`... or just use our `player.play()` method instead so you can focus on shipping features.

**Q: Does this work with [my JS framework]?**  
A: Yes! The core package is framework-agnostic. Use it with React, Vue, Svelte, Angular, or plain JavaScript. We have a React wrapper ready, and more framework-specific packages may come based on demand.

**Q: Can I use my own authentication headers?**  
A: Absolutely! That was one of the main pain points we solved. Set headers once in the constructor, and they'll be used for all requests.

**Q: What about video?**  
A: This library is specifically for audio streaming. There are other excellent libraries for video (like video.js). We stay focused on audio to keep things simple.

**Q: Does this support live streams?**  
A: Yes! HLS handles both live streams and on-demand audio. Just point it at your `.m3u8` playlist URL.

## Browser Support

Works in all modern browsers that support:
- MediaSource Extensions (MSE)
- HTML5 Audio

This includes Chrome, Firefox, Safari, Edge, and most mobile browsers.

## Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, check out our [Contributing Guide](CONTRIBUTING.md).

### Development Setup

1. Clone the repo
   ```bash
   git clone https://github.com/itskarelleh/hls-audio-player-ts.git
   cd hls-audio-player-ts
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Build packages
   ```bash
   npm run build
   ```

### Testing Locally with Verdaccio

If you want to test changes locally before publishing to npm:

1. **Start Verdaccio** (local npm registry)
   ```bash
   npm install -g verdaccio
   verdaccio
   ```

2. **Point npm to local registry**
   ```bash
   npm set registry http://localhost:4873
   ```

3. **Publish locally**
   ```bash
   cd packages/core
   npm run build
   npm publish
   ```

4. **Restore npm registry when done**
   ```bash
   npm set registry https://registry.npmjs.org/
   ```

## Code of Conduct

We expect all contributors to read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built on top of the excellent [HLS.js](https://github.com/video-dev/hls.js/) library.

---

Made with ❤️ for developers who just want to stream audio without the headache.