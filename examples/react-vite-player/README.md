# Oddysee HLS Audio Player - React + Vite Example

A simple demo showing how to use the <a href="https://github.com/itskarelleh/oddysee-hls-audio-player/blob/main/packages/oddysee/react/README.md">oddysee-react</a> package.

Try it out here on  <a href="https://stackblitz.com/github/itskarelleh/oddysee-hls-audio-player/tree/main/examples/react-vite-player">StackBlitz</a>

## Features Demonstrated

- Play/Pause toggle
- Volume control
- Mute toggle
- Loading state
- Error state
- Retry logic (auto + manual)
- Duration display
- Current time display

## How This Example Is Wired

- UI and player wiring live in `src/App.tsx`.
- The hook used by the UI is `useHlsAudioPlayer`, imported from `packages/oddysee/react/src/use-hls-audio-player` (local source import for the demo).
- The hook owns player state (`state`, `isLoading`, `isPlaying`, `scrub`) and exposes `controls` for playback, seeking, and retry.
- Retry behavior is implemented in `src/App.tsx`:
  - Automatic retries are scheduled when `state.error` appears.
  - Retries call `controls.retry(maxRetryAttempts, retryDelayMs)`, which delegates to the package’s player.
  - A "Retry now" button and retry status text are part of the UI to make the behavior visible.
- Success (`canplay`) and track changes reset the retry counter and clear pending timers.

## Getting Started

```bash
cd examples/react-vite-player
npm install
npm run dev
