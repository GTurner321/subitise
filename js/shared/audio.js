/**
 * Universal Audio System
 * Handles audio functionality and responsive UI buttons across all games
 * Enhanced with complete tab visibility audio management and fullscreen support
 * Styles managed through CSS classes for better separation of concerns
 */
class AudioSystem {
    constructor(options = {}) {
        this.audioContext = null;
        this.audioEnabled = true;
        this.isTabVisible = true;
        this.isFullscreen = false;
        
        // UI configuration
        this.config = {
            buttonsAtBottom: options.buttonsAtBottom || false,
            customBackUrl: options.backUrl || '../../index.html',
            disableRotation: options.disableRotation || false, // NEW: Allow games to opt-out of rotation
            ...options
        };
        
        // UI button references
        this.muteButton = null;
        this.muteContainer = null;
        this.fullscreenButton = null;
        this.fullscreenContainer = null;
        this.backButton = null;
        
        // Audio tracking for complete tab management
        this.activeOscillators = new Set();
        this.activeUtterances = new Set();
        
        this.initializeAudio();
        this.createButtons();
        this.setupVisibilityHandling();
        this.setupFullscreenHandling();
        
        // Only setup rotation if not disabled
        if (!this.config.disableRotation) {
            this.setupResponsiveRotation();
        }
    }
    
    /**
     * Update button positioning (can be called after initialization)
     * @param {Object} options - Configuration options
     */
    updateButtonPosition(options = {}) {
        this.config = { ...this.config, ...options };
        this.updateButtonClasses();
    }
    
    updateButtonClasses() {
        const body = document.body;
        
        if (this.config.buttonsAtBottom) {
            body.classList.add('buttons-bottom');
        } else {
            body.classList.remove('buttons-bottom');
        }
        
        // Update back button URL if provided
        if (this.backButton && this.config.customBackUrl) {
            this.backButton.href = this.config.customBackUrl;
        }
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
    
    createButtons() {
        this.createMuteButton();
        this.createFullscreenButton();
        this.createBackButton();
        this.updateButtonClasses();
    }
    
    createMuteButton() {
        // Create mute button container
        const muteContainer = document.createElement('div');
        muteContainer.className = 'button-container audio-button-container';
        
        // Create button
        this.muteButton = document.createElement('button');
        this.muteButton.className = 'icon-button audio-button';
        
        // Set initial icon
        this.updateMuteButtonIcon();
        
        // Add event listeners
        this.muteButton.addEventListener('click', () => this.toggleAudio());
        this.muteButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleAudio();
        });
        
        muteContainer.appendChild(this.muteButton);
        document.body.appendChild(muteContainer);
        
        this.muteContainer = muteContainer;
    }
    
    createFullscreenButton() {
        // Create fullscreen button container
        const fullscreenContainer = document.createElement('div');
        fullscreenContainer.className = 'button-container fullscreen-button-container';
        
        // Create button
        this.fullscreenButton = document.createElement('button');
        this.fullscreenButton.className = 'icon-button fullscreen-button';
        
        // Set initial icon
        this.updateFullscreenButtonIcon();
        
        // Add event listeners
        this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
        this.fullscreenButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleFullscreen();
        });
        
        fullscreenContainer.appendChild(this.fullscreenButton);
        document.body.appendChild(fullscreenContainer);
        
        this.fullscreenContainer = fullscreenContainer;
    }
    
    createBackButton() {
        // Find existing back button or create new one
        let backButton = document.querySelector('.back-button');
        
        if (!backButton) {
            // Create back button if it doesn't exist
            backButton = document.createElement('a');
            backButton.className = 'back-button';
            backButton.href = this.config.customBackUrl;
            backButton.innerHTML = '<i class="fas fa-arrow-left"></i>Back to Games';
            document.body.appendChild(backButton);
        }
        
        this.backButton = backButton;
    }
    
    setupResponsiveRotation() {
        console.log('🔄 Setting up responsive rotation (can be disabled per game)');
        
        // Function to check and apply rotation based on viewport dimensions
        const checkAndApplyRotation = () => {
            const isPortrait = window.innerHeight > window.innerWidth;
            const body = document.body;
            
            if (isPortrait) {
                // Apply 90-degree counter-clockwise rotation
                body.style.transform = 'rotate(-90deg)';
                body.style.transformOrigin = 'center center';
                body.style.width = '100vh';
                body.style.height = '100vw';
                body.style.position = 'fixed';
                body.style.top = '50%';
                body.style.left = '50%';
                body.style.marginTop = '-50vw';
                body.style.marginLeft = '-50vh';
                
                console.log('🔄 Applied landscape rotation (portrait detected)');
            } else {
                // Remove rotation for landscape
                body.style.transform = '';
                body.style.transformOrigin = '';
                body.style.width = '';
                body.style.height = '';
                body.style.position = '';
                body.style.top = '';
                body.style.left = '';
                body.style.marginTop = '';
                body.style.marginLeft = '';
                
                console.log('📱 Removed rotation (landscape detected)');
            }
        };
        
        // Apply rotation on load and resize
        window.addEventListener('resize', checkAndApplyRotation);
        window.addEventListener('orientationchange', () => {
            // Delay to allow orientation change to complete
            setTimeout(checkAndApplyRotation, 100);
        });
        
        // Initial check
        setTimeout(checkAndApplyRotation, 100);
    }
    
    updateMuteButtonIcon() {
        if (this.muteButton) {
            this.muteButton.innerHTML = this.audioEnabled ? '🔊' : '🔇';
            this.muteButton.title = this.audioEnabled ? 'Mute Audio' : 'Unmute Audio';
            this.muteButton.setAttribute('aria-label', this.audioEnabled ? 'Mute Audio' : 'Unmute Audio');
        }
    }
    
    updateFullscreenButtonIcon() {
        if (this.fullscreenButton) {
            this.fullscreenButton.innerHTML = this.isFullscreen ? '🗗' : '🗖';
            this.fullscreenButton.title = this.isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen';
            this.fullscreenButton.setAttribute('aria-label', this.isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen');
        }
    }
    
    setupFullscreenHandling() {
        // Listen for fullscreen changes to update button state
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.updateFullscreenButtonIcon();
        });
        
        document.addEventListener('webkitfullscreenchange', () => {
            this.isFullscreen = !!document.webkitFullscreenElement;
            this.updateFullscreenButtonIcon();
        });
        
        document.addEventListener('mozfullscreenchange', () => {
            this.isFullscreen = !!document.mozFullScreenElement;
            this.updateFullscreenButtonIcon();
        });
        
        document.addEventListener('MSFullscreenChange', () => {
            this.isFullscreen = !!document.msFullscreenElement;
            this.updateFullscreenButtonIcon();
        });
    }
    
    toggleFullscreen() {
        try {
            if (!this.isFullscreen) {
                // Enter fullscreen
                const element = document.documentElement;
                
                if (element.requestFullscreen) {
                    element.requestFullscreen();
                } else if (element.webkitRequestFullscreen) {
                    element.webkitRequestFullscreen();
                } else if (element.mozRequestFullScreen) {
                    element.mozRequestFullScreen();
                } else if (element.msRequestFullscreen) {
                    element.msRequestFullscreen();
                }
                
                console.log('🖥️ Entering fullscreen mode');
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                
                console.log('🖥️ Exiting fullscreen mode');
            }
        } catch (error) {
            console.warn('Fullscreen toggle error:', error);
        }
    }
    
    setupVisibilityHandling() {
        // Enhanced tab visibility handling for all audio types
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            
            if (!this.isTabVisible) {
                console.log('🔇 Tab hidden - stopping all audio');
                // Tab is hidden - stop all audio completely
                this.stopAllAudio();
            } else {
                console.log('🔊 Tab visible - audio ready');
                // Tab is visible - audio is ready for new sounds
                // Don't automatically resume anything, just be ready
            }
        });
        
        // Also handle window focus/blur for additional browser compatibility
        window.addEventListener('blur', () => {
            if (this.isTabVisible) { // Only if visibility API didn't already handle it
                console.log('🔇 Window blur - stopping all audio');
                this.stopAllAudio();
                this.isTabVisible = false;
            }
        });
        
        window.addEventListener('focus', () => {
            if (!this.isTabVisible) { // Only if visibility API didn't already handle it
                console.log('🔊 Window focus - audio ready');
                this.isTabVisible = true;
            }
        });
    }
    
    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        this.updateMuteButtonIcon();
        
        // Stop any current audio when disabling
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
        console.log('🛑 Stopping all audio types');
        
        // Stop speech synthesis
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        // Stop all active oscillators (Web Audio API sounds)
        this.activeOscillators.forEach(oscillator => {
            try {
                if (oscillator && typeof oscillator.stop === 'function') {
                    oscillator.stop();
                }
            } catch (error) {
                // Oscillator might already be stopped
                console.warn('Error stopping oscillator:', error);
            }
        });
        this.activeOscillators.clear();
        
        // Clear any active utterance tracking
        this.activeUtterances.clear();
        
        // Suspend audio context to free resources
        if (this.audioContext && this.audioContext.state === 'running') {
            try {
                this.audioContext.suspend();
            } catch (error) {
                console.warn('Error suspending audio context:', error);
            }
        }
        
        console.log('✅ All audio stopped and cleaned up');
    }
    
    speakText(text, options = {}) {
        if (!this.audioEnabled || !this.isTabVisible) {
            console.log('🔇 Speech blocked: audioEnabled=' + this.audioEnabled + ', tabVisible=' + this.isTabVisible);
            return;
        }
        
        const defaults = {
            rate: 0.9,
            pitch: 1.3,
            volume: 0.8,
            preferMaleVoice: true
        };
        
        const settings = { ...defaults, ...options };
        
        try {
            if ('speechSynthesis' in window) {
                // Stop any existing speech first
                speechSynthesis.cancel();
                this.activeUtterances.clear();
                
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
                
                // Track utterance for cleanup
                this.activeUtterances.add(utterance);
                
                // Clean up when utterance ends
                utterance.onend = () => {
                    this.activeUtterances.delete(utterance);
                };
                
                utterance.onerror = () => {
                    this.activeUtterances.delete(utterance);
                };
                
                console.log('🗣️ Speaking:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.warn('Speech synthesis error:', error);
        }
    }
    
    playTone(frequency, duration = 0.5, type = 'sine', volume = 0.3) {
        if (!this.audioEnabled || !this.isTabVisible || !this.audioContext) {
            console.log('🔇 Tone blocked: audioEnabled=' + this.audioEnabled + ', tabVisible=' + this.isTabVisible + ', audioContext=' + !!this.audioContext);
            return;
        }
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            // Track oscillator for cleanup
            this.activeOscillators.add(oscillator);
            
            // Remove from tracking when it ends
            oscillator.onended = () => {
                this.activeOscillators.delete(oscillator);
            };
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
            console.log('🎵 Playing tone:', frequency + 'Hz');
        } catch (error) {
            console.warn('Audio tone error:', error);
        }
    }
    
    playCompletionSound() {
        if (!this.audioEnabled || !this.isTabVisible || !this.audioContext) return;
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
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
            
            // Track oscillator
            this.activeOscillators.add(oscillator);
            oscillator.onended = () => {
                this.activeOscillators.delete(oscillator);
            };
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
            
            console.log('🎉 Playing completion sound');
        } catch (error) {
            console.warn('Completion sound error:', error);
        }
    }
    
    playFailureSound() {
        if (!this.audioEnabled || !this.isTabVisible || !this.audioContext) return;
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Play descending tone
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            // Track oscillator
            this.activeOscillators.add(oscillator);
            oscillator.onended = () => {
                this.activeOscillators.delete(oscillator);
            };
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
            
            console.log('❌ Playing failure sound');
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
        
        // Remove UI elements
        if (this.muteContainer && this.muteContainer.parentNode) {
            this.muteContainer.parentNode.removeChild(this.muteContainer);
        }
        
        if (this.fullscreenContainer && this.fullscreenContainer.parentNode) {
            this.fullscreenContainer.parentNode.removeChild(this.fullscreenContainer);
        }
        
        if (this.backButton && this.backButton.parentNode) {
            this.backButton.parentNode.removeChild(this.backButton);
        }
        
        // Remove body classes
        document.body.classList.remove('buttons-bottom');
    }
}

// Create global instance with default settings (rotation enabled)
window.AudioSystem = new AudioSystem();
window.AudioSystem.loadAudioPreference();

// Expose method to override button positioning for specific games
window.AudioSystem.setBottomPosition = function(bottomPosition = true, backUrl = '../../index.html', disableRotation = false) {
    window.AudioSystem.updateButtonPosition({
        buttonsAtBottom: bottomPosition,
        customBackUrl: backUrl,
        disableRotation: disableRotation // NEW: Allow games to disable rotation
    });
};
