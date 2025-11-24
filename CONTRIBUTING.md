# Contributing to AudioHLS Player

## Our Philosophy

We build an **elegant API that wraps verbose HLS.js complexity**. Every contribution should make audio streaming simpler, not add more complexity.

## Getting Started
Fork the repository

Create a feature branch

Follow our API patterns

Submit a pull request

## Core Principles

### 1. Wrap, Don't Expose
```typescript
// ✅ DO: Hide HLS.js internals
player.setSource(url)

// ❌ DON'T: Expose raw HLS.js
player.hls.loadSource(url)
2. Simple → Powerful
typescript
// Simple for common cases
player.setSource(url).play()

// Powerful when needed  
player.setSource(url, {
  headers: { 'X-Custom': 'value' },
  quality: 'high'
})
```
3. Audio-First Thinking
Focus on audio-specific features:

- Crossfade between tracks

- Volume normalization

- Audio quality switching

- Stream authentication

### Development Patterns
Adding New Methods
```typescript
// Follow the naming convention: verbNoun()
interface AudioHLSPlayer {
  setCrossfade(duration: number): void;
  getQualityLevels(): QualityLevel[];
  setNormalization(enabled: boolean): void;
}

// Support headers and configuration
interface MethodOptions {
  headers?: Record<string, string>;
  [key: string]: any; // Future-proof
}
```

Configuration Design
```typescript
// Global configuration
interface PlayerConfig {
  network?: {
    headers?: Record<string, string>;
    timeout?: number;
  };
  audio?: {
    crossfade?: boolean;
    normalization?: boolean;
  };
}
```

// Method-level overrides merge with global config
Header Management
```typescript
// All network methods should support headers
player.setSource(url, { headers: { 'X-Auth': 'token' } });

// Headers merge: global + method = final headers
const finalHeaders = {
  ...globalConfig.headers,
  ...methodOptions.headers // Method overrides global
};
```
HLS.js Integration Guide
What We Abstract
Media element management

Complex event handling

Buffer configuration

Quality level management

What We Keep Simple
Audio stream loading

Playback controls

Error handling

Quality switching

Example: Wrapping HLS.js Events
```typescript
// Hide HLS.js event complexity
private setupHlsEvents() {
  this.hls.on(HLS.Events.MANIFEST_PARSED, () => {
    this.emit('playlist-ready'); // Simple event names
  });
  
  this.hls.on(HLS.Events.ERROR, (event, data) => {
    this.emit('error', this.mapHlsError(data)); // Clean error types
  });
}
```

Testing Requirements
All features must include tests for:

Header merging behavior
Configuration inheritance

Error mapping from HLS.js

Audio-specific functionality



Remember: We're making audio streaming simpler, not more complex!
