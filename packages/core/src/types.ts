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
  | 'playlist-ready';

export interface PlayerError {
  code: string;
  message: string;
  details?: any;
}

