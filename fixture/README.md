# Signed HLS Fixture

This fixture simulates authenticated HLS providers (short-lived signed segment URLs) to test recovery and retry logic.

## Requirements

- `ffmpeg` installed and available on your `PATH`
- Node.js 18+

## Generate sample HLS audio

```bash
./fixture/generate-hls.sh
```

Optional environment overrides:

- `HLS_OUT_DIR` (default `fixture/generated`)
- `HLS_DURATION_SECONDS` (default `90`)
- `HLS_SEGMENT_SECONDS` (default `4`)
- `HLS_AUDIO_BITRATE` (default `128k`)
- `HLS_TONE_FREQUENCY` (default `440`)

## Run the signed-segment dev server

```bash
node fixture/dev-server.js
```

The server exposes:

- `http://localhost:8787/master.m3u8`
- `http://localhost:8787/audio.m3u8`

Each playlist request rewrites segment URLs with a short-lived signature. Expired or tampered segment requests return `403`.

### Configuration

- `PORT` (default `8787`)
- `HLS_DIR` (default `fixture/generated`)
- `HLS_PLAYLIST` (default `audio.m3u8`)
- `SIGNING_SECRET` (default `oddysee-dev-secret`)
- `SIGN_TTL_SECONDS` (default `12`)

## Example usage

Point the player at the master playlist:

```ts
await player.setSource('http://localhost:8787/master.m3u8');
```

Then pause playback long enough for segment URLs to expire and verify retry/session refresh behavior.
