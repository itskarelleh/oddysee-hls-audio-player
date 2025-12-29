---
name: Bug Report
about: Create a report to help us improve
title: '[Bug] '
labels: 'bug'
assignees: ''

---

## Bug Description
A clear and concise description of what the bug is.

## Reproduction Steps
Please provide detailed steps to reproduce the issue:

1. Install version: `npm install oddysee-typescript@x.x.x`
2. Use this code:
   ```typescript
   // Your code here
   ```
3. Error occurs when: [describe the action]

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened. Include error messages, console output, etc.

## Environment
- **Package version**: [e.g., 1.2.3]
- **Browser**: [e.g., Chrome 120, Safari 17, Firefox 121]
- **Operating System**: [e.g., macOS 14, Windows 11, Ubuntu 22.04]
- **Node.js version**: [if applicable]
- **Framework**: [e.g., React 18, Vue 3, vanilla JS]

## Stream URL (if applicable)
If the bug is specific to a particular HLS stream, please provide the URL (or a similar test stream if the original is private).

## Additional Context
Add any other context about the problem here, such as:
- Network conditions
- Authentication setup
- Related console warnings
- Screenshots if relevant

## Code Sample
Please provide a minimal reproduction case:

```typescript
import { HLSAudioPlayer } from 'oddysee-typescript';

// Minimal code that reproduces the issue
const player = new HLSAudioPlayer();
// ... your code
```
