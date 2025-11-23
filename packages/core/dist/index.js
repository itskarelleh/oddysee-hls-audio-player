"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  HLSAudioPlayer: () => HLSAudioPlayer
});
module.exports = __toCommonJS(src_exports);

// src/hls-audio-player.ts
var import_hls = __toESM(require("hls.js"));
var HLSAudioPlayer = class {
  constructor(config = {}) {
    this.eventListeners = /* @__PURE__ */ new Map();
    this.config = config;
    this.audioElement = new Audio();
    this.hls = new import_hls.default(this.mapConfigToHLS(config));
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
    this.hls.on(import_hls.default.Events.MANIFEST_PARSED, () => {
      this.emit("playlist-ready");
    });
    this.hls.on(import_hls.default.Events.ERROR, (event, data) => {
      const error = this.mapHlsError(data);
      this.emit("error", error);
    });
    this.hls.on(import_hls.default.Events.LEVEL_SWITCHED, (event, data) => {
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
      case import_hls.default.ErrorTypes.NETWORK_ERROR:
        return { code: "NETWORK_ERROR", message: "Network error occurred", details: data };
      case import_hls.default.ErrorTypes.MEDIA_ERROR:
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
      this.hls = new import_hls.default(this.mapConfigToHLS(mergedConfig));
      this.setupHlsEvents();
      this.hls.attachMedia(this.audioElement);
      this.hls.on(import_hls.default.Events.MANIFEST_PARSED, () => {
        resolve();
      });
      this.hls.on(import_hls.default.Events.ERROR, (event, data) => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HLSAudioPlayer
});
