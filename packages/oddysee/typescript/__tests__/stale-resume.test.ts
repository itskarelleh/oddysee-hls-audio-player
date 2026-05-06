import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HLSAudioPlayer } from '../src/hls-audio-player';

type HandlerMap = Record<string, Array<(event: string, data: any) => void>>;

let lastInstance: any;

vi.mock('hls.js', () => {
    class MockHls {
        static Events = {
            MANIFEST_PARSED: 'MANIFEST_PARSED',
            ERROR: 'ERROR',
            LEVEL_SWITCHED: 'LEVEL_SWITCHED',
        };
        static ErrorTypes = {
            NETWORK_ERROR: 'NETWORK_ERROR',
            MEDIA_ERROR: 'MEDIA_ERROR',
            MUX_ERROR: 'MUX_ERROR',
            OTHER_ERROR: 'OTHER_ERROR',
        };
        levels: any[] = [];
        currentLevel = 0;
        private handlers: HandlerMap = {};
        on = vi.fn((event: string, handler: (event: string, data: any) => void) => {
            if (!this.handlers[event]) {
                this.handlers[event] = [];
            }
            this.handlers[event].push(handler);
        });
        once = vi.fn((event: string, handler: (event: string, data: any) => void) => {
            const wrapper = (e: string, data: any) => {
                handler(e, data);
                this.handlers[event] = this.handlers[event].filter(h => h !== wrapper);
            };
            if (!this.handlers[event]) {
                this.handlers[event] = [];
            }
            this.handlers[event].push(wrapper);
        });
        attachMedia = vi.fn();
        loadSource = vi.fn(() => {
            this.trigger('MANIFEST_PARSED', {});
        });
        destroy = vi.fn();

        constructor() {
            lastInstance = this;
        }

        trigger(event: string, data: any) {
            const handlers = this.handlers[event];
            if (handlers) {
                handlers.forEach(handler => handler(event, data));
            }
        }
    }

    return { default: MockHls };
});

class MockAudio {
    currentTime = 0;
    duration = NaN;
    readyState = 0;
    volume = 1;
    paused = true;
    private handlers: Record<string, Array<() => void>> = {};
    play = vi.fn().mockImplementation(() => {
        this.paused = false;
        return Promise.resolve();
    });
    pause = vi.fn().mockImplementation(() => {
        this.paused = true;
    });
    addEventListener = vi.fn((event: string, handler: () => void) => {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
    });
    removeEventListener = vi.fn();

    trigger(event: string) {
        if (event === 'play') this.paused = false;
        if (event === 'pause') this.paused = true;
        const handlers = this.handlers[event] || [];
        handlers.forEach(handler => handler());
    }
}

let OriginalAudio: any;
let OriginalDocument: any;

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-31T12:00:00.000Z'));
    OriginalAudio = (globalThis as any).Audio;
    OriginalDocument = (globalThis as any).document;
    lastInstance = null;
    lastInstance = null;
    (globalThis as any).Audio = MockAudio;
    (globalThis as any).document = {
        hidden: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    };
});

afterEach(() => {
    (globalThis as any).Audio = OriginalAudio;
    (globalThis as any).document = OriginalDocument;
    vi.useRealTimers();
    vi.clearAllMocks();
});

describe('stale resume gate', () => {
    it('refreshes the stream after long idle and resumes at last position', async () => {
        const player = new HLSAudioPlayer({ playback: { staleAfterMs: 1000 } });
        const setSourceSpy = vi.spyOn(player, 'setSource');

        await player.setSource('https://example.com/stream.m3u8', {
            id: 'track-1',
            title: 'Track 1',
            duration: 180,
        });

        const audio = player.getAudioElement() as unknown as MockAudio;
        audio.currentTime = 42;
        audio.trigger('play');
        audio.trigger('pause');

        vi.setSystemTime(new Date('2026-01-31T12:00:02.500Z'));

        await player.playAsync();

        expect(setSourceSpy).toHaveBeenCalledTimes(2);
        const refreshArgs = setSourceSpy.mock.calls[1];
        expect(refreshArgs?.[1]).toMatchObject({
            id: 'track-1',
            title: 'Track 1',
            duration: 180,
            startTime: 42,
        });
        expect(audio.currentTime).toBe(42);
        expect(audio.play).toHaveBeenCalledTimes(1);
    });

    it('does not refresh when idle time is below the staleness threshold', async () => {
        const player = new HLSAudioPlayer({ playback: { staleAfterMs: 10000 } });
        const setSourceSpy = vi.spyOn(player, 'setSource');

        await player.setSource('https://example.com/stream.m3u8');

        const audio = player.getAudioElement() as unknown as MockAudio;
        audio.currentTime = 10;
        audio.trigger('play');
        audio.trigger('pause');

        vi.setSystemTime(new Date('2026-01-31T12:00:01.000Z'));

        await player.playAsync();

        expect(setSourceSpy).toHaveBeenCalledTimes(1);
        expect(audio.play).toHaveBeenCalledTimes(1);
    });

    it('refreshes when stale media is detected even with short idle', async () => {
        const player = new HLSAudioPlayer({ playback: { staleAfterMs: 60000 } });
        const setSourceSpy = vi.spyOn(player, 'setSource');

        await player.setSource('https://example.com/stream.m3u8');

        const audio = player.getAudioElement() as unknown as MockAudio;
        audio.currentTime = 8;
        audio.trigger('play');
        audio.trigger('pause');
        audio.trigger('stalled');

        await player.playAsync();

        expect(setSourceSpy).toHaveBeenCalledTimes(2);
    });

    it('refreshes after long hidden visibility idle', async () => {
        const addListener = vi.fn();
        (globalThis as any).document = {
            hidden: false,
            addEventListener: addListener,
            removeEventListener: vi.fn(),
        };

        const player = new HLSAudioPlayer({ playback: { staleAfterMs: 1000 } });
        const setSourceSpy = vi.spyOn(player, 'setSource');

        await player.setSource('https://example.com/stream.m3u8');

        const audio = player.getAudioElement() as unknown as MockAudio;
        audio.currentTime = 5;
        audio.trigger('play');
        audio.trigger('pause');

        const visibilityHandler = addListener.mock.calls.find(
            call => call[0] === 'visibilitychange',
        )?.[1] as (() => void) | undefined;

        (globalThis as any).document.hidden = true;
        visibilityHandler?.();

        vi.setSystemTime(new Date('2026-01-31T12:00:02.100Z'));
        (globalThis as any).document.hidden = false;

        await player.playAsync();

        expect(setSourceSpy).toHaveBeenCalledTimes(2);
    });

    it('recovers on auth error by refreshing source and resuming', async () => {
        const player = new HLSAudioPlayer({ playback: { staleAfterMs: 60000 } });
        const setSourceSpy = vi.spyOn(player, 'setSource');

        await player.setSource('https://example.com/stream.m3u8');

        const audio = player.getAudioElement() as unknown as MockAudio;
        audio.currentTime = 33;
        await player.playAsync();
        audio.trigger('play');

        const hlsInstance = lastInstance as any;
        hlsInstance?.trigger('ERROR', {
            type: 'NETWORK_ERROR',
            response: { code: 401 },
        });

        await Promise.resolve();
        await Promise.resolve();

        expect(setSourceSpy).toHaveBeenCalledTimes(2);
        const refreshArgs = setSourceSpy.mock.calls[1];
        expect(refreshArgs?.[1]).toMatchObject({ startTime: 33 });
    });
});

describe('setSource startTime support', () => {
    it('seeks to startTime and preserves track metadata', async () => {
        const player = new HLSAudioPlayer({});
        const audio = player.getAudioElement() as unknown as MockAudio;

        await player.setSource('https://example.com/stream.m3u8', {
            id: 'track-2',
            title: 'Track 2',
            duration: 99,
            startTime: 12,
        });

        expect(audio.currentTime).toBe(12);
        const track = player.getCurrentTrack();
        expect(track?.id).toBe('track-2');
        expect(track?.title).toBe('Track 2');
        expect(track?.duration).toBe(99);
        expect(track?.currentTime).toBe(12);
    });
});
