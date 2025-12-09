---
name: Performance Issue
about: Report performance problems with the player
title: '[Performance] '
labels: 'performance'
assignees: ''

---

## Performance Issue
Describe the performance problem you're experiencing.

## Performance Metrics
- **CPU usage**: [e.g., 80% during playback]
- **Memory usage**: [e.g., 200MB after 10 minutes]
- **Network bandwidth**: [e.g., 2Mbps for 128kbps stream]
- **Playback buffer**: [e.g., Buffer underruns every 30 seconds]

## Reproduction Steps
1. step 1

## Environment
- **Package version**: [e.g., 1.2.3]
- **Browser**: [e.g., Chrome 120, Safari 17, Firefox 121]
- **Operating System**: [e.g., macOS 14, Windows 11, Ubuntu 22.04]
- **Device specs**: [CPU, RAM, etc.]
- **Network conditions**: [e.g., 4G, WiFi, bandwidth]

## Stream Information
- **Stream bitrate**: [e.g., 128kbps, 320kbps]
- **Stream type**: [Live/VOD]
- **Segment duration**: [e.g., 6 seconds]
- **Number of quality levels**: [e.g., 3]

## Code Sample
```typescript
import { HLSAudioPlayer } from '@hls-audio-player/core';

// Your configuration and usage
const player = new HLSAudioPlayer({
  // config
});
```

## Browser DevTools Data
Please include relevant performance data if available:
- Screenshots of Performance tab
- Network waterfall
- Memory timeline
- Console logs

## Expected Performance
What performance would you consider acceptable?

## Additional Context
Any other relevant information about the performance issue.
