"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useHlsAudioPlayer } from "../../../packages/oddysee/react/src/use-hls-audio-player";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Home() {
  const playlist = [
    {
      id: 1,
      url: "https://pl.streamingvideoprovider.com/mp3-playlist/playlist.m3u8",
      title: "MP3 Music Playlist",
      description: "Various MP3 tracks in HLS format",
    },
    {
      id: 2,
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      title: "Mux Test Audio",
      description: "Standard HLS.js test stream",
    },
    {
      id: 3,
      url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
      title: "Live Test Stream",
      description: "Live HLS stream for testing",
    },
    {
      id: 4,
      url: "https://assets.afcdn.com/audio/20200916/2100k_aac.m3u8",
      title: "French Radio",
      description: "French audio stream example",
    },
    {
      id: 5,
      url: "http://stream.radioparadise.com/aac-320",
      title: "Radio Paradise",
      description: "Internet radio station",
    },
  ];

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const currentTrack = playlist[currentTrackIndex];
  const maxRetryAttempts = 3;
  const retryDelayMs = 1500;
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [retryPending, setRetryPending] = useState(false);
  const retryAttemptsRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setRetryPending(false);
  }, []);

  const resetRetryState = useCallback(() => {
    retryAttemptsRef.current = 0;
    setRetryAttempts(0);
    clearRetryTimeout();
  }, [clearRetryTimeout]);

  const { state, controls, isLoading, isPlaying, scrub } = useHlsAudioPlayer({
    src: { url: currentTrack.url },
    autoPlay: true,
    on: {
      canplay: resetRetryState,
    },
  });

  const scheduleRetry = useCallback(() => {
    if (retryAttemptsRef.current >= maxRetryAttempts) return false;
    clearRetryTimeout();
    const nextAttempt = retryAttemptsRef.current + 1;
    retryAttemptsRef.current = nextAttempt;
    setRetryAttempts(nextAttempt);
    setRetryPending(true);
    retryTimeoutRef.current = setTimeout(() => {
      setRetryPending(false);
      controls.retry(maxRetryAttempts, retryDelayMs);
    }, retryDelayMs);
    return true;
  }, [clearRetryTimeout, controls, maxRetryAttempts, retryDelayMs]);

  useEffect(() => {
    if (!state.error || retryPending) return;
    scheduleRetry();
  }, [retryPending, scheduleRetry, state.error]);

  useEffect(() => {
    resetRetryState();
  }, [currentTrackIndex, resetRetryState]);

  useEffect(() => () => clearRetryTimeout(), [clearRetryTimeout]);

  const togglePlay = () => {
    if (isPlaying) {
      controls.pause();
    } else {
      controls.play();
    }
  };

  const playTrack = (index: number) => {
    setCurrentTrackIndex(index);
    controls.setSource(playlist[index].url);
  };

  const playPrevious = () => {
    const newIndex =
      currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
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

  const retryLimitReached = retryAttempts >= maxRetryAttempts;
  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_#f4f4f5,_#e4e4e7_45%,_#d4d4d8)] px-6 py-12 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.4),transparent)] opacity-50" />
      <div className="relative mx-auto flex max-w-2xl items-center justify-center">
        <Card className="w-full border-muted/60 bg-white/80 shadow-xl backdrop-blur">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              HLS Audio Player
            </CardTitle>
            <CardDescription className="text-sm">
              Smooth audio from an HLS (.m3u8) stream
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Now Playing
              </div>
              <div className="mt-2 text-lg font-semibold text-foreground">
                {currentTrack.title}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentTrack.description}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <span>Playlist</span>
                <span>{playlist.length} tracks</span>
              </div>
              <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
                {playlist.map((track, index) => (
                  <button
                    key={track.id}
                    onClick={() => playTrack(index)}
                    className={cn(
                      "flex w-full flex-col gap-1 rounded-lg border border-transparent px-3 py-2 text-left transition",
                      "hover:border-border hover:bg-muted/70",
                      index === currentTrackIndex &&
                        "border-border bg-muted shadow-sm",
                    )}
                  >
                    <span className="text-sm font-medium">{track.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {track.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={playPrevious}
                aria-label="Previous track"
              >
                <SkipBack />
              </Button>
              <Button
                size="icon"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                disabled={isLoading}
                className="h-12 w-12 rounded-full text-base"
              >
                {isPlaying ? <Pause /> : <Play />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={playNext}
                aria-label="Next track"
              >
                <SkipForward />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() =>
                  controls.setVolume(state.volume === 0 ? 1 : 0)
                }
                aria-label="Toggle mute"
              >
                {state.volume === 0 ? <VolumeX /> : <Volume2 />}
              </Button>
            </div>

            <div className="space-y-2">
              <div
                ref={scrubberRef}
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={scrub.displayTime}
                tabIndex={duration ? 0 : -1}
                data-scrubber="custom"
                className={cn(
                  "relative h-3 w-full rounded-full border border-border bg-muted",
                  duration ? "cursor-pointer" : "opacity-50",
                )}
                onPointerDown={(event) => {
                  if (!duration || !scrubberRef.current) return;
                  scrub.begin();
                  const nextTime = getTimeFromClientX(
                    event.clientX,
                    scrubberRef.current,
                  );
                  scrub.update(nextTime);
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!scrub.isScrubbing || !scrubberRef.current) return;
                  const nextTime = getTimeFromClientX(
                    event.clientX,
                    scrubberRef.current,
                  );
                  scrub.update(nextTime);
                }}
                onPointerUp={(event) => {
                  if (!scrubberRef.current) return;
                  const nextTime = getTimeFromClientX(
                    event.clientX,
                    scrubberRef.current,
                  );
                  scrub.commit(nextTime);
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onPointerCancel={(event) => {
                  if (!scrubberRef.current) return;
                  const nextTime = getTimeFromClientX(
                    event.clientX,
                    scrubberRef.current,
                  );
                  scrub.commit(nextTime);
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-primary"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-background bg-primary shadow"
                  style={{ left: `calc(${progressPercent}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(scrub.displayTime)}</span>
                <span>{duration ? formatTime(duration) : "--:--"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Volume · {Math.round(state.volume * 100)}%
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={state.volume}
                onChange={(event) =>
                  controls.setVolume(parseFloat(event.target.value))
                }
                className="h-2 w-full cursor-pointer accent-foreground"
              />
            </div>

            <div className="text-center text-xs text-muted-foreground">
              {isLoading ? "Loading stream…" : "Ready"}
            </div>

            {state.error && (
              <div className="space-y-2 text-center">
                {retryPending && (
                  <p className="text-xs text-amber-600">
                    Retrying in {retryDelayMs / 1000}s (attempt {retryAttempts}/
                    {maxRetryAttempts})
                  </p>
                )}
                {retryLimitReached && !retryPending && (
                  <p className="text-xs text-amber-600">
                    Retry limit reached ({maxRetryAttempts} attempts).
                  </p>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    resetRetryState();
                    controls.retry(maxRetryAttempts, retryDelayMs);
                  }}
                  disabled={retryPending}
                >
                  Retry now
                </Button>
              </div>
            )}

            {state.error && (
              <p className="text-center text-xs text-destructive">
                Error: {state.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
