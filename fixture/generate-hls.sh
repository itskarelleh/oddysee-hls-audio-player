#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${HLS_OUT_DIR:-"$ROOT_DIR/generated"}"
DURATION_SECONDS="${HLS_DURATION_SECONDS:-90}"
SEGMENT_SECONDS="${HLS_SEGMENT_SECONDS:-4}"
BITRATE="${HLS_AUDIO_BITRATE:-128k}"
FREQUENCY="${HLS_TONE_FREQUENCY:-440}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required but was not found in PATH." >&2
  echo "Install ffmpeg, then re-run this script." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

ffmpeg -y \
  -f lavfi -i "sine=frequency=${FREQUENCY}:duration=${DURATION_SECONDS}" \
  -c:a aac -b:a "$BITRATE" \
  -f hls \
  -hls_time "$SEGMENT_SECONDS" \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_filename "$OUT_DIR/segment_%03d.ts" \
  "$OUT_DIR/audio.m3u8"

echo "Generated HLS fixture in $OUT_DIR"
