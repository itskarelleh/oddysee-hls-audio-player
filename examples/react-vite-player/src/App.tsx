import { useRef, useState } from "react";
import { useHlsAudioPlayer } from '../../../packages/oddysee/react/src/use-hls-audio-player'
// from "oddysee-react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
} from "lucide-react";
import "./App.css";

export default function App() {
  const playlist = [
    {
      id: 1,
        url: 'https://pl.streamingvideoprovider.com/mp3-playlist/playlist.m3u8',
        title: '🎵 MP3 Music Playlist',
        description: 'Various MP3 tracks in HLS format'
    },
    {
      id: 2,
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        title: '🔊 Mux Test Audio',
        description: 'Standard HLS.js test stream'
    },
    {
      id: 3,
        url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
        title: '📡 Live Test Stream',
        description: 'Live HLS stream for testing'
    },
    {
      id: 4,
        url: 'https://assets.afcdn.com/audio/20200916/2100k_aac.m3u8',
        title: '🇫🇷 French Radio',
        description: 'French audio stream example'
    },
    {
      id: 5,
        url: 'http://stream.radioparadise.com/aac-320',
        title: '🌴 Radio Paradise',
        description: 'Internet radio station'
    }
  ];

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const currentTrack = playlist[currentTrackIndex];

  const { state, controls, isLoading, isPlaying, scrub } = useHlsAudioPlayer({
    src: { url: currentTrack.url },
    autoPlay: true,
  });

  const togglePlay = () => {
    if (isPlaying) {
      controls.pause();
    } else {
      controls.play();
    }
  };

  const playTrack = (index: number) => {
    setCurrentTrackIndex(index);
    controls.setSource(currentTrack.url);
  };

  const playPrevious = () => {
    const newIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(newIndex);
    controls.setSource(playlist[newIndex].url);
  };

  const playNext = () => {
    const newIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(newIndex);
    controls.setSource(playlist[newIndex].url);
  };

  const duration = state.duration ?? 0;
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const progressPercent = duration
    ? Math.min(100, Math.max(0, (scrub.displayTime / duration) * 100))
    : 0;

  const getTimeFromClientX = (clientX: number, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const clampedX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const ratio = rect.width ? clampedX / rect.width : 0;
    return ratio * duration;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] text-gray-200 p-6">
      <div className="w-full max-w-lg bg-[#2b2b2b] rounded-2xl p-8 shadow-xl border border-[#3a3a3a]">
        
        <h1 className="text-center text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-400">
          🎵 HLS Audio Player
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          Smooth audio from an HLS (.m3u8) stream
        </p>

        {/* Current Track Info */}
        <div className="mb-6 p-4 bg-black/30 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-teal-300 mb-1">
            {currentTrack.title}
          </h2>
          <p className="text-sm text-gray-400">
            {currentTrack.description}
          </p>
        </div>

        {/* Playlist */}
        <div className="mb-6">
          <label className="text-xs uppercase tracking-wider text-teal-300 font-semibold mb-2 block">
            Playlist
          </label>
          <div className="max-h-32 overflow-y-auto bg-black/30 rounded-lg border border-gray-700">
            {playlist.map((track, index) => (
              <button
                key={track.id}
                onClick={() => playTrack(index)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                  index === currentTrackIndex ? 'bg-teal-900/30 text-teal-300' : 'text-gray-300'
                }`}
              >
                <div className="font-medium">{track.title}</div>
                <div className="text-xs text-gray-500">{track.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={playPrevious}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Previous track"
          >
            <SkipBack className="w-5 h-5 text-teal-300" />
          </button>

          <button
            onClick={togglePlay}
            className="p-3 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 transition-colors"
            disabled={isLoading}
          >
            {!isPlaying ? (
              <Play className="w-6 h-6 text-teal-300" />
            ) : (
              <Pause className="w-6 h-6 text-teal-300" />
            )}
          </button>

          <button
            onClick={playNext}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Next track"
          >
            <SkipForward className="w-5 h-5 text-teal-300" />
          </button>

          <button
            onClick={() =>
              controls.setVolume(state.volume === 0 ? 1 : 0)
            }
            className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Toggle mute"
          >
            {state.volume === 0 ? (
              <VolumeX className="w-5 h-5 text-teal-300" />
            ) : (
              <Volume2 className="w-5 h-5 text-teal-300" />
            )}
          </button>
        </div>

        {/* Progress */}
        <div className="mt-6">
          {/* Input scrubber (kept for reference)
          <input
            type="range"
            min={0}
            max={duration}
            disabled={!duration}
            value={seekBar.displayTime}
            onFocus={seekBar.onFocus}
            onBlur={seekBar.onBlur}
            onPointerDown={seekBar.onPointerDown}
            onPointerUp={seekBar.onPointerUp}
            onPointerCancel={seekBar.onPointerCancel}
            onMouseDown={seekBar.onMouseDown}
            onMouseUp={seekBar.onMouseUp}
            onTouchStart={seekBar.onTouchStart}
            onTouchEnd={seekBar.onTouchEnd}
            onChange={seekBar.onChange}
            className="w-full cursor-pointer accent-teal-300"
          />
          */}
          <div
            ref={scrubberRef}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={scrub.displayTime}
            tabIndex={duration ? 0 : -1}
            data-scrubber="custom"
            className={`relative ${
              duration ? "cursor-pointer" : "opacity-50"
            }`}
            style={{
              height: 12,
              width: "100%",
              borderRadius: 9999,
              backgroundColor: "#374151",
              position: "relative",
            }}
            onPointerDown={(event) => {
              if (!duration || !scrubberRef.current) return;
              scrub.start();
              const nextTime = getTimeFromClientX(event.clientX, scrubberRef.current);
              scrub.preview(nextTime);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!scrub.isScrubbing || !scrubberRef.current) return;
              const nextTime = getTimeFromClientX(event.clientX, scrubberRef.current);
              scrub.preview(nextTime);
            }}
            onPointerUp={(event) => {
              if (!scrubberRef.current) return;
              const nextTime = getTimeFromClientX(event.clientX, scrubberRef.current);
              scrub.commit(nextTime);
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={(event) => {
              if (!scrubberRef.current) return;
              const nextTime = getTimeFromClientX(event.clientX, scrubberRef.current);
              scrub.commit(nextTime);
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${progressPercent}%`,
                borderRadius: 9999,
                backgroundColor: "#2dd4bf",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                height: 16,
                width: 16,
                transform: "translateY(-50%)",
                borderRadius: 9999,
                backgroundColor: "#99f6e4",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                left: `calc(${progressPercent}% - 8px)`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{scrub.displayTime.toFixed(0)}s</span>
            <span>
              {duration
                ? `${duration.toFixed(0)}s`
                : "--"}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="mt-6">
          <label className="text-xs uppercase tracking-wider text-teal-300 font-semibold">
            Volume ({Math.round(state.volume * 100)}%)
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.volume}
            onChange={(e) =>
              controls.setVolume(parseFloat(e.target.value))
            }
            className="w-full cursor-pointer mt-1 accent-teal-300"
          />
        </div>

        {/* Status */}
        <div className="text-xs mt-4 text-gray-500 text-center">
          {isLoading ? "Loading stream…" : "Ready"}
        </div>

        {state.error && (
          <p className="mt-3 text-red-400 text-xs text-center">
            Error: {state.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
