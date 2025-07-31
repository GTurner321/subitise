/**
 * Universal Audio System
 * Handles audio functionality across all games including mute button and speech synthesis
 */
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.audioEnabled = true;
        this.isTabVisible = true;
        
        // Mute button references
        this.muteButton = null;
        this.muteContainer = null;
        
        this.initializeAudio();
        this.createMuteButton();
        this.setupVisibilityHandling();
    }
    
    async initializeAudio() {
        if (!this.audioEnabled) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.audioEnabled = false;
        }
    }
    
    createMuteButton() {
        // Create mute button container
        const muteContainer = document.createElement('div');
        muteContainer.className = 'audio-button-container';
        muteContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background-color: rgba(64, 64, 64, 0.9);
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            touch-action: manipulation;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            min-height: 44px;
            min-width: 44px;
        `;
        
        // Create button
        this.muteButton = document.createElement('button');
        this.muteButton.className = 'audio-button';
        this.muteButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            outline: none;
            touch-action: manipulation;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        `;
        
        // Set initial icon
        this.updateMuteButtonIcon();
        
        // Add event listeners
        this.muteButton.addEventListener('click', () => this.toggleAudio());
        this.muteButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleAudio();
        });
        
        // Hover and focus effects
        muteContainer.addEventListener('mouseenter', () => {
            muteContainer.style.backgroundColor = 'rgba(64, 64, 64, 1)';
            muteContainer.style.transform = 'scale(1.1)';
        });
        
        muteContainer.addEventListener('mouseleave', () => {
            muteContainer.style.backgroundColor = 'rgba(64, 64, 64, 0.9)';
            muteContainer.style.transform = 'scale(1)';
        });
        
        muteContainer.addEventListener('focus', () => {
            muteContainer.style.backgroundColor = 'rgba(64, 64, 64, 1)';
            muteContainer.style.transform = 'scale(1.1)';
        });
        
        muteContainer.addEventListener('blur', () => {
            muteContainer.style.backgroundColor = 'rgba(64, 64, 64, 0.9)';
            muteContainer.style.transform = 'scale(1)';
        });
        
        muteContainer.appendChild(this.muteButton);
        document.body.appendChild(muteContainer);
        
        this.muteContainer = muteContainer;
    }
    
    updateMuteButtonIcon() {
        if (this.muteButton) {
            this.muteButton.innerHTML = this.audioEnabled ? '🔊' : '🔇';
            this.muteButton.title = this.audioEnabled ? 'Mute Audio' : 'Unmute Audio';
            this.muteButton.setAttribute('aria-label', this.audioEnabled ? 'Mute Audio' : 'Unmute Audio');
        }
    }
    
    setupVisibilityHandling() {
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            
            if (!this.isTabVisible) {
                // Tab is hidden - stop all audio
                this.stopAllAudio();
            }
        });
    }
    
    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        this.updateMuteButtonIcon();
        
        // Stop any current speech
        this.stopAllAudio();
        
        // Provide feedback
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Audio enabled');
            }, 100);
        }
        
        // Store preference in localStorage if available
        try {
            localStorage.setItem('audioEnabled', this.audioEnabled.toString());
        } catch (error) {
            // Silent failure for localStorage
        }
    }
    
    stopAllAudio() {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
    }
    
    speakText(text, options = {}) {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        const defaults = {
            rate: 0.9,
            pitch: 1.3,
            volume: 0.8,
            preferMaleVoice: true
        };
        
        const settings = { ...defaults, ...options };
        
        try {
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = settings.rate;
                utterance.pitch = settings.pitch;
                utterance.volume = settings.volume;
                
                // Voice selection
                if (settings.preferMaleVoice) {
                    const voices = speechSynthesis.getVoices();
                    let selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('male') ||
                        voice.name.toLowerCase().includes('boy') ||
                        voice.name.toLowerCase().includes('man') ||
                        (!voice.name.toLowerCase().includes('female') && 
                         !voice.name.toLowerCase().includes('woman') &&
                         !voice.name.toLowerCase().includes('girl'))
                    );
                    
                    if (selectedVoice) utterance.voice = selectedVoice;
                }
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.warn('Speech synthesis error:', error);
        }
    }
    
    playTone(frequency, duration = 0.5, type = 'sine', volume = 0.3) {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Audio tone error:', error);
        }
    }
    
    playCompletionSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Play ascending notes
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Completion sound error:', error);
        }
    }
    
    playFailureSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Play descending tone
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('Failure sound error:', error);
        }
    }
    
    // Load audio preference from localStorage
    loadAudioPreference() {
        try {
            const saved = localStorage.getItem('audioEnabled');
            if (saved !== null) {
                this.audioEnabled = saved === 'true';
                this.updateMuteButtonIcon();
            }
        } catch (error) {
            // Silent failure for localStorage
        }
    }
    
    destroy() {
        // Stop all audio
        this.stopAllAudio();
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // Remove mute button
        if (this.muteContainer && this.muteContainer.parentNode) {
            this.muteContainer.parentNode.removeChild(this.muteContainer);
        }
    }
}

// Create global instance and load preferences
window.AudioSystem = new AudioSystem();
window.AudioSystem.loadAudioPreference();
