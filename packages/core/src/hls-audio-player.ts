import HLS, { type HlsConfig } from 'hls.js';
import { PlayerConfig, SourceOptions, Track, QualityLevel, PlayerEvent, PlayerError } from './types';

type EventCallback = (data?: any) => void;

export class HLSAudioPlayer {
    private hls: HLS;
    private audioElement: HTMLAudioElement;
    private config: PlayerConfig;
    private eventListeners: Map<PlayerEvent, EventCallback[]> = new Map();
    private currentTrack?: Track;

    constructor(config: PlayerConfig = {}) {
        this.config = config;
        this.audioElement = new Audio();
        this.hls = new HLS(this.mapConfigToHLS(config));

        this.setupHlsEvents();
        this.setupAudioEvents();
    }

    private mapConfigToHLS(config: PlayerConfig): Partial<HlsConfig> {
        const hlsConfig: Partial<HlsConfig> = {
            // Core performance
            enableWorker: true,
            lowLatencyMode: true,

            // Buffer settings
            backBufferLength: 90,
            maxMaxBufferLength: 30,
            maxBufferSize: 60 * 1000 * 1000, // 60MB

            // Audio streaming optimizations
            maxBufferHole: 0.5,
            maxFragLookUpTolerance: 0.25,

            // Disable video-specific features
            stretchShortVideoTrack: false,

            // Header configuration
            xhrSetup: (xhr: XMLHttpRequest, url: string) => {
                const headers = {
                    ...config.network?.headers,
                };

                Object.entries(headers).forEach(([key, value]) => {
                    xhr.setRequestHeader(key, value);
                });
            },
        };

        return hlsConfig;
    }

    private setupHlsEvents(): void {
        this.hls.on(HLS.Events.MANIFEST_PARSED, () => {
            this.emit('playlist-ready');
        });

        this.hls.on(HLS.Events.ERROR, (event, data) => {
            const error = this.mapHlsError(data);
            this.emit('error', error);
        });

        this.hls.on(HLS.Events.LEVEL_SWITCHED, (event, data) => {
            this.emit('quality-change', this.getQualityLevels()[data.level]);
        });
    }

    private setupAudioEvents(): void {
        this.audioElement.addEventListener('play', () => this.emit('play'));
        this.audioElement.addEventListener('pause', () => this.emit('pause'));
        this.audioElement.addEventListener('ended', () => this.emit('track-end'));
    }

    private mapHlsError(data: any): PlayerError {
        // Map HLS.js error codes to our clean error types
        switch (data.type) {
            case HLS.ErrorTypes.NETWORK_ERROR:
                return { code: 'NETWORK_ERROR', message: 'Network error occurred', details: data };
            case HLS.ErrorTypes.MEDIA_ERROR:
                return { code: 'MEDIA_ERROR', message: 'Media error occurred', details: data };
            default:
                return { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred', details: data };
        }
    }

    async setSource(url: string, options?: SourceOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            // Destroy previous HLS instance if exists
            if (this.hls) {
                this.hls.destroy();
            }

            // Create new HLS instance with merged headers
            const mergedConfig = {
                ...this.config,
                network: {
                    ...this.config.network,
                    headers: {
                        ...this.config.network?.headers,
                        ...options?.headers,
                    },
                },
            };

            this.hls = new HLS(this.mapConfigToHLS(mergedConfig));
            this.setupHlsEvents();
            this.hls.attachMedia(this.audioElement);

            this.hls.on(HLS.Events.MANIFEST_PARSED, () => {
                resolve();
            });

            this.hls.on(HLS.Events.ERROR, (event, data) => {
                reject(this.mapHlsError(data));
            });

            this.hls.loadSource(url);
            this.currentTrack = { id: url, url, title: url.split('/').pop() };
        });
    }

    play(): void {
        this.audioElement.play().catch(error => {
            this.emit('error', { code: 'PLAYBACK_ERROR', message: error.message });
        });
    }

    pause(): void {
        this.audioElement.pause();
    }

    setVolume(volume: number): void {
        this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }

    getVolume(): number {
        return this.audioElement.volume;
    }

    getQualityLevels(): QualityLevel[] {
        if (!this.hls.levels.length) {
            return [];
        }

        return this.hls.levels.map((level, index) => ({
            id: index,
            name: this.getQualityName(level.bitrate),
            bitrate: level.bitrate,
            audioCodec: level.audioCodec,
        }));
    }

    setQuality(quality: number | string): void {
        if (typeof quality === 'number') {
            this.hls.currentLevel = quality;
        } else {
            const levels = this.getQualityLevels();
            const level = levels.find(l => l.name === quality);
            if (level) {
                this.hls.currentLevel = level.id;
            }
        }
    }

    private getQualityName(bitrate: number): string {
        if (bitrate > 500000) return 'high';
        if (bitrate > 200000) return 'medium';
        return 'low';
    }

    getCurrentTrack(): Track | undefined {
        return this.currentTrack;
    }

    // Event system
    on(event: PlayerEvent, callback: EventCallback): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    private emit(event: PlayerEvent, data?: any): void {
        const listeners = this.eventListeners.get(event) || [];
        listeners.forEach(callback => callback(data));
    }

    destroy(): void {
        this.hls.destroy();
        this.audioElement.remove();
        this.eventListeners.clear();
    }
}