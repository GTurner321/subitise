class TraceGameController {
    constructor() {
        // Core components
        this.renderer = null;
        this.pathManager = null;
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        this.balloonGame = null; // Will be initialized after renderer
        
        // Game state
        this.currentNumberIndex = 0;
        this.currentNumber = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        this.playingBalloonGame = false; // New state for balloon mini-game
        
        // Audio
        this.audioContext = null;
        this.audioEnabled = CONFIG.AUDIO_ENABLED;
        this.currentVoiceGender = 'male'; // Start with male voice
        
        // DOM elements
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.numberWordDisplay = document.getElementById('numberWord');
        this.traceContainer = document.getElementById('traceContainer');
        
        // Game progression
        this.numbersSequence = [...CONFIG.NUMBERS_SEQUENCE];
        
        this.initializeGame();
    }

    async initializeGame() {
        console.log('Initializing Trace Game Controller...');
        
        // Find DOM elements
        this.findDOMElements();
        
        // Initialize audio
        await this.initializeAudio();
        
        // Create renderer
        this.renderer = new TraceNumberRenderer();
        if (!this.renderer.initialize('traceContainer')) {
            console.error('Failed to initialize renderer');
            return;
        }
        
        // Create path manager
        this.pathManager = new TracePathManager(this.renderer.svg, this.renderer);
        
        // Create balloon game
        this.balloonGame = new BalloonGame(this.renderer.svg, this.renderer);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start the first number
        this.startNewNumber();
        
        console.log('Game initialized successfully');
    }

    findDOMElements() {
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.numberWordDisplay = document.getElementById('numberWord');
        this.traceContainer = document.getElementById('traceContainer');
        
        if (!this.traceContainer) {
            console.error('Trace container not found');
        }
    }

    async initializeAudio() {
        if (!this.audioEnabled) return;
        
        try {
            // Initialize Web Audio Context for speech synthesis
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized');
        } catch (error) {
            console.warn('Audio context initialization failed:', error);
            this.audioEnabled = false;
        }
    }

    setupEventListeners() {
        // Play again button
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => {
                this.startNewGame();
            });
        }
        
        // Set up renderer callbacks
        this.setupRendererCallbacks();
        
        // Keyboard support for testing
        document.addEventListener('keydown', (e) => {
            if (CONFIG.DEBUG_MODE) {
                if (e.key === ' ') {
                    // Spacebar to skip to next number (debug)
                    e.preventDefault();
                    this.completeCurrentNumber();
                }
                if (e.key === 'r' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    // R key to restart current number
                    e.preventDefault();
                    this.startCurrentNumberOver();
                }
                // Number keys 0-9 to jump directly to that number
                if (e.key >= '0' && e.key <= '9' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    e.preventDefault();
                    const targetNumber = parseInt(e.key);
                    this.skipToNumber(targetNumber);
                }
                if (e.key === 'd') {
                    // D key to show debug coordinate points
                    e.preventDefault();
                    this.pathManager.showCoordinatePoints();
                }
            }
        });
    }

    setupRendererCallbacks() {
        // Override renderer's completeNumber method to notify controller
        const originalCompleteNumber = this.renderer.completeNumber.bind(this.renderer);
        this.renderer.completeNumber = () => {
            originalCompleteNumber();
            this.handleNumberCompletion();
        };
        
        // Override renderer's completeStroke to handle multi-stroke progression
        const originalCompleteStroke = this.renderer.completeStroke.bind(this.renderer);
        this.renderer.completeStroke = (strokeIndex) => {
            originalCompleteStroke(strokeIndex);
            this.handleStrokeCompletion(strokeIndex);
        };
    }

    startNewGame() {
        console.log('Starting new game');
        
        // Reset game state
        this.currentNumberIndex = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        this.playingBalloonGame = false;
        this.currentVoiceGender = 'male'; // Reset to male voice
        
        // Reset components
        this.rainbow.reset();
        this.bear.reset();
        this.renderer.reset();
        this.pathManager.reset();
        this.balloonGame.reset();
        
        // Hide modal
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
        
        // Clear number word display
        this.updateNumberWordDisplay('');
        
        // Start first number
        this.startNewNumber();
    }

    startNewNumber() {
        if (this.currentNumberIndex >= this.numbersSequence.length) {
            this.completeGame();
            return;
        }
        
        this.currentNumber = this.numbersSequence[this.currentNumberIndex];
        console.log(`Starting number: ${this.currentNumber} (${this.currentNumberIndex + 1}/${this.numbersSequence.length})`);
        console.log(`Using ${this.currentVoiceGender} voice for this number`);
        
        // Clear any existing number word
        this.updateNumberWordDisplay('');
        
        // Render the number
        if (!this.renderer.renderNumber(this.currentNumber)) {
            console.error('Failed to render number:', this.currentNumber);
            return;
        }
        
        // Start path manager for first stroke
        this.pathManager.startNewStroke(0);
        
        // Announce the number using current voice gender
        if (this.audioEnabled) {
            this.speakText(`Trace the number ${this.currentNumber}`, this.currentVoiceGender);
        }
    }

    startCurrentNumberOver() {
        console.log('Restarting current number:', this.currentNumber);
        
        // Reset renderer and path manager for current number
        this.renderer.renderNumber(this.currentNumber);
        this.pathManager.startNewStroke(0);
        
        // Clear number word display
        this.updateNumberWordDisplay('');
    }

    handleStrokeCompletion(strokeIndex) {
        console.log(`Stroke ${strokeIndex} completed for number ${this.currentNumber}`);
        
        // Check if there are more strokes for this number
        const totalStrokes = this.renderer.getStrokeCount();
        
        if (strokeIndex + 1 < totalStrokes) {
            // Move to next stroke
            this.pathManager.moveToNextStroke();
        }
        // If no more strokes, handleNumberCompletion will be called by renderer
    }

    handleNumberCompletion() {
        if (this.isProcessingCompletion) return;
        this.isProcessingCompletion = true;
        
        console.log(`Number ${this.currentNumber} completed!`);
        
        // Clean up path manager
        this.pathManager.cleanup();
        
        // Add rainbow piece - this is the key reward system
        const pieces = this.rainbow.addPiece();
        console.log(`Rainbow pieces: ${pieces}/${CONFIG.RAINBOW_PIECES}`);
        
        // Instead of immediately showing number word and moving to next number,
        // start the balloon mini-game
        this.startBalloonMiniGame();
    }

    startBalloonMiniGame() {
        console.log('Starting balloon mini-game for number:', this.currentNumber);
        
        this.playingBalloonGame = true;
        
        // Clear number word display during balloon game
        this.updateNumberWordDisplay('');
        
        // Start balloon game with completion callback
        this.balloonGame.startGame(this.currentNumber, () => {
            this.onBalloonGameComplete();
        });
    }

    onBalloonGameComplete() {
        console.log('Balloon mini-game completed for number:', this.currentNumber);
        
        this.playingBalloonGame = false;
        
        // Update game progress
        this.numbersCompleted++;
        
        // Check if rainbow is complete (game finished)
        if (this.rainbow.isComplete()) {
            console.log('Rainbow completed! Starting end game sequence...');
            setTimeout(() => {
                this.completeGame();
            }, 1000); // Shorter delay since balloon game provided the interaction
            return;
        }
        
        // Switch voice gender for NEXT number (after current number is fully complete)
        this.switchVoiceGender();
        
        // Move to next number after delay
        setTimeout(() => {
            this.moveToNextNumber();
        }, 1000); // Shorter delay since balloon game was the main interaction
    }

    switchVoiceGender() {
        this.currentVoiceGender = this.currentVoiceGender === 'male' ? 'female' : 'male';
        console.log(`Switched to ${this.currentVoiceGender} voice for next number`);
    }

    moveToNextNumber() {
        this.currentNumberIndex++;
        this.isProcessingCompletion = false;
        this.startNewNumber();
    }

    showNumberWord() {
        const numberWord = CONFIG.NUMBER_WORDS[this.currentNumber];
        if (numberWord) {
            this.updateNumberWordDisplay(numberWord);
            
            // Speak the number word using SAME voice gender as the initial instruction
            if (this.audioEnabled) {
                setTimeout(() => {
                    this.speakText(numberWord, this.currentVoiceGender);
                }, 500);
            }
        }
    }

    updateNumberWordDisplay(text) {
        if (this.numberWordDisplay) {
            this.numberWordDisplay.textContent = text;
            
            if (text) {
                this.numberWordDisplay.classList.add('visible');
            } else {
                this.numberWordDisplay.classList.remove('visible');
            }
        }
    }

    completeGame() {
        if (this.gameComplete) return;
        
        this.gameComplete = true;
        console.log('Game completed! All numbers traced and rainbow complete.');
        
        // Clean up current tracing
        this.pathManager.cleanup();
        
        // The rainbow should already be in celebration mode from the final addPiece() call
        // Now show the completion modal
        if (this.modal) {
            this.modal.classList.remove('hidden');
        }
        
        // Start bear celebration when modal opens - this matches your addition game pattern
        this.bear.startCelebration();
        
        // Speak completion message using current voice gender
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Excellent work! You traced all the numbers!', this.currentVoiceGender);
            }, 1000);
        }
    }

    // Enhanced audio methods with voice gender support
    speakText(text, preferredGender = null) {
        if (!this.audioEnabled) return;
        
        try {
            // Use Web Speech API for text-to-speech
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.8; // Slightly slower for children
                utterance.pitch = 1.1; // Slightly higher pitch
                utterance.volume = 0.8;
                
                // Get available voices
                const voices = speechSynthesis.getVoices();
                let selectedVoice = null;
                
                // Try to find a voice matching the preferred gender
                if (preferredGender === 'male') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('male') ||
                        voice.name.toLowerCase().includes('david') ||
                        voice.name.toLowerCase().includes('daniel') ||
                        voice.name.toLowerCase().includes('alex') ||
                        (voice.gender && voice.gender.toLowerCase() === 'male')
                    );
                } else if (preferredGender === 'female') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('female') ||
                        voice.name.toLowerCase().includes('samantha') ||
                        voice.name.toLowerCase().includes('victoria') ||
                        voice.name.toLowerCase().includes('karen') ||
                        (voice.gender && voice.gender.toLowerCase() === 'female')
                    );
                }
                
                // Fallback to any child-friendly voice if gender-specific not found
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('female') ||
                        voice.gender === 'female'
                    );
                }
                
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                    console.log(`Using voice: ${selectedVoice.name} for ${preferredGender || 'default'} speech`);
                }
                
                speechSynthesis.speak(utterance);
                console.log(`Speaking (${preferredGender || 'default'}):`, text);
            }
        } catch (error) {
            console.warn('Speech synthesis failed:', error);
        }
    }

    playCompletionSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            // Create a simple success tone
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Completion sound failed:', error);
        }
    }

    // Utility methods
    getCurrentNumber() {
        return this.currentNumber;
    }

    getCurrentProgress() {
        return {
            currentNumber: this.currentNumber,
            currentIndex: this.currentNumberIndex,
            totalNumbers: this.numbersSequence.length,
            completed: this.numbersCompleted,
            progress: this.numbersCompleted / CONFIG.NUMBERS_TO_COMPLETE
        };
    }

    isGameComplete() {
        return this.gameComplete;
    }

    // Debug methods
    skipToNumber(number) {
        if (!CONFIG.DEBUG_MODE) return;
        
        const index = this.numbersSequence.indexOf(number);
        if (index !== -1) {
            this.currentNumberIndex = index;
            this.startNewNumber();
        }
    }

    completeCurrentNumber() {
        if (!CONFIG.DEBUG_MODE) return;
        
        // Force complete current number for testing
        this.renderer.completeNumber();
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        console.log('Audio', this.audioEnabled ? 'enabled' : 'disabled');
    }

    // Handle page visibility changes
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause any ongoing speech when page becomes hidden
            if ('speechSynthesis' in window) {
                speechSynthesis.pause();
            }
        } else {
            // Resume speech when page becomes visible
            if ('speechSynthesis' in window) {
                speechSynthesis.resume();
            }
        }
    }

    // Cleanup
    destroy() {
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Clean up components
        if (this.pathManager) {
            this.pathManager.cleanup();
        }
        
        if (this.balloonGame) {
            this.balloonGame.cleanup();
        }
        
        if (this.renderer) {
            this.renderer.reset();
        }
        
        this.rainbow.reset();
        this.bear.reset();
        
        // Cancel any ongoing speech
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Handle page visibility for audio management
    document.addEventListener('visibilitychange', () => {
        if (window.traceGame) {
            window.traceGame.handleVisibilityChange();
        }
    });
    
    // Initialize the game
    window.traceGame = new TraceGameController();
    
    console.log('Trace game loaded and ready!');
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.traceGame) {
        window.traceGame.destroy();
    }
});
