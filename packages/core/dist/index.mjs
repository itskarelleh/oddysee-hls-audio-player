// src/hls-audio-player.ts
import HLS from "hls.js";
var HLSAudioPlayer = class {
  constructor(config = {}) {
    this.eventListeners = /* @__PURE__ */ new Map();
    this.config = config;
    this.audioElement = new Audio();
    this.hls = new HLS(this.mapConfigToHLS(config));
    this.setupHlsEvents();
    this.setupAudioEvents();
  }
  mapConfigToHLS(config) {
    const hlsConfig = {
      // Core performance
      enableWorker: true,
      lowLatencyMode: true,
      // Buffer settings
      backBufferLength: 90,
      maxMaxBufferLength: 30,
      maxBufferSize: 60 * 1e3 * 1e3,
      // 60MB
      // Audio streaming optimizations
      maxBufferHole: 0.5,
      maxFragLookUpTolerance: 0.25,
      // Disable video-specific features
      stretchShortVideoTrack: false,
      // Header configuration
      xhrSetup: (xhr, url) => {
        const headers = {
          ...config.network?.headers
        };
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }
    };
    return hlsConfig;
  }
  setupHlsEvents() {
    this.hls.on(HLS.Events.MANIFEST_PARSED, () => {
      this.emit("playlist-ready");
    });
    this.hls.on(HLS.Events.ERROR, (event, data) => {
      const error = this.mapHlsError(data);
      this.emit("error", error);
    });
    this.hls.on(HLS.Events.LEVEL_SWITCHED, (event, data) => {
      this.emit("quality-change", this.getQualityLevels()[data.level]);
    });
  }
  setupAudioEvents() {
    this.audioElement.addEventListener("play", () => this.emit("play"));
    this.audioElement.addEventListener("pause", () => this.emit("pause"));
    this.audioElement.addEventListener("ended", () => this.emit("track-end"));
  }
  mapHlsError(data) {
    switch (data.type) {
      case HLS.ErrorTypes.NETWORK_ERROR:
        return { code: "NETWORK_ERROR", message: "Network error occurred", details: data };
      case HLS.ErrorTypes.MEDIA_ERROR:
        return { code: "MEDIA_ERROR", message: "Media error occurred", details: data };
      default:
        return { code: "UNKNOWN_ERROR", message: "An unknown error occurred", details: data };
    }
  }
  async setSource(url, options) {
    return new Promise((resolve, reject) => {
      if (this.hls) {
        this.hls.destroy();
      }
      const mergedConfig = {
        ...this.config,
        network: {
          ...this.config.network,
          headers: {
            ...this.config.network?.headers,
            ...options?.headers
          }
        }
      };
      this.hls = new HLS(this.mapConfigToHLS(mergedConfig));
      this.setupHlsEvents();
      this.hls.attachMedia(this.audioElement);
      this.hls.on(HLS.Events.MANIFEST_PARSED, () => {
        resolve();
      });
      this.hls.on(HLS.Events.ERROR, (event, data) => {
        reject(this.mapHlsError(data));
      });
      this.hls.loadSource(url);
      this.currentTrack = { id: url, url, title: url.split("/").pop() };
    });
  }
  play() {
    this.audioElement.play().catch((error) => {
      this.emit("error", { code: "PLAYBACK_ERROR", message: error.message });
    });
  }
  pause() {
    this.audioElement.pause();
  }
  setVolume(volume) {
    this.audioElement.volume = Math.max(0, Math.min(1, volume));
  }
  getVolume() {
    return this.audioElement.volume;
  }
  getQualityLevels() {
    if (!this.hls.levels.length) {
      return [];
    }
    return this.hls.levels.map((level, index) => ({
      id: index,
      name: this.getQualityName(level.bitrate),
      bitrate: level.bitrate,
      audioCodec: level.audioCodec
    }));
  }
  setQuality(quality) {
    if (typeof quality === "number") {
      this.hls.currentLevel = quality;
    } else {
      const levels = this.getQualityLevels();
      const level = levels.find((l) => l.name === quality);
      if (level) {
        this.hls.currentLevel = level.id;
      }
    }
  }
  getQualityName(bitrate) {
    if (bitrate > 5e5)
      return "high";
    if (bitrate > 2e5)
      return "medium";
    return "low";
  }
  getCurrentTrack() {
    return this.currentTrack;
  }
  // Event system
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }
  emit(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((callback) => callback(data));
  }
  destroy() {
    this.hls.destroy();
    this.audioElement.remove();
    this.eventListeners.clear();
  }
};
export {
  HLSAudioPlayer
};
