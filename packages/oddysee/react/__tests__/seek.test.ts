import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useHlsAudioPlayer } from '../src/use-hls-audio-player'

type HookDeps = unknown[] | undefined

const hookState: unknown[] = []
let hookIndex = 0

const resetHookIndex = () => {
  hookIndex = 0
}

const clearHookState = () => {
  hookState.length = 0
  hookIndex = 0
}

const depsEqual = (left: HookDeps, right: HookDeps) => {
  if (!left || !right) return false
  if (left.length !== right.length) return false
  return left.every((dep, index) => Object.is(dep, right[index]))
}

vi.mock('react', () => ({
  useState: (initial: unknown) => {
    const index = hookIndex++
    if (!(index in hookState)) {
      hookState[index] =
        typeof initial === 'function' ? (initial as () => unknown)() : initial
    }
    const setState = (next: unknown) => {
      hookState[index] =
        typeof next === 'function' ? (next as (prev: unknown) => unknown)(hookState[index]) : next
    }
    return [hookState[index], setState]
  },
  useRef: (initial: unknown) => {
    const index = hookIndex++
    if (!hookState[index]) {
      hookState[index] = { current: initial }
    }
    return hookState[index]
  },
  useMemo: (factory: () => unknown, deps?: HookDeps) => {
    const index = hookIndex++
    const record = hookState[index] as { deps: HookDeps; value: unknown } | undefined
    if (record && depsEqual(record.deps, deps)) {
      return record.value
    }
    const value = factory()
    hookState[index] = { deps, value }
    return value
  },
  useCallback: (callback: (...args: unknown[]) => unknown, deps?: HookDeps) => {
    const index = hookIndex++
    const record = hookState[index] as { deps: HookDeps; value: unknown } | undefined
    if (record && depsEqual(record.deps, deps)) {
      return record.value
    }
    hookState[index] = { deps, value: callback }
    return callback
  },
  useEffect: () => {},
}))

const MockHLSAudioPlayer = vi.hoisted(() => {
  return class MockHLSAudioPlayer {
  loading = false
  error = null
  readyState = 0
  isPlaying = false
  audioElement = { currentTime: 0 }
  beginSeek = vi.fn()
  updateSeek = vi.fn()
  commitSeek = vi.fn()
  destroy = vi.fn()
  on = vi.fn()
  off = vi.fn()
  setSource = vi.fn().mockResolvedValue(this)
  play = vi.fn().mockReturnValue(this)
  playAsync = vi.fn().mockResolvedValue(this)
  pause = vi.fn().mockReturnValue(this)
  setVolume = vi.fn().mockReturnValue(this)
  getState = vi.fn(() => ({
    track: null,
    currentTime: 5,
    duration: 60,
    volume: 1,
    loading: false,
    error: null,
    readyState: 0,
    isPlaying: false,
  }))
  getAudioElement = vi.fn(() => this.audioElement)
  }
})

vi.mock('oddysee-typescript', () => ({
  HLSAudioPlayer: MockHLSAudioPlayer,
}))

const renderHook = () => {
  resetHookIndex()
  return useHlsAudioPlayer({})
}

const setup = () => {
  let result = renderHook()
  return {
    get result() {
      return result
    },
    rerender: () => {
      result = renderHook()
      return result
    },
  }
}

beforeEach(() => {
  clearHookState()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('scrub.begin()', () => {
  it('enters scrubbing mode and triggers player seek', () => {
    const hook = setup()
    const player = hook.result.player as unknown as InstanceType<typeof MockHLSAudioPlayer>

    hook.result.scrub.begin()
    hook.rerender()

    expect(player.beginSeek).toHaveBeenCalledTimes(1)
    expect(hook.result.scrub.isScrubbing).toBe(true)
    expect(hook.result.scrub.displayTime).toBe(5)
  })
})

describe('scrub.update()', () => {
  it('updates the preview time while scrubbing', () => {
    const hook = setup()

    hook.result.scrub.begin()
    hook.rerender()

    hook.result.scrub.update(12)
    hook.rerender()

    expect(hook.result.scrub.displayTime).toBe(12)
  })
})

describe('scrub.commit()', () => {
  it('commits the preview time through the player', () => {
    const hook = setup()
    const player = hook.result.player as unknown as InstanceType<typeof MockHLSAudioPlayer>

    hook.result.scrub.begin()
    hook.rerender()

    hook.result.scrub.update(12)
    hook.result.scrub.commit()
    hook.rerender()

    expect(player.updateSeek).toHaveBeenCalledWith(12)
    expect(player.commitSeek).toHaveBeenCalledTimes(1)
    expect(hook.result.scrub.isScrubbing).toBe(false)
    expect(hook.result.scrub.displayTime).toBe(5)
  })

  it('does nothing when commit is called outside scrubbing', () => {
    const hook = setup()
    const player = hook.result.player as unknown as InstanceType<typeof MockHLSAudioPlayer>

    hook.result.scrub.commit()

    expect(player.updateSeek).not.toHaveBeenCalled()
    expect(player.commitSeek).not.toHaveBeenCalled()
  })
})
