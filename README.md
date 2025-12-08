# HLS Audio Player
A library API that wraps around HLS.js for a better developer experience. Because audio streaming shouldn't require a PhD in streaming protocols.

## Background
I built this because I needed an audio player that supported HLS, but all the solutions I came across were either bloated or not maintained. 
Then I discovered HLS.js. It saved me but it wasn't easy! The developer experience feels like you're configuring a spaceship when all you want to do is play some music.
This library wraps all that complexity into a simple, audio-focused API that actually makes sense.

## Installation
```bash
npm install @hls-audio-player/core
```

Usage
```typescript
import { HLSAudioPlayer } from '@hls-audio-player/core';

// Simple usage - because it should be this easy
const player = new HLSAudioPlayer();
await player.setSource('https://example.com/stream.m3u8');
player.play();

// With authentication headers
const player = new HLSAudioPlayer({
  network: {
    headers: {
      'Authorization': 'Bearer your-token-here'
    }
  }
});
```
## Features
🎵 Audio-first - No video baggage, just pure audio streaming

🔐 Built-in authentication - Set headers once, use everywhere

🎛️ Simple controls - play(), pause(), volume(), no configuration hell

🎚️ Quality switching - Adaptive bitrate made easy

⚡ Framework agnostic - Works with React, Vue, Svelte, or vanilla JS

🛡️ TypeScript ready - Fully typed for autocomplete

## Code of Conduct
We expect all contributors to read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## FAQs
**Q: What the heck is HLS?** <br/>
A: HLS (HTTP Live Streaming) is a streaming protocol created by Apple back in 2009. It works by breaking down video and audio into small chunks and serving them progressively. It's become the industry standard for streaming due to it's adaptability and reliability compared to progressive download(MP3)

**Q: Why not just use HLS.js directly?** <br/>
A: HLS.js is amazing, but it's low-level. It gives you 50+ configuration options and event handlers for everything. Want to play audio? Get ready to handle MANIFEST_PARSED, LEVEL_LOADED, FRAG_LOADED... or just use our player.play() method instead so you can focus on shipping features.

**Q: Does this work with [my JS framework]?** <br/>
A: Yes! We're framework-agnostic. Use it with React, Vue, Svelte, Angular, or plain JavaScript. We'll eventually have framework-specific packages for extra convenience, but the core works everywhere.

**Q: Can I use my own authentication headers?**
A: Absolutely! That was one of the main pain points we solved. Set headers once in the constructor, and they'll be used for all requests.

**Q: What about video?**<br/>
A: This library is specifically for audio streaming as there are other libraries that support.

## Contributing
We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, check out our Contributing Guide.

## License
Apache License 2.0
