import { HLSAudioPlayer } from './hls-audio-player';
import {
	PlayerConfig,
	SourceOptions,
	Track,
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
