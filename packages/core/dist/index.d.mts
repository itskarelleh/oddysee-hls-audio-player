interface PlayerConfig {
    network?: {
        headers?: Record<string, string>;
        timeout?: number;
        retryCount?: number;
    };
    audio?: {
        crossfade?: boolean;
        normalization?: boolean;
        preload?: boolean;
        volume?: number;
    };
    playback?: {
        autoPlay?: boolean;
        startTime?: number;
    };
}
interface SourceOptions {
    headers?: Record<string, string>;
    startTime?: number;
    [key: string]: any;
}
interface Track {
    id: string;
    title?: string;
    url: string;
    duration?: number;
    currentTime: number;
}
interface QualityLevel {
    id: number;
    name: string;
    bitrate: number;
    audioCodec?: string;
}
type PlayerEvent = 'play' | 'pause' | 'track-end' | 'error' | 'quality-change' | 'playlist-ready' | 'loadedmetadata' | 'timeupdate' | 'loading' | 'canplay';
interface PlayerError {
    code: 'NETWORK_ERROR' | 'MEDIA_ERROR' | 'PLAYBACK_ERROR' | 'FORMAT_NOT_SUPPORTED' | 'UNKNOWN_ERROR';
    message: string;
    details?: any;
}

interface HLSAudioPlayerInterface {
    setSource(url: string, options?: SourceOptions): Promise<HLSAudioPlayer>;
    getCurrentTrack(): Track | null;
    on(event: PlayerEvent, callback: Function): void;
    off(event: PlayerEvent, callback: Function): void;
    play(): HLSAudioPlayer;
    pause(): HLSAudioPlayer;
    setVolume(volume: number): HLSAudioPlayer;
    loading: boolean;
    readyState: number;
    error: PlayerError | null;
}

type EventCallback = (data?: any) => void;
declare class HLSAudioPlayer implements HLSAudioPlayerInterface {
    private hls;
    private audioElement;
    private config;
    private eventListeners;
    private currentTrack?;
    private _loading;
    private _error;
    get loading(): boolean;
    get readyState(): number;
    get error(): PlayerError | null;
    constructor(config?: PlayerConfig);
    private mapConfigToHLS;
    private setupHlsEvents;
    private setupAudioEvents;
    private updateCurrentTrack;
    private mapHlsError;
    setSource(url: string, options?: SourceOptions): Promise<HLSAudioPlayer>;
    play(): HLSAudioPlayer;
    pause(): HLSAudioPlayer;
    setVolume(volume: number): HLSAudioPlayer;
    getVolume(): number;
    getQualityLevels(): QualityLevel[];
    setQuality(quality: number | string): void;
    private getQualityName;
    getCurrentTrack(): Track | null;
    on(event: PlayerEvent, callback: EventCallback): void;
    off(event: PlayerEvent, callback: EventCallback): void;
    private emit;
    destroy(): void;
}

export { HLSAudioPlayer, HLSAudioPlayerInterface, PlayerConfig, PlayerError, PlayerEvent, QualityLevel, SourceOptions, Track };
