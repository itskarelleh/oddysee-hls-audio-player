# Oddysee - HLS Audio Player
A library API that wraps around HLS.js for a better developer experience. Because audio streaming shouldn't require a PhD in streaming protocols.

## Background
I built this because I needed an audio player that supported HLS, but all the solutions I came across were either bloated or not maintained. 
Then I discovered HLS.js. It saved me but it wasn't easy! The developer experience feels like you're configuring a spaceship when all you want to do is play some music.
This library wraps all that complexity into a simple, audio-focused API that actually makes sense.

## Packages

- **[oddysee-typescript](./packages/oddysee/core/README.md)** - Core player library (framework-agnostic)
- **[oddysee-react](./packages/oddysee/react/README.md)** - React hooks wrapper

## Installation

### Core (Vanilla JS, or any framework)
```bash
npm install oddysee-typescript
```

### React Hook
```bash
npm install oddysee-react
```

## Quick Start

### Vanilla JavaScript
```typescript
import { HLSAudioPlayer } from 'oddysee-typescript';

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
import { useHlsAudioPlayer } from 'oddysee-react';

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
- [Core API Documentation](./packages/oddysee/typescript/README.md)
- [React Hook Documentation](./packages/oddysee/react/README.md)

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

**Q: I installed this and it’s not working. What’s up?**
A: Don’t worry, this is a common question! Here’s what to check:

HLS Only: This player is built specifically for HLS streams (.m3u8 files). It won’t work with regular audio files like MP3 or WAV.

Progressive Audio: If you’re trying to play a standard audio file, you’ll need a different solution. Here are some options:

react-use-audio-player
 – lightweight, React-friendly, great for MP3/WAV.

howler.js
 – supports multiple formats, fades, and more advanced features. (Still functional despite last being updated a couple of years ago.)

Video-first / adaptive streaming: If you need more advanced streaming capabilities beyond HLS audio, a video library like video.js
 with HLS plugins might work, but it’s overkill for audio-only use cases.

⚠️ Pro tip: Most “all-in-one” audio players don’t handle HLS streaming properly — that’s why HLS-specific solutions are rare. If your goal is segmented streaming, Oddysee is designed for exactly that.

**If none of that worked and you're sure you need an audio only solution for your hls audio, open an issue and we'll help you out 😊**

## Origin Story

This library exists because of a classic developer “what just happened?!” moment: SoundCloud rolled out an update, and suddenly nothing was working anymore. MP3s, WAVs — all the usual endpoints were busted. The only thing that still worked was the HLS/AAC streams (.m3u8).

So we did what any reasonable, slightly stubborn developer would do: built a fully typed, framework-agnostic HLS audio player that just works. No fuss, no juggling 50+ HLS.js events, just play your audio and ship features.

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
   git clone https://github.com/itskarelleh/oddysee-hls-audio-player.git
   cd oddysee-hls-audio-player
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
   cd packages/oddysee-typescript
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

MIT - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built on top of the excellent [HLS.js](https://github.com/video-dev/hls.js/) library.

---

Made with ❤️ for developers who just want to stream audio without the headache.
