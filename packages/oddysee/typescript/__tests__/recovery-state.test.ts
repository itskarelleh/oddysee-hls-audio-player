import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HLSAudioPlayer } from '../src/hls-audio-player';

type HandlerMap = Record<string, Array<(event: string, data: any) => void>>;

let lastInstance: any;
let autoParseManifest = true;

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
        attachMedia = vi.fn();
        loadSource = vi.fn(() => {
            if (autoParseManifest) {
                this.trigger('MANIFEST_PARSED', {});
            }
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
    autoParseManifest = true;
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

// Loads a track, plays to 42s of 180s, pauses, then goes idle past the stale threshold
const setupStalePlayer = async () => {
    const player = new HLSAudioPlayer({ playback: { staleAfterMs: 1000 } });
    await player.setSource('https://example.com/stream.m3u8', {
        id: 'track-1',
        duration: 180,
    });

    const audio = player.getAudioElement() as unknown as MockAudio;
    audio.currentTime = 42;
    audio.duration = 180;
    audio.trigger('play');
    audio.trigger('timeupdate');
    audio.trigger('pause');

    vi.setSystemTime(new Date('2026-01-31T12:00:02.500Z'));
    return { player, audio };
};

describe('recovery state', () => {
    it('is not recovering for a normal source load', async () => {
        const player = new HLSAudioPlayer({});
        const onStart = vi.fn();
        player.on('recovery-start', onStart);

        await player.setSource('https://example.com/stream.m3u8');

        expect(player.isRecovering).toBe(false);
        expect(player.getState().isRecovering).toBe(false);
        expect(onStart).not.toHaveBeenCalled();
    });

    it('keeps the last stable time while the audio element is reset', async () => {
        const { player, audio } = await setupStalePlayer();
        const onStart = vi.fn();
        const onTimeUpdate = vi.fn();
        player.on('recovery-start', onStart);
        player.on('timeupdate', onTimeUpdate);

        // Hold the session rebuild open so the transient state is observable
        autoParseManifest = false;
        const playPromise = player.playAsync();

        expect(onStart).toHaveBeenCalledWith({ currentTime: 42 });
        expect(player.isRecovering).toBe(true);

        // Raw element state during the rebuild
        expect(audio.currentTime).toBe(0);
        audio.duration = NaN;
        audio.trigger('timeupdate');

        expect(onTimeUpdate).toHaveBeenLastCalledWith({ currentTime: 42, duration: 180 });
        const state = player.getState();
        expect(state.isRecovering).toBe(true);
        expect(state.currentTime).toBe(42);
        expect(state.duration).toBe(180);

        lastInstance.trigger('MANIFEST_PARSED', {});
        await playPromise;
    });

    it('ends recovery once the refreshed stream can play', async () => {
        const { player, audio } = await setupStalePlayer();
        const onEnd = vi.fn();
        player.on('recovery-end', onEnd);

        await player.playAsync();

        expect(player.isRecovering).toBe(true);
        expect(onEnd).not.toHaveBeenCalled();

        audio.duration = 180;
        audio.trigger('canplay');

        expect(player.isRecovering).toBe(false);
        expect(onEnd).toHaveBeenCalledTimes(1);
        expect(onEnd).toHaveBeenCalledWith({ currentTime: 42 });

        // Time follows the audio element again
        audio.currentTime = 43;
        audio.trigger('timeupdate');
        expect(player.getState().currentTime).toBe(43);
    });

    it('enters recovery on auth error and keeps the playback time', async () => {
        const player = new HLSAudioPlayer({ playback: { staleAfterMs: 60000 } });
        const onStart = vi.fn();
        player.on('recovery-start', onStart);

        await player.setSource('https://example.com/stream.m3u8');
        const audio = player.getAudioElement() as unknown as MockAudio;
        audio.currentTime = 33;
        await player.playAsync();
        audio.trigger('play');

        lastInstance.trigger('ERROR', {
            type: 'NETWORK_ERROR',
            response: { code: 403 },
        });
        await Promise.resolve();
        await Promise.resolve();

        expect(onStart).toHaveBeenCalledWith({ currentTime: 33 });
        expect(player.isRecovering).toBe(true);
        expect(player.getState().currentTime).toBe(33);

        audio.trigger('canplay');
        expect(player.isRecovering).toBe(false);
    });

    it('ends recovery when the refresh fails', async () => {
        const { player } = await setupStalePlayer();
        const onEnd = vi.fn();
        player.on('recovery-end', onEnd);
        player.on('error', () => {});

        autoParseManifest = false;
        const playPromise = player.playAsync();
        expect(player.isRecovering).toBe(true);

        lastInstance.trigger('ERROR', { type: 'NETWORK_ERROR', fatal: true });

        await expect(playPromise).rejects.toMatchObject({ code: 'PLAYBACK_ERROR' });
        expect(player.isRecovering).toBe(false);
        expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('ends recovery when playback is rejected after the refresh', async () => {
        const { player, audio } = await setupStalePlayer();
        const onEnd = vi.fn();
        player.on('recovery-end', onEnd);
        player.on('error', () => {});
        audio.play.mockRejectedValueOnce(new Error('NotAllowedError'));

        await expect(player.playAsync()).rejects.toMatchObject({ code: 'PLAYBACK_ERROR' });

        expect(player.isRecovering).toBe(false);
        expect(onEnd).toHaveBeenCalledWith({ currentTime: 42 });
    });

    it('stays recovering when a reload aborts a pending play', async () => {
        const player = new HLSAudioPlayer({ playback: { staleAfterMs: 60000 } });
        player.on('error', () => {});
        await player.setSource('https://example.com/stream.m3u8');
        const audio = player.getAudioElement() as unknown as MockAudio;
        audio.currentTime = 33;

        let rejectPlay: (error: Error) => void = () => {};
        audio.play.mockImplementationOnce(() => {
            audio.paused = false;
            return new Promise((_, reject) => {
                rejectPlay = reject;
            });
        });
        const playPromise = player.playAsync();

        // Expired segment: the reload pauses the element, aborting the pending play()
        autoParseManifest = false;
        lastInstance.trigger('ERROR', {
            type: 'NETWORK_ERROR',
            response: { code: 403 },
        });
        rejectPlay(new Error('AbortError'));
        await expect(playPromise).rejects.toMatchObject({ code: 'PLAYBACK_ERROR' });

        expect(player.isRecovering).toBe(true);
        expect(player.getState().currentTime).toBe(33);

        lastInstance.trigger('MANIFEST_PARSED', {});
        await Promise.resolve();
        await Promise.resolve();
        audio.trigger('canplay');
        expect(player.isRecovering).toBe(false);
    });

    it('ends recovery when a different source is loaded', async () => {
        const { player } = await setupStalePlayer();
        const onEnd = vi.fn();
        player.on('recovery-end', onEnd);

        await player.playAsync();
        expect(player.isRecovering).toBe(true);

        await player.setSource('https://example.com/other.m3u8');

        expect(player.isRecovering).toBe(false);
        expect(onEnd).toHaveBeenCalledTimes(1);
        expect(player.getState().currentTime).toBe(0);
    });
});
