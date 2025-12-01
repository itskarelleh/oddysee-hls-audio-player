import { HLSAudioPlayer } from './hls-audio-player';
import { PlayerConfig, SourceOptions, Track, PlayerEvent, PlayerError } from './types';

export interface HLSAudioPlayerInterface {
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
