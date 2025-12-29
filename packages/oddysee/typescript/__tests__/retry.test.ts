import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HLSAudioPlayer } from '../src/hls-audio-player';

vi.mock('hls.js', () => {
    class MockHls {
        static Events = {
            MANIFEST_PARSED: 'MANIFEST_PARSED',
            ERROR: 'ERROR',
            LEVEL_SWITCHED: 'LEVEL_SWITCHED',
        };
        levels: any[] = [];
        currentLevel = 0;
        on = vi.fn();
        attachMedia = vi.fn();
        loadSource = vi.fn();
        destroy = vi.fn();
    }

    return { default: MockHls };
});

class MockAudio {
    currentTime = 0;
    duration = NaN;
    readyState = 0;
    volume = 1;
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
}

let OriginalAudio: any;

beforeEach(() => {
    OriginalAudio = (globalThis as any).Audio;
    (globalThis as any).Audio = MockAudio;
});

afterEach(() => {
    (globalThis as any).Audio = OriginalAudio;
    vi.clearAllMocks();
});

describe('player.retry()', () => {
    it('should retry loading the source', () => {
        const player = new HLSAudioPlayer({});
        player.retry();
    });

    it('should retry loading the source with a custom retry count', () => {
        const player = new HLSAudioPlayer({});
        player.retry(3);
    });

    it('should retry loading the source with a custom retry interval', () => {
        const player = new HLSAudioPlayer({});
        player.retry(undefined, 1000);
    });

    it('should retry loading the source with a custom retry count and interval', () => {
        const player = new HLSAudioPlayer({});
        player.retry(3, 1000);
    });
});