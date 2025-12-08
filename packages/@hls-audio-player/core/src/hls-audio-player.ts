import HLS, { type HlsConfig } from 'hls.js';
import {
	PlayerConfig,
	SourceOptions,
	Track,
	QualityLevel,
	PlayerEvent,
	PlayerError,
	PlayerEventMap,
	PlayerState,
} from './types';

export interface HLSAudioPlayerInterface {
	setSource(url: string, options?: SourceOptions): Promise<HLSAudioPlayer>;
	getCurrentTrack(): Track | null;

	on<K extends PlayerEvent>(
		event: K,
		callback: (data: PlayerEventMap[K]) => void,
	): void;
	off<K extends PlayerEvent>(
		event: K,
		callback: (data: PlayerEventMap[K]) => void,
	): void;

	play(): HLSAudioPlayer;
	playAsync(): Promise<HLSAudioPlayer>;
	pause(): HLSAudioPlayer;
	setVolume(volume: number): HLSAudioPlayer;

	getState(): PlayerState;
	getAudioElement(): HTMLAudioElement;

	loading: boolean;
	readyState: number;
	error: PlayerError | null;

	destroy(): void;
}

type EventCallback<K extends PlayerEvent = PlayerEvent> = (
	data: PlayerEventMap[K],
) => void;

export class HLSAudioPlayer implements HLSAudioPlayerInterface {
    private hls: HLS;
    private audioElement: HTMLAudioElement;
    private config: PlayerConfig;
    private eventListeners: Map<PlayerEvent, EventCallback[]> = new Map();
    private currentTrack?: Track;
    private _loading: boolean = false;
    private _error: PlayerError | null = null;
    private _isPlaying: boolean = false;

    get loading(): boolean {
        return this._loading;
    }

    get readyState(): number {
        return this.audioElement.readyState;
    }

    get error(): PlayerError | null {
        return this._error;
    }

    get isPlaying(): boolean {
        return this._isPlaying;
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
            this.emit('playlist-ready', undefined);
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
        this.audioElement.addEventListener('play', () => {
            this._isPlaying = true;
            this.emit('play', undefined);
        });
        this.audioElement.addEventListener('pause', () => {
            this._isPlaying = false;
            this.emit('pause', undefined);
        });
        this.audioElement.addEventListener('ended', () =>
            this.emit('track-end', this.currentTrack || null),
        );
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.updateCurrentTrack();
            this.emit('loadedmetadata', this.currentTrack || null);
        });
        this.audioElement.addEventListener('timeupdate', () => {
            this.updateCurrentTrack();
            this.emit('timeupdate', {
                currentTime: this.audioElement.currentTime,
                duration: isNaN(this.audioElement.duration)
                    ? null
                    : this.audioElement.duration,
            });
        });
        this.audioElement.addEventListener('canplay', () => {
            this._loading = false;
            this.emit('canplay', undefined);
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

    /**
     * sets source of the player
     * @param url 
     * @param options 
     * @returns 
     */
    async setSource(url: string, options?: SourceOptions): Promise<HLSAudioPlayer> {
        this._loading = true;
        this._error = null;
        this.emit('loading', undefined);

        return new Promise((resolve, reject) => {
            // Pause current playback and reset audio element state
            if (!this.audioElement.paused) {
                this.audioElement.pause();
            }
            this.audioElement.currentTime = 0;
            
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

    /**
     * plays current source/track 
     * @returns 
     */
    play(): HLSAudioPlayer {
        // Fire-and-forget version; errors are surfaced via the 'error' event
        this.playAsync().catch(() => {
            // Swallow here; consumer can listen to 'error' or use playAsync()
        });
        return this;
    }

    /**
     * Plays the current source/track and returns a Promise so callers can
     * await or chain then/catch (e.g. to handle autoplay errors explicitly).
     */
    async playAsync(): Promise<HLSAudioPlayer> {
        try {
            await this.audioElement.play();
            return this;
        } catch (error: any) {
            this._error = {
                code: 'PLAYBACK_ERROR',
                message: (error && error.message) || 'Playback failed',
            };
            this.emit('error', this._error);
            throw this._error;
        }
    }

    /**
     * Pauses the current source/track
     * @returns 
     */
    pause(): HLSAudioPlayer {
        this.audioElement.pause();
        return this;
    }

    /*
    * sets volume of audio player   
    */
    setVolume(volume: number): HLSAudioPlayer {
        this.audioElement.volume = Math.max(0, Math.min(1, volume));
        return this;
    }

    /**
     * Gets the current value of the volume
     * @returns 
     */
    getVolume(): number {
        return this.audioElement.volume;
    }

    /**
    *
    * gets the whole state of the player
    */
    getState(): PlayerState {
        const track = this.getCurrentTrack();
        return {
            track,
            currentTime: track?.currentTime ?? 0,
            duration:
                typeof track?.duration === 'number' && !isNaN(track.duration)
                    ? track.duration
                    : null,
            volume: this.getVolume(),
            loading: this.loading,
            error: this.error,
            readyState: this.readyState,
            isPlaying: this.isPlaying,
        };
    }

    getAudioElement(): HTMLAudioElement {
        return this.audioElement;
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

    on<K extends PlayerEvent>(
        event: K,
        callback: (data: PlayerEventMap[K]) => void,
    ): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback as EventCallback);
    }

    off<K extends PlayerEvent>(
        event: K,
        callback: (data: PlayerEventMap[K]) => void,
    ): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback as EventCallback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    private emit<K extends PlayerEvent>(
        event: K,
        data: PlayerEventMap[K],
    ): void {
        const listeners = this.eventListeners.get(event) || [];
        listeners.forEach(callback =>
            (callback as EventCallback<K>)(data),
        );
    }

    destroy(): void {
        try {
            this.hls.destroy();
        } catch {
            // ignore if already destroyed
        }
        try {
            this.audioElement.remove();
        } catch {
            // ignore if already removed
        }
        this.eventListeners.clear();
        this._loading = false;
        this._error = null;
        this._isPlaying = false;
    }
}