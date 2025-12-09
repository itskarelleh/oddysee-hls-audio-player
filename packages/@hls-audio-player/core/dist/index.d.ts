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
interface PlayerState {
    track: Track | null;
    currentTime: number;
    duration: number | null;
    volume: number;
    loading: boolean;
    error: PlayerError | null;
    readyState: number;
    isPlaying: boolean;
}
interface QualityLevel {
    id: number;
    name: string;
    bitrate: number;
    audioCodec?: string;
}
type PlayerEvent = 'play' | 'pause' | 'track-end' | 'error' | 'quality-change' | 'playlist-ready' | 'loadedmetadata' | 'timeupdate' | 'loading' | 'canplay';
interface PlayerEventMap {
    play: void;
    pause: void;
    'track-end': Track | null;
    error: PlayerError;
    'quality-change': QualityLevel;
    'playlist-ready': void;
    loadedmetadata: Track | null;
    timeupdate: {
        currentTime: number;
        duration: number | null;
    };
    loading: void;
    canplay: void;
}
interface PlayerError {
    code: 'NETWORK_ERROR' | 'MEDIA_ERROR' | 'PLAYBACK_ERROR' | 'FORMAT_NOT_SUPPORTED' | 'UNKNOWN_ERROR';
    message: string;
    details?: any;
}

interface HLSAudioPlayerInterface {
    setSource(url: string, options?: SourceOptions): Promise<HLSAudioPlayer>;
    getCurrentTrack(): Track | null;
    on<K extends PlayerEvent>(event: K, callback: (data: PlayerEventMap[K]) => void): void;
    off<K extends PlayerEvent>(event: K, callback: (data: PlayerEventMap[K]) => void): void;
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
declare class HLSAudioPlayer implements HLSAudioPlayerInterface {
    private hls;
    private audioElement;
    private config;
    private eventListeners;
    private currentTrack?;
    private _loading;
    private _error;
    private _isPlaying;
    get loading(): boolean;
    get readyState(): number;
    get error(): PlayerError | null;
    get isPlaying(): boolean;
    constructor(config?: PlayerConfig);
    private mapConfigToHLS;
    private setupHlsEvents;
    private setupAudioEvents;
    private updateCurrentTrack;
    private mapHlsError;
    /**
     * sets source of the player
     * @param url
     * @param options
     * @returns
     */
    setSource(url: string, options?: SourceOptions): Promise<HLSAudioPlayer>;
    /**
     * plays current source/track
     * @returns
     */
    play(): HLSAudioPlayer;
    /**
     * Plays the current source/track and returns a Promise so callers can
     * await or chain then/catch (e.g. to handle autoplay errors explicitly).
     */
    playAsync(): Promise<HLSAudioPlayer>;
    /**
     * Pauses the current source/track
     * @returns
     */
    pause(): HLSAudioPlayer;
    setVolume(volume: number): HLSAudioPlayer;
    /**
     * Gets the current value of the volume
     * @returns
     */
    getVolume(): number;
    /**
    *
    * gets the whole state of the player
    */
    getState(): PlayerState;
    getAudioElement(): HTMLAudioElement;
    getQualityLevels(): QualityLevel[];
    setQuality(quality: number | string): void;
    private getQualityName;
    getCurrentTrack(): Track | null;
    on<K extends PlayerEvent>(event: K, callback: (data: PlayerEventMap[K]) => void): void;
    off<K extends PlayerEvent>(event: K, callback: (data: PlayerEventMap[K]) => void): void;
    private emit;
    destroy(): void;
}

export { HLSAudioPlayer, HLSAudioPlayerInterface, PlayerConfig, PlayerError, PlayerEvent, PlayerEventMap, PlayerState, QualityLevel, SourceOptions, Track };
