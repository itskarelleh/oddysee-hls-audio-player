# Changelog

## 0.2.0 (2026-02-15)

### New Features

- **Deferred seeking** — Three-phase seek model (`beginSeek`, `updateSeek`, `commitSeek`) that separates scrubbing gestures from media seeks, preventing audio glitches during fast scrubbing (#26)
- **Session lifecycle** — Automatic stale stream detection and recovery after idle periods. When a user returns to an inactive tab, the player re-fetches the source transparently before resuming (#41)
- **Auth error recovery** — Automatic handling of 401/403 errors with cooldown-based retry. Expired tokens no longer crash the player; it re-loads the source and resumes playback (#41)
- **Retry logic** — `player.retry(count?, interval?)` method for manual or automatic recovery from network errors (#25)
- **`playAsync()`** — Promise-based alternative to `play()` for explicit error handling on autoplay and resume
- **`getState()`** — Single method to snapshot the full player state (track, currentTime, duration, volume, loading, error, readyState, isPlaying)
- **`getVolume()`** — Getter for current volume level
- **`isPlaying` getter** — Read the playback state directly from the player instance instead of tracking it manually
- **Normalized HLS errors** — Raw hls.js error events are now normalized into clean `PlayerError` objects with consistent codes (`NETWORK_ERROR`, `MEDIA_ERROR`, `PLAYBACK_ERROR`, `FORMAT_NOT_SUPPORTED`, `UNKNOWN_ERROR`)

### React (`oddysee-react`)

- **`scrub` object** — High-level scrubbing API on the hook return (`scrub.begin()`, `scrub.update()`, `scrub.commit()`, `scrub.displayTime`) with automatic seek-bar event binding
- **`controls.beginSeek` / `updateSeek` / `commitSeek`** — Low-level seek methods exposed on the controls object
- **Next.js example** — New example project demonstrating usage in a Next.js app

### Documentation

- Added deferred seeking examples to both TypeScript and React READMEs
- Added retry usage example to TypeScript README
- Added session lifecycle to root README features
- Added beta disclaimer to all packages

### Tooling & DX

- Signed HLS fixture server for local dev testing with authenticated/expiring segment URLs
- StackBlitz integration for the basic player example
- Test suites added for both core and React packages
- Added SECURITY.md, CONTRIBUTING.md, and issue templates

## 0.1.0

Initial release.

- Core HLS audio player wrapping hls.js
- `setSource()`, `play()`, `pause()`, `setVolume()`
- Event system (`on`/`off`) with typed events
- Quality level switching (`getQualityLevels`, `setQuality`)
- Custom header support via `network.headers` config
- React hook (`useHlsAudioPlayer`)
- Basic player example project
