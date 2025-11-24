import { HLSAudioPlayer } from '../../packages/core/dist/index.mjs';

class BasicPlayerApp {
    constructor() {
        this.player = null;
        this.init();
    }

    init() {
        // Get DOM elements
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
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
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.loadBtn.addEventListener('click', () => this.loadStream());
        this.headerBtn.addEventListener('click', () => this.loadStreamWithHeaders());
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

    async loadStream() {
        const url = this.streamUrlInput.value.trim();
        if (!url) {
            alert('Please enter a stream URL');
            return;
        }

        try {
            this.updateStatus('Loading stream...');
            
            // Get stream title for logging
            const streamTitle = this.getStreamTitle(url);
            this.logEvent(`Loading stream: ${streamTitle}`);
            this.logEvent(`URL: ${url}`);

            // Create player with basic config
            this.player = new HLSAudioPlayer();
            this.setupPlayerEvents();

            await this.player.setSource(url);
            
            this.updateStatus('Stream loaded successfully!');
            this.logEvent(`✅ Now playing: ${streamTitle}`);
            this.updateControls(true);
            this.updateTrackInfo(streamTitle);
            
        } catch (error) {
            this.updateStatus(`Error: ${error.message}`);
            this.logEvent(`❌ ERROR: ${error.message}`, 'error');
            console.error('Stream load error:', error);
        }
    }

    async loadStreamWithHeaders() {
        const url = this.streamUrlInput.value.trim();
        if (!url) {
            alert('Please enter a stream URL');
            return;
        }

        try {
            this.updateStatus('Loading stream with headers...');
            
            const streamTitle = this.getStreamTitle(url);
            this.logEvent(`Loading stream with custom headers: ${streamTitle}`);
            this.logEvent(`URL: ${url}`);

            // Create player with header configuration
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

            await this.player.setSource(url, {
                headers: {
                    'X-Request-ID': 'demo-' + Date.now()
                }
            });
            
            this.updateStatus('Stream with headers loaded!');
            this.logEvent(`✅ Now playing with headers: ${streamTitle}`);
            this.logEvent('🔐 Headers sent: Authorization, User-Agent, X-Custom-Header, X-Request-ID');
            this.updateControls(true);
            this.updateTrackInfo(streamTitle);
            
        } catch (error) {
            this.updateStatus(`Error: ${error.message}`);
            this.logEvent(`❌ ERROR: ${error.message}`, 'error');
            console.error('Stream load error:', error);
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

        this.player.on('play', () => {
            const streamTitle = this.getStreamTitle(this.streamUrlInput.value);
            this.logEvent(`▶️ Playback started: ${streamTitle}`);
            this.updateStatus('Playing');
            this.playBtn.disabled = true;
            this.pauseBtn.disabled = false;
        });

        this.player.on('pause', () => {
            const streamTitle = this.getStreamTitle(this.streamUrlInput.value);
            this.logEvent(`⏸️ Playback paused: ${streamTitle}`);
            this.updateStatus('Paused');
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
        });

        this.player.on('track-end', () => {
            this.logEvent('⏹️ Track ended');
            this.updateStatus('Track completed');
        });

        this.player.on('playlist-ready', () => {
            this.logEvent('📋 Playlist parsed and ready');
            this.updateQualityControls();
        });

        this.player.on('quality-change', (quality) => {
            this.logEvent(`🎚️ Quality changed to: ${quality?.name || 'unknown'}`);
        });

        this.player.on('error', (error) => {
            this.logEvent(`❌ Player Error: ${error.code} - ${error.message}`, 'error');
            this.updateStatus(`Error: ${error.code}`);
        });
    }

    play() {
        if (this.player) {
            this.player.play();
        }
    }

    pause() {
        if (this.player) {
            this.player.pause();
        }
    }

    setVolume(volume) {
        if (this.player) {
            this.player.setVolume(volume);
            this.logEvent(`🔊 Volume set to: ${Math.round(volume * 100)}%`);
        }
    }

    updateControls(enabled) {
        this.playBtn.disabled = !enabled;
        this.pauseBtn.disabled = !enabled;
        this.volumeSlider.disabled = !enabled;
        this.qualitySelect.disabled = !enabled;
    }

    updateTrackInfo(streamTitle = null) {
        if (this.player) {
            const track = this.player.getCurrentTrack();
            const displayTitle = streamTitle || track?.title || this.getStreamTitle(this.streamUrlInput.value);
            this.currentTrackElement.textContent = `Now Playing: ${displayTitle}`;
            
            if (track?.url) {
                this.currentTrackElement.innerHTML += `<br><small style="color: #888; font-size: 11px;">URL: ${track.url}</small>`;
            }
        }
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