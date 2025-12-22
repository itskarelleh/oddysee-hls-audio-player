import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
  type MouseEvent,
  type TouchEvent,
} from 'react'
import {
  HLSAudioPlayer,
  type HLSAudioPlayerInterface,
  type PlayerConfig,
  type SourceOptions,
  type PlayerEvent,
  type PlayerError,
  type Track,
  type QualityLevel,
  type PlayerState
} 
from '../../typescript/src/index'
// from 'oddysee-typescript'

// Local mirror of the core's PlayerEventMap so we don't depend on it being exported
export type PlayerEventMap = {
  play: void
  pause: void
  'track-end': Track | null
  error: PlayerError
  'quality-change': QualityLevel
  'playlist-ready': void
  loadedmetadata: Track | null
  timeupdate: { currentTime: number; duration: number | null }
  loading: void
  canplay: void
}

export interface UseHlsAudioPlayerOptions {
  config?: PlayerConfig
  src?: { url: string; options?: SourceOptions }
  autoPlay?: boolean
  on?: Partial<{
    [K in PlayerEvent]: (data: PlayerEventMap[K]) => void
  }>
}

export interface UseHlsAudioPlayerResult {
  player: HLSAudioPlayerInterface | null
  state: PlayerState
  isPlaying: boolean
  duration: number
  isLoading: boolean
  loading: boolean
  error: PlayerError | null
  readyState: number
  scrub: {
    isScrubbing: boolean
    displayTime: number
    start: () => void
    preview: (time: number) => void
    commit: (time?: number) => void
  }
  seekBar: {
    isScrubbing: boolean
    displayTime: number
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
    onPointerDown: () => void
    onPointerUp: (event: PointerEvent<HTMLInputElement>) => void
    onPointerCancel: () => void
    onMouseDown: () => void
    onMouseUp: (event: MouseEvent<HTMLInputElement>) => void
    onTouchStart: () => void
    onTouchEnd: (event: TouchEvent<HTMLInputElement>) => void
    onFocus: () => void
    onBlur: () => void
  }
  controls: {
    setSource: (
      url: string,
      options?: SourceOptions,
    ) => Promise<HLSAudioPlayerInterface | null>
    play: () => void
    playAsync: () => Promise<HLSAudioPlayerInterface | null>
    pause: () => void
    setVolume: (volume: number) => void
    setCurrentTime: (time: number) => void
    beginSeek: () => void
    updateSeek: (time: number) => void
    commitSeek: () => void
  }
}

const defaultState: PlayerState = {
  track: null,
  currentTime: 0,
  duration: null,
  volume: 1,
  loading: false,
  error: null,
  readyState: 0,
  isPlaying: false,
}

export function useHlsAudioPlayer(
  options: UseHlsAudioPlayerOptions = {},
): UseHlsAudioPlayerResult {
  const { config, src, autoPlay, on } = options

  const player = useMemo(() => {
    return new HLSAudioPlayer(config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [state, setState] = useState<PlayerState>(
    () => player.getState() ?? defaultState,
  )

  const [loading, setLoading] = useState<boolean>(player.loading ?? false)
  const [error, setError] = useState<PlayerError | null>(player.error ?? null)
  const [readyState, setReadyState] = useState<number>(player.readyState ?? 0)
  const [isPlaying, setIsPlaying] = useState<boolean>(player.isPlaying ?? false)
  const [duration, setDuration] = useState<number>(player.getState()?.duration ?? 0)
  const [isLoading, setIsLoading] = useState<boolean>(player.loading ?? false)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [scrubTime, setScrubTime] = useState(0)
  const scrubTimeRef = useRef(0)

  useEffect(() => {
    const handleStateChange = () => {
      const next = player.getState()
      setState(next)
      setLoading(next.loading)
      setError(next.error)
      setReadyState(next.readyState)
      setIsPlaying(next.isPlaying)
      setDuration(next.duration ?? 0)
      setIsLoading(next.loading)
    }

    const listeners: { [K in PlayerEvent]?: (data: PlayerEventMap[K]) => void } = {
      play: data => {
        handleStateChange()
        on?.play?.(data as PlayerEventMap['play'])
      },
      pause: data => {
        handleStateChange()
        on?.pause?.(data as PlayerEventMap['pause'])
      },
      'track-end': data => {
        handleStateChange()
        on?.['track-end']?.(data as PlayerEventMap['track-end'])
      },
      error: data => {
        handleStateChange()
        on?.error?.(data as PlayerEventMap['error'])
      },
      'quality-change': data => {
        handleStateChange()
        on?.['quality-change']?.(data as PlayerEventMap['quality-change'])
      },
      'playlist-ready': data => {
        handleStateChange()
        on?.['playlist-ready']?.(data as PlayerEventMap['playlist-ready'])
      },
      loadedmetadata: data => {
        handleStateChange()
        on?.loadedmetadata?.(data as PlayerEventMap['loadedmetadata'])
      },
      timeupdate: data => {
        handleStateChange()
        on?.timeupdate?.(data as PlayerEventMap['timeupdate'])
      },
      loading: data => {
        handleStateChange()
        on?.loading?.(data as PlayerEventMap['loading'])
      },
      canplay: data => {
        handleStateChange()
        on?.canplay?.(data as PlayerEventMap['canplay'])
      },
    }

    ;(Object.keys(listeners) as PlayerEvent[]).forEach(event => {
      const handler = listeners[event]!
      player.on(event, handler as any)
    })

    return () => {
      ;(Object.keys(listeners) as PlayerEvent[]).forEach(event => {
        const handler = listeners[event]
        if (handler) {
          player.off(event, handler as any)
        }
      })
    }
  }, [player, on])

  useEffect(() => {
    let cancelled = false

    if (!src) return

    player
      .setSource(src.url, src.options)
      .then((p: HLSAudioPlayerInterface) => {
        if (cancelled) return
        if (autoPlay) {
          p.play()
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('Failed to set HLS source', err)
      })

    return () => {
      cancelled = true
    }
  }, [player, src?.url, src?.options, autoPlay])

  useEffect(() => {
    return () => {
      player.destroy()
    }
  }, [player])

  const controls = useMemo(
    () => ({
      setSource: async (url: string, options?: SourceOptions) => {
        try {
          const p = await player.setSource(url, options)
          if (autoPlay) {
            p.play()
          }
          return p
        } catch {
          return null
        }
      },
      play: () => {
        player.play()
      },
      playAsync: async () => {
        try {
          const p = await player.playAsync()
          return p
        } catch {
          return null
        }
      },
      pause: () => {
        player.pause()
      },
      setVolume: (volume: number) => {
        player.setVolume(volume)
        const next = player.getState()
        setState(next)
      },
      setCurrentTime: (time: number) => {
        const audioElement = player.getAudioElement()
        audioElement.currentTime = time
      },
      beginSeek:() =>
        player.beginSeek(),
      updateSeek: (time: number) =>
        player.updateSeek(time),
      commitSeek: () =>
        player.commitSeek(),
    }),
    [player, autoPlay],
  )

  const beginScrub = useCallback(() => {
    if (!state.duration) return
    setIsScrubbing(true)
    scrubTimeRef.current = state.currentTime
    setScrubTime(state.currentTime)
    player.beginSeek()
  }, [player, state.currentTime, state.duration])

  const updateScrub = useCallback((time: number) => {
    scrubTimeRef.current = time
    setScrubTime(time)
  }, [])

  const commitScrub = useCallback(
    (time?: number) => {
      if (!isScrubbing) return
      if (typeof time === 'number' && !Number.isNaN(time)) {
        scrubTimeRef.current = time
        setScrubTime(time)
      }
      setIsScrubbing(false)
      player.updateSeek(scrubTimeRef.current)
      player.commitSeek()
    },
    [player, isScrubbing],
  )

  const commitScrubFromElement = useCallback(
    (element: HTMLInputElement) => {
      requestAnimationFrame(() => {
        const nextTime = Number(element.value)
        commitScrub(nextTime)
      })
    },
    [commitScrub],
  )

  return {
    player,
    state,
    isPlaying,
    duration,
    isLoading,
    loading,
    error,
    readyState,
    seekBar: {
      isScrubbing,
      displayTime: isScrubbing ? scrubTime : state.currentTime,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        const nextTime = Number(event.target.value)
        if (!isScrubbing) {
          beginScrub()
        }
        updateScrub(nextTime)
      },
      onPointerDown: () => {
        if (!isScrubbing) {
          beginScrub()
        }
      },
      onPointerUp: (event: PointerEvent<HTMLInputElement>) => {
        commitScrubFromElement(event.currentTarget)
      },
      onPointerCancel: () => {
        commitScrub()
      },
      onMouseDown: () => {
        if (!isScrubbing) {
          beginScrub()
        }
      },
      onMouseUp: (event: MouseEvent<HTMLInputElement>) => {
        commitScrubFromElement(event.currentTarget)
      },
      onTouchStart: () => {
        if (!isScrubbing) {
          beginScrub()
        }
      },
      onTouchEnd: (event: TouchEvent<HTMLInputElement>) => {
        commitScrubFromElement(event.currentTarget)
      },
      onFocus: () => {
        if (!isScrubbing) {
          beginScrub()
        }
      },
      onBlur: () => {
        commitScrub()
      },
    },
    scrub: {
      isScrubbing,
      displayTime: isScrubbing ? scrubTime : state.currentTime,
      start: beginScrub,
      preview: updateScrub,
      commit: commitScrub,
    },
    controls,
  }
}
