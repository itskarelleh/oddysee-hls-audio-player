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

describe('beginSeek', () => {
    it('enables preview updates via updateSeek', () => {
        const player = new HLSAudioPlayer({});
        const audio = player.getAudioElement() as unknown as MockAudio;

        audio.currentTime = 5;
        player.updateSeek(10);
        expect(audio.currentTime).toBe(5);

        player.beginSeek();
        player.updateSeek(10);
        expect(audio.currentTime).toBe(10);
    });
});

describe('updateSeek', () => {
    it('does nothing when not seeking', () => {
        const player = new HLSAudioPlayer({});
        const audio = player.getAudioElement() as unknown as MockAudio;

        audio.currentTime = 3;
        player.updateSeek(12);

        expect(audio.currentTime).toBe(3);
    });
});

describe('commitSeek', () => {
    it('commits the preview time and resumes playback', async () => {
        const player = new HLSAudioPlayer({});
        const audio = player.getAudioElement() as unknown as MockAudio;

        player.beginSeek();
        player.updateSeek(42);
        await player.commitSeek();

        expect(audio.pause).toHaveBeenCalledTimes(1);
        expect(audio.play).toHaveBeenCalledTimes(1);
        expect(audio.currentTime).toBe(42);

        player.updateSeek(100);
        expect(audio.currentTime).toBe(42);
    });
});
