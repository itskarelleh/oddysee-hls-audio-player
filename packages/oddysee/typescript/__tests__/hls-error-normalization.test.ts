import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HLSAudioPlayer } from '../src/hls-audio-player';

type HandlerMap = Record<string, (event: string, data: any) => void>;

let lastInstance: MockHls | null = null;

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
            this.handlers[event] = handler;
        });
        attachMedia = vi.fn();
        loadSource = vi.fn();
        destroy = vi.fn();

        constructor() {
            lastInstance = this;
        }

        trigger(event: string, data: any) {
            const handler = this.handlers[event];
            if (handler) {
                handler(event, data);
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
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
}

let OriginalAudio: any;

beforeEach(() => {
    lastInstance = null;
    OriginalAudio = (globalThis as any).Audio;
    (globalThis as any).Audio = MockAudio;
});

afterEach(() => {
    (globalThis as any).Audio = OriginalAudio;
    vi.clearAllMocks();
});

describe('HLS error normalization', () => {
    it('ignores empty error payloads', () => {
        const player = new HLSAudioPlayer({});
        const onError = vi.fn();
        player.on('error', onError);

        lastInstance?.trigger('ERROR', {});

        expect(onError).not.toHaveBeenCalled();
    });

    it('coerces missing type to OTHER_ERROR', () => {
        const player = new HLSAudioPlayer({});
        const onError = vi.fn();
        player.on('error', onError);

        lastInstance?.trigger('ERROR', { error: new Error('boom') });

        expect(onError).toHaveBeenCalledTimes(1);
        const payload = onError.mock.calls[0]?.[0];
        expect(payload.code).toBe('UNKNOWN_ERROR');
        expect(payload.details.type).toBe('OTHER_ERROR');
    });
});
