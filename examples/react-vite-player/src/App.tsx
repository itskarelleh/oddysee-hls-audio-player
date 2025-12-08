import { useState } from "react";
import { useHlsAudioPlayer } from "@use-hls-player/react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import "./App.css";

export default function App() {
  const [url, setUrl] = useState(
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  );

  const { state, controls } = useHlsAudioPlayer({
    src: { url },
    autoPlay: false,
  });

  const togglePlay = () => {
    if (state.playing) {
      controls.pause();
    } else {
      controls.play();
    }
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

        {/* URL Input */}
        <label className="text-xs uppercase tracking-wider text-teal-300 font-semibold">
          Stream URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full mt-1 p-3 rounded-lg bg-black/30 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-teal-400"
        />

        {/* Player Controls */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => controls.setSource(url)}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            Load
          </button>

          <button
            onClick={togglePlay}
            className="px-4 py-2 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full hover:from-gray-600"
            disabled={state.loading}
          >
            {state ? (
              <Play className="w-5 h-5 text-teal-300" />
            ) : (
              <Pause className="w-5 h-5 text-teal-300" />
            )}
          </button>

          <button
            onClick={() =>
              controls.setVolume(state.volume === 0 ? 1 : 0)
            }
            className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
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
          <input
            type="range"
            min={0}
            max={state.duration ?? 0}
            value={state.currentTime}
            onChange={(e) =>
              controls.seek(Number(e.target.value))
            }
            className="w-full cursor-pointer accent-teal-300"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{state.currentTime.toFixed(0)}s</span>
            <span>
              {state.duration
                ? `${state.duration.toFixed(0)}s`
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
          {state.loading ? "Loading stream…" : "Ready"}
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
