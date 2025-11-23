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
            'https://pl.streamingvideoprovider.com/mp3-playlist/playlist.m3u8', // MP3 audio HLS
            'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // Mux test audio
            'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8', // Live test
            'https://assets.afcdn.com/audio/20200916/2100k_aac.m3u8', // French radio
            'http://stream.radioparadise.com/aac-320', // Radio Paradise (works as HLS)
        ];
        // Create quick load buttons for test streams
        const testContainer = document.createElement('div');
        testContainer.className = 'test-streams';
        testContainer.innerHTML = '<h4>Test Streams:</h4>';
        
        testStreams.forEach(url => {
            const btn = document.createElement('button');
            btn.textContent = `Load: ${url.split('/').pop()}`;
            btn.style.fontSize = '12px';
            btn.style.padding = '8px 12px';
            btn.addEventListener('click', () => {
                this.streamUrlInput.value = url;
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
            this.logEvent(`Loading stream: ${url}`);

            // Create player with basic config
            this.player = new HLSAudioPlayer();
            this.setupPlayerEvents();

            await this.player.setSource(url);
            
            this.updateStatus('Stream loaded successfully!');
            this.logEvent('Stream loaded and ready to play');
            this.updateControls(true);
            this.updateTrackInfo();
            
        } catch (error) {
            this.updateStatus(`Error: ${error.message}`);
            this.logEvent(`ERROR: ${error.message}`, 'error');
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
            this.logEvent(`Loading stream with custom headers: ${url}`);

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
            this.logEvent('Stream with custom headers loaded successfully');
            this.logEvent('Headers sent: Authorization, User-Agent, X-Custom-Header, X-Request-ID');
            this.updateControls(true);
            this.updateTrackInfo();
            
        } catch (error) {
            this.updateStatus(`Error: ${error.message}`);
            this.logEvent(`ERROR: ${error.message}`, 'error');
            console.error('Stream load error:', error);
        }
    }

    setupPlayerEvents() {
        if (!this.player) return;

        this.player.on('play', () => {
            this.logEvent('Playback started');
            this.updateStatus('Playing');
            this.playBtn.disabled = true;
            this.pauseBtn.disabled = false;
        });

        this.player.on('pause', () => {
            this.logEvent('Playback paused');
            this.updateStatus('Paused');
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
        });

        this.player.on('track-end', () => {
            this.logEvent('Track ended');
            this.updateStatus('Track completed');
        });

        this.player.on('playlist-ready', () => {
            this.logEvent('Playlist parsed and ready');
            this.updateQualityControls();
        });

        this.player.on('quality-change', (quality) => {
            this.logEvent(`Quality changed to: ${quality?.name || 'unknown'}`);
        });

        this.player.on('error', (error) => {
            this.logEvent(`Player Error: ${error.code} - ${error.message}`, 'error');
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
            this.logEvent(`Volume set to: ${Math.round(volume * 100)}%`);
        }
    }

    updateControls(enabled) {
        this.playBtn.disabled = !enabled;
        this.pauseBtn.disabled = !enabled;
        this.volumeSlider.disabled = !enabled;
        this.qualitySelect.disabled = !enabled;
    }

    updateTrackInfo() {
        if (this.player) {
            const track = this.player.getCurrentTrack();
            this.currentTrackElement.textContent = `Current Track: ${track?.title || track?.url || 'Unknown'}`;
        }
    }

    updateQualityControls() {
        if (!this.player) return;

        const qualities = this.player.getQualityLevels();
        this.qualityLevelsElement.textContent = `Available Qualities: ${qualities.length} levels`;
        
        this.qualitySelect.innerHTML = '<option value="">Auto</option>';
        qualities.forEach(quality => {
            const option = document.createElement('option');
            option.value = quality.id;
            option.textContent = `${quality.name} (${Math.round(quality.bitrate / 1000)}kbps)`;
            this.qualitySelect.appendChild(option);
        });

        this.qualitySelect.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === '') {
                this.player.setQuality(-1); // Auto
            } else {
                this.player.setQuality(parseInt(value));
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
            eventEntry.style.borderLeftColor = '#e53e3e';
        } else if (type === 'warning') {
            eventEntry.style.borderLeftColor = '#dd6b20';
        }

        this.eventLogElement.appendChild(eventEntry);
        this.eventLogElement.scrollTop = this.eventLogElement.scrollHeight;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BasicPlayerApp();
});