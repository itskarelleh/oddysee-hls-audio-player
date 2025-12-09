// import { HLSAudioPlayer } from '../../packages/core/dist/index.mjs';
import { HLSAudioPlayer } from 'oddysee-typescript';


class BasicPlayerApp {
    constructor() {
        this.player = null;
        this.eventCallbacks = {}; // Store event callbacks for proper cleanup
        this.isPlaying = false; // Track playback state for combined play/pause button
        this.init();
    }

    init() {
        // Get DOM elements
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.headerBtn = document.getElementById('headerBtn');
        this.volumeSlider = document.getElementById('volume');
        this.qualitySelect = document.getElementById('quality');
        this.streamUrlInput = document.getElementById('streamUrl');
        this.statusElement = document.getElementById('status');
        this.currentTrackElement = document.getElementById('currentTrack');
        this.qualityLevelsElement = document.getElementById('qualityLevels');
        this.eventLogElement = document.getElementById('eventLog');

        // Set up event listeners
        this.setupEventListeners();
        this.setupCollapsibleEvents();
        
        this.logEvent('App initialized and ready');
        this.updateStatus('Ready to load stream');
    }

    setupEventListeners() {
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.loadBtn.addEventListener('click', () => this.loadStream());
        this.headerBtn.addEventListener('click', () => this.loadStreamWithHeaders());
        this.fluentDemoBtn = document.getElementById('fluentDemoBtn');
        this.fluentDemoBtn.addEventListener('click', () => this.demoFluentAPI());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));

        // Add some test stream URLs for quick testing
        this.setupTestStreams();
    }

    setupTestStreams() {
        const testStreams = [
            {
                url: 'https://pl.streamingvideoprovider.com/mp3-playlist/playlist.m3u8',
                title: '🎵 MP3 Music Playlist',
                description: 'Various MP3 tracks in HLS format'
            },
            {
                url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                title: '🔊 Mux Test Audio',
                description: 'Standard HLS.js test stream'
            },
            {
                url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
                title: '📡 Live Test Stream',
                description: 'Live HLS stream for testing'
            },
            {
                url: 'https://assets.afcdn.com/audio/20200916/2100k_aac.m3u8',
                title: '🇫🇷 French Radio',
                description: 'French audio stream example'
            },
            {
                url: 'http://stream.radioparadise.com/aac-320',
                title: '🌴 Radio Paradise',
                description: 'Internet radio station'
            }
        ];

        // Create quick load buttons for test streams
        const testContainer = document.createElement('div');
        testContainer.className = 'test-streams';
        testContainer.innerHTML = '<h4>🎵 Test Streams (Click to Load):</h4>';
        
        testStreams.forEach(stream => {
            const btn = document.createElement('button');
            btn.textContent = stream.title;
            btn.title = `${stream.description}\nURL: ${stream.url}`;
            btn.style.fontSize = '12px';
            btn.style.padding = '10px 14px';
            btn.style.margin = '6px';
            btn.addEventListener('click', () => {
                this.streamUrlInput.value = stream.url;
                this.currentStreamInfo = stream; // Store for display
                this.loadStream();
            });
            testContainer.appendChild(btn);
        });

        this.streamUrlInput.parentNode.appendChild(testContainer);
    }

    cleanupPlayer() {
        if (this.player) {
            this.logEvent('🧹 Cleaning up previous player...');
            
            try {
                // Remove all stored event listeners to prevent memory leaks
                Object.keys(this.eventCallbacks).forEach(event => {
                    if (this.player && typeof this.player.off === 'function') {
                        this.player.off(event, this.eventCallbacks[event]);
                    }
                });
            } catch (error) {
                this.logEvent(`⚠️ Error removing event listeners: ${error.message}`, 'warning');
            }
            
            // Clear stored callbacks
            this.eventCallbacks = {};
            
            try {
                // Destroy the player instance (this will stop audio and clean up resources)
                if (this.player && typeof this.player.destroy === 'function') {
                    this.player.destroy();
                }
            } catch (error) {
                this.logEvent(`⚠️ Error destroying player: ${error.message}`, 'warning');
            }
            
            this.player = null;
            this.isPlaying = false; // Reset playback state
            
            // Clear time display
            const timeElement = document.getElementById('timeDisplay');
            if (timeElement) {
                timeElement.remove();
            }
            
            this.logEvent('✅ Previous player cleaned up');
        }
    }

    async loadStream() {
        const url = this.streamUrlInput.value.trim();
        if (!url) {
            alert('Please enter a stream URL');
            return;
        }

        try {
            // Clean up any existing player before creating a new one
            this.cleanupPlayer();
            
            // Get stream title for logging
            const streamTitle = this.getStreamTitle(url);
            this.logEvent(`Loading stream: ${streamTitle}`);
            this.logEvent(`URL: ${url}`);

            // Create player with basic config and use fluent API
            this.player = new HLSAudioPlayer();
            this.setupPlayerEvents();

            // Use the new fluent API
            await this.player.setSource(url);
            
            this.logEvent(`✅ Stream loaded: ${streamTitle}`);
            this.updateControls(true);
            this.updateTrackInfo(streamTitle);
            
            // Auto-play after successful load
            this.logEvent('🎵 Auto-playing stream...');
            this.player.play();
            
        } catch (error) {
            this.logEvent(`❌ ERROR: ${error.message}`, 'error');
            console.error('Stream load error:', error);
            this.handleError(error);
        }
    }

    async loadStreamWithHeaders() {
        const url = this.streamUrlInput.value.trim();
        if (!url) {
            alert('Please enter a stream URL');
            return;
        }

        try {
            // Clean up any existing player before creating a new one
            this.cleanupPlayer();
            
            const streamTitle = this.getStreamTitle(url);
            this.logEvent(`Loading stream with custom headers: ${streamTitle}`);
            this.logEvent(`URL: ${url}`);

            // Create player with header configuration and use fluent API
            this.player = new HLSAudioPlayer({
                network: {
                    headers: {
                        'Authorization': 'Bearer demo-token-12345',
                        'User-Agent': 'HLS-Audio-Player-Demo/1.0',
                        'X-Custom-Header': 'Demo-Value'
                    }
                }
            });
            this.setupPlayerEvents();

            // Use the new fluent API with headers
            await this.player.setSource(url, {
                headers: {
                    'X-Request-ID': 'demo-' + Date.now()
                }
            });
            
            this.logEvent(`✅ Stream with headers loaded: ${streamTitle}`);
            this.logEvent('🔐 Headers sent: Authorization, User-Agent, X-Custom-Header, X-Request-ID');
            this.updateControls(true);
            this.updateTrackInfo(streamTitle);
            
            // Auto-play after successful load
            this.logEvent('🎵 Auto-playing stream with headers...');
            this.player.play();
            
        } catch (error) {
            this.logEvent(`❌ ERROR: ${error.message}`, 'error');
            console.error('Stream load error:', error);
            this.handleError(error);
        }
    }

    getStreamTitle(url) {
        // Try to find in our predefined streams
        const predefinedStreams = [
            { url: 'https://pl.streamingvideoprovider.com/mp3-playlist/playlist.m3u8', title: 'MP3 Music Playlist' },
            { url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', title: 'Mux Test Audio' },
            { url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8', title: 'Live Test Stream' },
            { url: 'https://assets.afcdn.com/audio/20200916/2100k_aac.m3u8', title: 'French Radio' },
            { url: 'http://stream.radioparadise.com/aac-320', title: 'Radio Paradise' }
        ];

        const stream = predefinedStreams.find(s => s.url === url);
        if (stream) {
            return stream.title;
        }

        // Fallback: extract from URL
        const filename = url.split('/').pop() || url.split('/').slice(-2, -1)[0];
        return filename.includes('.m3u8') ? filename : `${filename}.m3u8`;
    }

    setupPlayerEvents() {
        if (!this.player) return;

        // Clear any existing callbacks
        this.eventCallbacks = {};

        // New loading state events
        this.eventCallbacks.loading = () => {
            this.logEvent('🔄 Loading stream...');
            this.updateStatus('Loading...');
            this.showLoadingIndicator(true);
        };
        this.player.on('loading', this.eventCallbacks.loading);

        this.eventCallbacks.canplay = () => {
            this.logEvent('✅ Ready to play');
            this.updateStatus('Ready');
            this.showLoadingIndicator(false);
        };
        this.player.on('canplay', this.eventCallbacks.canplay);

        this.eventCallbacks.loadedmetadata = (track) => {
            this.logEvent('📊 Metadata loaded');
            if (track?.duration) {
                this.logEvent(`⏱️ Duration: ${Math.round(track.duration)}s`);
            }
            this.updateTrackInfo();
        };
        this.player.on('loadedmetadata', this.eventCallbacks.loadedmetadata);

        this.eventCallbacks.timeupdate = (currentTime) => {
            this.updateCurrentTime(currentTime);
        };
        this.player.on('timeupdate', this.eventCallbacks.timeupdate);

        // Existing events
        this.eventCallbacks.play = () => {
            const streamTitle = this.getStreamTitle(this.streamUrlInput.value);
            this.logEvent(`▶️ Playback started: ${streamTitle}`);
            this.updateStatus('Playing');
            this.isPlaying = true;
            this.updatePlayPauseButton();
        };
        this.player.on('play', this.eventCallbacks.play);

        this.eventCallbacks.pause = () => {
            const streamTitle = this.getStreamTitle(this.streamUrlInput.value);
            this.logEvent(`⏸️ Playback paused: ${streamTitle}`);
            this.updateStatus('Paused');
            this.isPlaying = false;
            this.updatePlayPauseButton();
        };
        this.player.on('pause', this.eventCallbacks.pause);

        this.eventCallbacks['track-end'] = () => {
            this.logEvent('⏹️ Track ended');
            this.updateStatus('Track completed');
        };
        this.player.on('track-end', this.eventCallbacks['track-end']);

        this.eventCallbacks['playlist-ready'] = () => {
            this.logEvent('📋 Playlist parsed and ready');
            this.updateQualityControls();
        };
        this.player.on('playlist-ready', this.eventCallbacks['playlist-ready']);

        this.eventCallbacks['quality-change'] = (quality) => {
            this.logEvent(`🎚️ Quality changed to: ${quality?.name || 'unknown'}`);
        };
        this.player.on('quality-change', this.eventCallbacks['quality-change']);

        this.eventCallbacks.error = (error) => {
            this.logEvent(`❌ Player Error: ${error.code} - ${error.message}`, 'error');
            this.updateStatus(`Error: ${error.code}`);
            this.showLoadingIndicator(false);
            this.handleError(error);
        };
        this.player.on('error', this.eventCallbacks.error);
    }

    togglePlayPause() {
        if (this.player) {
            if (this.isPlaying) {
                this.player.pause();
            } else {
                this.player.play();
            }
        }
    }

    updatePlayPauseButton() {
        if (this.playPauseBtn) {
            if (this.isPlaying) {
                this.playPauseBtn.textContent = '⏸️ Pause';
                this.playPauseBtn.title = 'Pause playback';
            } else {
                this.playPauseBtn.textContent = '▶️ Play';
                this.playPauseBtn.title = 'Start playback';
            }
        }
    }

    setVolume(volume) {
        if (this.player) {
            // Use fluent API
            this.player.setVolume(volume);
            this.logEvent(`🔊 Volume set to: ${Math.round(volume * 100)}% (fluent API)`);
        }
    }

    // Demo method to showcase fluent API chaining
    demoFluentAPI() {
        if (this.player && this.streamUrlInput.value.trim()) {
            this.logEvent('🔗 Demonstrating fluent API chaining...');
            
            // Example of fluent API usage
            this.player
                .setVolume(0.5)
                .play()
                .setVolume(0.8);
                
            this.logEvent('✅ Fluent API chain: setVolume(0.5) → play() → setVolume(0.8)');
        }
    }

    updateControls(enabled) {
        this.playPauseBtn.disabled = !enabled;
        this.volumeSlider.disabled = !enabled;
        this.qualitySelect.disabled = !enabled;
        if (this.fluentDemoBtn) {
            this.fluentDemoBtn.disabled = !enabled;
        }
    }

    updateTrackInfo(streamTitle = null) {
        if (this.player) {
            const track = this.player.getCurrentTrack();
            const displayTitle = streamTitle || track?.title || this.getStreamTitle(this.streamUrlInput.value);
            
            let trackInfo = `Now Playing: ${displayTitle}`;
            
            // Add duration if available
            if (track?.duration) {
                trackInfo += ` (${this.formatTime(track.duration)})`;
            }
            
            this.currentTrackElement.innerHTML = trackInfo;
            
            if (track?.url) {
                this.currentTrackElement.innerHTML += `<br><small style="color: #888; font-size: 11px;">URL: ${track.url}</small>`;
            }
        }
    }

    updateCurrentTime(currentTime) {
        if (this.player) {
            const track = this.player.getCurrentTrack();
            if (track?.duration) {
                const timeInfo = `${this.formatTime(currentTime)} / ${this.formatTime(track.duration)}`;
                
                // Update or create time display
                let timeElement = document.getElementById('timeDisplay');
                if (!timeElement) {
                    timeElement = document.createElement('div');
                    timeElement.id = 'timeDisplay';
                    timeElement.style.cssText = 'font-size: 12px; color: #666; margin-top: 4px;';
                    this.currentTrackElement.appendChild(timeElement);
                }
                timeElement.textContent = timeInfo;
            }
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    updateQualityControls() {
        if (!this.player) return;

        const qualities = this.player.getQualityLevels();
        this.qualityLevelsElement.textContent = `Available Qualities: ${qualities.length} level${qualities.length !== 1 ? 's' : ''}`;
        
        this.qualitySelect.innerHTML = '<option value="">Auto</option>';
        qualities.forEach(quality => {
            const option = document.createElement('option');
            option.value = quality.id;
            const bitrate = quality.bitrate ? Math.round(quality.bitrate / 1000) : '?';
            option.textContent = `${quality.name} (${bitrate}kbps)`;
            this.qualitySelect.appendChild(option);
        });

        this.qualitySelect.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === '') {
                this.player.setQuality(-1); // Auto
                this.logEvent('🎚️ Quality set to: Auto');
            } else {
                this.player.setQuality(parseInt(value));
                const qualityName = this.qualitySelect.options[this.qualitySelect.selectedIndex].text;
                this.logEvent(`🎚️ Quality set to: ${qualityName}`);
            }
        });
    }

    showLoadingIndicator(show) {
        // Create or update loading indicator
        let loadingElement = document.getElementById('loadingIndicator');
        
        if (show) {
            if (!loadingElement) {
                loadingElement = document.createElement('div');
                loadingElement.id = 'loadingIndicator';
                loadingElement.style.cssText = `
                    display: inline-block;
                    margin-left: 10px;
                    color: #666;
                    font-size: 12px;
                `;
                loadingElement.innerHTML = '🔄 Loading...';
                this.statusElement.parentNode.appendChild(loadingElement);
            }
        } else {
            if (loadingElement) {
                loadingElement.remove();
            }
        }
    }

    handleError(error) {
        // Handle different error types based on new error codes
        switch (error.code) {
            case 'NETWORK_ERROR':
                this.logEvent('🌐 Network error - Check your connection', 'error');
                break;
            case 'MEDIA_ERROR':
                this.logEvent('🎵 Media error - Stream format may be unsupported', 'error');
                break;
            case 'PLAYBACK_ERROR':
                this.logEvent('▶️ Playback error - Try reloading the stream', 'error');
                break;
            case 'FORMAT_NOT_SUPPORTED':
                this.logEvent('📋 Format not supported - Try a different stream', 'error');
                break;
            default:
                this.logEvent(`❌ Unknown error: ${error.message}`, 'error');
        }

        // Show player state for debugging
        if (this.player) {
            this.logEvent(`🔍 Player state: loading=${this.player.loading}, readyState=${this.player.readyState}`);
        }
    }

    updateStatus(status) {
        this.statusElement.textContent = status;
    }

    logEvent(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const eventEntry = document.createElement('div');
        eventEntry.className = 'event-entry';
        eventEntry.innerHTML = `
            <span class="event-time">[${timestamp}]</span> 
            <span class="event-message">${message}</span>
        `;
        
        if (type === 'error') {
            eventEntry.style.borderLeftColor = '#ff6b6b';
        } else if (type === 'warning') {
            eventEntry.style.borderLeftColor = '#ffa94d';
        }

        this.eventLogElement.appendChild(eventEntry);
        this.eventLogElement.scrollTop = this.eventLogElement.scrollHeight;
    }

    setupCollapsibleEvents() {
        this.eventsHeader = document.getElementById('eventsHeader');
        this.eventsContainer = document.getElementById('eventsContainer');
        this.eventsToggle = document.getElementById('eventsToggle');

        this.eventsHeader.addEventListener('click', () => {
            this.eventsContainer.classList.toggle('collapsed');
            this.eventsToggle.classList.toggle('collapsed');
        });
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BasicPlayerApp();
});