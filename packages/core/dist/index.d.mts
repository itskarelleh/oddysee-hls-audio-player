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
}
interface QualityLevel {
    id: number;
    name: string;
    bitrate: number;
    audioCodec?: string;
}
type PlayerEvent = 'play' | 'pause' | 'track-end' | 'error' | 'quality-change' | 'playlist-ready';
interface PlayerError {
    code: string;
    message: string;
    details?: any;
}

type EventCallback = (data?: any) => void;
declare class HLSAudioPlayer {
    private hls;
    private audioElement;
    private config;
    private eventListeners;
    private currentTrack?;
    constructor(config?: PlayerConfig);
    private mapConfigToHLS;
    private setupHlsEvents;
    private setupAudioEvents;
    private mapHlsError;
    setSource(url: string, options?: SourceOptions): Promise<void>;
    play(): void;
    pause(): void;
    setVolume(volume: number): void;
    getVolume(): number;
    getQualityLevels(): QualityLevel[];
    setQuality(quality: number | string): void;
    private getQualityName;
    getCurrentTrack(): Track | undefined;
    on(event: PlayerEvent, callback: EventCallback): void;
    private emit;
    destroy(): void;
}

export { HLSAudioPlayer, PlayerConfig, PlayerError, PlayerEvent, QualityLevel, SourceOptions, Track };
