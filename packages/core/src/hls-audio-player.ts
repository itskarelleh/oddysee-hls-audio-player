import HLS, { type HlsConfig } from 'hls.js';
import { PlayerConfig, SourceOptions, Track, QualityLevel, PlayerEvent, PlayerError } from './types';
import type { HLSAudioPlayerInterface } from './interface';

type EventCallback = (data?: any) => void;

export class HLSAudioPlayer implements HLSAudioPlayerInterface {
    private hls: HLS;
    private audioElement: HTMLAudioElement;
    private config: PlayerConfig;
    private eventListeners: Map<PlayerEvent, EventCallback[]> = new Map();
    private currentTrack?: Track;
    private _loading: boolean = false;
    private _error: PlayerError | null = null;

    get loading(): boolean {
        return this._loading;
    }

    get readyState(): number {
        return this.audioElement.readyState;
    }

    get error(): PlayerError | null {
        return this._error;
    }

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
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.updateCurrentTrack();
            this.emit('loadedmetadata', this.currentTrack);
        });
        this.audioElement.addEventListener('timeupdate', () => {
            this.updateCurrentTrack();
            this.emit('timeupdate', this.currentTrack?.currentTime);
        });
        this.audioElement.addEventListener('canplay', () => {
            this._loading = false;
            this.emit('canplay');
        });
    }

    private updateCurrentTrack(): void {
        if (this.currentTrack) {
            this.currentTrack.currentTime = this.audioElement.currentTime;
            this.currentTrack.duration = this.audioElement.duration || undefined;
        }
    }

    private mapHlsError(data: any): PlayerError {
        // Map HLS.js error codes to our clean error types
        switch (data.type) {
            case HLS.ErrorTypes.NETWORK_ERROR:
                return { code: 'NETWORK_ERROR', message: 'Network error occurred', details: data };
            case HLS.ErrorTypes.MEDIA_ERROR:
                return { code: 'MEDIA_ERROR', message: 'Media error occurred', details: data };
            case HLS.ErrorTypes.MUX_ERROR:
                return { code: 'FORMAT_NOT_SUPPORTED', message: 'Format not supported', details: data };
            default:
                return { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred', details: data };
        }
    }

    async setSource(url: string, options?: SourceOptions): Promise<HLSAudioPlayer> {
        this._loading = true;
        this._error = null;
        this.emit('loading');

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
                resolve(this);
            });

            this.hls.on(HLS.Events.ERROR, (event, data) => {
                this._loading = false;
                this._error = this.mapHlsError(data);
                reject(this._error);
            });

            this.hls.loadSource(url);
            this.currentTrack = { 
                id: url, 
                url, 
                title: url.split('/').pop(),
                currentTime: 0
            };
        });
    }

    play(): HLSAudioPlayer {
        this.audioElement.play().catch(error => {
            this._error = { code: 'PLAYBACK_ERROR', message: error.message };
            this.emit('error', this._error);
        });
        return this;
    }

    pause(): HLSAudioPlayer {
        this.audioElement.pause();
        return this;
    }

    setVolume(volume: number): HLSAudioPlayer {
        this.audioElement.volume = Math.max(0, Math.min(1, volume));
        return this;
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

    getCurrentTrack(): Track | null {
        this.updateCurrentTrack();
        return this.currentTrack || null;
    }

    on(event: PlayerEvent, callback: EventCallback): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    off(event: PlayerEvent, callback: EventCallback): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    private emit(event: PlayerEvent, data?: any): void {
        const listeners = this.eventListeners.get(event) || [];
        listeners.forEach(callback => callback(data));
    }

    destroy(): void {
        this.hls.destroy();
        this.audioElement.remove();
        this.eventListeners.clear();
        this._loading = false;
        this._error = null;
    }
}