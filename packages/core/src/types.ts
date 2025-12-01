export interface PlayerConfig {
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

export interface SourceOptions {
  headers?: Record<string, string>;
  startTime?: number;
  [key: string]: any;
}

export interface Track {
  id: string;
  title?: string;
  url: string;
  duration?: number;
  currentTime: number;
}

export interface QualityLevel {
  id: number;
  name: string;
  bitrate: number;
  audioCodec?: string;
}

export type PlayerEvent = 
  | 'play' 
  | 'pause' 
  | 'track-end' 
  | 'error' 
  | 'quality-change' 
  | 'playlist-ready'
  | 'loadedmetadata'
  | 'timeupdate'
  | 'loading'
  | 'canplay';

export interface PlayerError {
  code: 'NETWORK_ERROR' | 'MEDIA_ERROR' | 'PLAYBACK_ERROR' | 'FORMAT_NOT_SUPPORTED' | 'UNKNOWN_ERROR';
  message: string;
  details?: any;
}

