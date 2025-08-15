/**
 * Universal Audio System
 * Handles audio functionality and responsive UI buttons across all games
 * Enhanced with complete tab visibility audio management
 */
class AudioSystem {
    constructor(options = {}) {
        this.audioContext = null;
        this.audioEnabled = true;
        this.isTabVisible = true;
        
        // UI configuration
        this.config = {
            buttonsAtBottom: options.buttonsAtBottom || false,
            customBackUrl: options.backUrl || '../../index.html',
            ...options
        };
        
        // UI button references
        this.muteButton = null;
        this.muteContainer = null;
        this.backButton = null;
        
        // Audio tracking for complete tab management
        this.activeOscillators = new Set();
        this.activeUtterances = new Set();
        
        this.initializeAudio();
        this.createButtons();
        this.setupVisibilityHandling();
    }
    
    /**
     * Update button positioning (can be called after initialization)
     * @param {Object} options - Configuration options
     */
    updateButtonPosition(options = {}) {
        this.config = { ...this.config, ...options };
        this.updateButtonStyles();
    }
    
    updateButtonStyles() {
        const topPos = this.config.buttonsAtBottom ? 'auto' : '2vh';
        const bottomPos = this.config.buttonsAtBottom ? '2vh' : 'auto';
        
        // Update mute button position
        if (this.muteContainer) {
            this.muteContainer.style.top = topPos;
            this.muteContainer.style.bottom = bottomPos;
            this.muteContainer.style.right = '2vh';
        }
        
        // Update back button position
        if (this.backButton) {
            this.backButton.style.top = topPos;
            this.backButton.style.bottom = bottomPos;
            this.backButton.style.left = '2vh';
            
            // Update back URL if provided
            if (this.config.customBackUrl) {
                this.backButton.href = this.config.customBackUrl;
            }
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
        this.createBackButton();
        this.setupResponsiveHandling();
    }
    
    createMuteButton() {
        // Create mute button container
        const muteContainer = document.createElement('div');
        muteContainer.className = 'audio-button-container';
        
        const topPos = this.config.buttonsAtBottom ? 'auto' : '2vh';
        const bottomPos = this.config.buttonsAtBottom ? '2vh' : 'auto';
        
        muteContainer.style.cssText = `
            position: fixed;
            top: ${topPos};
            bottom: ${bottomPos};
            right: 2vh;
            z-index: 1000;
            background-color: rgba(64, 64, 64, 0.9);
            border-radius: 50%;
            width: 8vh;
            height: 8vh;
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
            font-size: 3vh;
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
        
        const topPos = this.config.buttonsAtBottom ? 'auto' : '2vh';
        const bottomPos = this.config.buttonsAtBottom ? '2vh' : 'auto';
        
        // Apply responsive styling
        backButton.style.cssText = `
            position: fixed;
            top: ${topPos};
            bottom: ${bottomPos};
            left: 2vh;
            background: rgba(64, 64, 64, 0.9);
            color: white;
            text-decoration: none;
            padding: 0 3vh;
            height: 8vh;
            border-radius: 4vh;
            font-weight: bold;
            font-size: 2.4vh;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 1003;
            border: none;
            outline: none;
            touch-action: manipulation;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            pointer-events: auto;
            cursor: pointer;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 1vh;
        `;
        
        // Style the icon
        const icon = backButton.querySelector('i');
        if (icon) {
            icon.style.fontSize = '2vh';
        }
        
        // Add hover effects
        backButton.addEventListener('mouseenter', () => {
            backButton.style.background = 'rgba(64, 64, 64, 1)';
            backButton.style.transform = 'translateY(-2px)';
            backButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
        });
        
        backButton.addEventListener('mouseleave', () => {
            backButton.style.background = 'rgba(64, 64, 64, 0.9)';
            backButton.style.transform = 'translateY(0)';
            backButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        });
        
        this.backButton = backButton;
    }
    
    setupResponsiveHandling() {
        // Handle window resize for button sizing
        const handleResize = () => {
            const topPos = this.config.buttonsAtBottom ? 'auto' : '2vh';
            const bottomPos = this.config.buttonsAtBottom ? '2vh' : 'auto';
            
            // Update mute button
            if (this.muteContainer && this.muteButton) {
                this.muteContainer.style.width = '8vh';
                this.muteContainer.style.height = '8vh';
                this.muteContainer.style.top = topPos;
                this.muteContainer.style.bottom = bottomPos;
                this.muteContainer.style.right = '2vh';
                this.muteButton.style.fontSize = '3vh';
            }
            
            // Update back button
            if (this.backButton) {
                this.backButton.style.height = '8vh';
                this.backButton.style.borderRadius = '4vh';
                this.backButton.style.fontSize = '2.4vh';
                this.backButton.style.padding = '0 3vh';
                this.backButton.style.top = topPos;
                this.backButton.style.bottom = bottomPos;
                this.backButton.style.left = '2vh';
                this.backButton.style.gap = '1vh';
                
                const icon = this.backButton.querySelector('i');
                if (icon) {
                    icon.style.fontSize = '2vh';
                }
            }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Initial resize call
        setTimeout(handleResize, 100);
    }
    
    updateMuteButtonIcon() {
        if (this.muteButton) {
            this.muteButton.innerHTML = this.audioEnabled ? '🔊' : '🔇';
            this.muteButton.title = this.audioEnabled ? 'Mute Audio' : 'Unmute Audio';
            this.muteButton.setAttribute('aria-label', this.audioEnabled ? 'Mute Audio' : 'Unmute Audio');
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
        
        if (this.backButton && this.backButton.parentNode) {
            this.backButton.parentNode.removeChild(this.backButton);
        }
    }
}

// Create global instance with default top positioning
window.AudioSystem = new AudioSystem();
window.AudioSystem.loadAudioPreference();

// Expose method to override button positioning for specific games
window.AudioSystem.setBottomPosition = function(bottomPosition = true, backUrl = '../../index.html') {
    window.AudioSystem.updateButtonPosition({
        buttonsAtBottom: bottomPosition,
        customBackUrl: backUrl
    });
};
