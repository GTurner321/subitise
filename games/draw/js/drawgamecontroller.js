class DrawGameController {
    constructor() {
        this.renderer = null;
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        this.currentNumberIndex = 0;
        this.currentNumber = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        
        this.numbersSequence = [...DRAW_CONFIG.NUMBERS_SEQUENCE];
        
        this.audioContext = null;
        this.audioEnabled = DRAW_CONFIG.AUDIO_ENABLED;
        
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.numberWordDisplay = document.getElementById('numberWord');
        
        // Mute button references
        this.muteButton = null;
        this.muteContainer = null;
        
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        this.initializeGame();
    }

    async initializeGame() {
        window.addEventListener('resize', this.handleResize);
        await this.initializeAudio();
        this.initializeRainbow();
        this.createMuteButton();
        
        this.renderer = new DrawNumberRenderer();
        if (!this.renderer.initialize('referenceNumber', 'drawingCanvas')) return;
        
        await this.waitForDependencies();
        this.setupEventListeners();
        this.startNewNumber();
    }

    initializeRainbow() {
        const gameWidth = window.innerWidth;
        const rainbowWidth = gameWidth * 0.75;
        
        this.rainbow.initializeArcs = function() {
            this.container.innerHTML = '';
            for (let i = 0; i < this.maxPieces; i++) {
                const arc = document.createElement('div');
                arc.className = 'rainbow-arc';
                arc.id = `arc-${i}`;
                const baseRadius = rainbowWidth / 2;
                const radius = baseRadius - (i * this.arcWidth);
                arc.style.width = radius * 2 + 'px';
                arc.style.height = radius + 'px';
                arc.style.borderTopWidth = this.arcWidth + 'px';
                arc.style.borderTopColor = this.colors[i];
                arc.style.borderRadius = radius + 'px ' + radius + 'px 0 0';
                arc.style.position = 'absolute';
                arc.style.bottom = '0';
                arc.style.left = '50%';
                arc.style.transform = 'translateX(-50%)';
                arc.style.opacity = '0';
                arc.style.transition = 'opacity 0.5s ease-in-out';
                arc.style.pointerEvents = 'none';
                this.container.appendChild(arc);
            }
        };
        this.rainbow.initializeArcs();
    }

    async waitForDependencies() {
        return new Promise((resolve) => {
            const check = () => {
                if (typeof DRAW_CONFIG !== 'undefined' && this.renderer) {
                    resolve();
                } else {
                    requestAnimationFrame(check);
                }
            };
            setTimeout(check, 100);
        });
    }

    async initializeAudio() {
        if (!this.audioEnabled) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            this.audioEnabled = false;
        }
    }

    createMuteButton() {
        // Create mute button container
        const muteContainer = document.createElement('div');
        muteContainer.style.position = 'fixed';
        muteContainer.style.top = '20px';
        muteContainer.style.right = '20px';
        muteContainer.style.zIndex = '1000';
        muteContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        muteContainer.style.borderRadius = '50%';
        muteContainer.style.width = '60px';
        muteContainer.style.height = '60px';
        muteContainer.style.display = 'flex';
        muteContainer.style.alignItems = 'center';
        muteContainer.style.justifyContent = 'center';
        muteContainer.style.cursor = 'pointer';
        muteContainer.style.transition = 'all 0.3s ease';
        muteContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        
        // Create button
        this.muteButton = document.createElement('button');
        this.muteButton.style.background = 'none';
        this.muteButton.style.border = 'none';
        this.muteButton.style.color = 'white';
        this.muteButton.style.fontSize = '24px';
        this.muteButton.style.cursor = 'pointer';
        this.muteButton.style.width = '100%';
        this.muteButton.style.height = '100%';
        this.muteButton.style.display = 'flex';
        this.muteButton.style.alignItems = 'center';
        this.muteButton.style.justifyContent = 'center';
        
        // Set initial icon
        this.updateMuteButtonIcon();
        
        // Add event listeners
        this.muteButton.addEventListener('click', () => this.toggleAudio());
        this.muteButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleAudio();
        });
        
        // Hover effects
        muteContainer.addEventListener('mouseenter', () => {
            muteContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            muteContainer.style.transform = 'scale(1.1)';
        });
        
        muteContainer.addEventListener('mouseleave', () => {
            muteContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
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
        }
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        this.updateMuteButtonIcon();
        
        // Stop any current speech
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        // Provide feedback
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Audio enabled');
            }, 100);
        }
    }

    setupEventListeners() {
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.moveToNextNumber());
        }
        
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (DRAW_CONFIG.DEBUG_MODE) {
            document.addEventListener('keydown', (e) => {
                if (e.key === ' ') { e.preventDefault(); this.handleNumberCompletion(); }
                if (e.key === 'r') { e.preventDefault(); this.restartCurrentNumber(); }
                if (e.key >= '0' && e.key <= '9') { e.preventDefault(); this.skipToNumber(parseInt(e.key)); }
                if (e.key === 'c') { e.preventDefault(); this.clearDrawing(); }
            });
        }
    }

    handleResize() {
        if (this.renderer) {
            this.renderer.updateSVGDimensions();
        }
        this.initializeRainbow();
        if (this.renderer && this.currentNumber !== null) {
            this.renderer.renderNumber(this.currentNumber);
        }
    }

    startNewGame() {
        this.currentNumberIndex = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        
        this.rainbow.reset();
        this.bear.reset();
        this.renderer.reset();
        
        if (this.modal) this.modal.classList.add('hidden');
        if (this.nextBtn) this.nextBtn.classList.add('hidden');
        this.updateNumberWordDisplay('');
        this.startNewNumber();
    }

    startNewNumber() {
        if (this.currentNumberIndex >= this.numbersSequence.length) {
            this.completeGame();
            return;
        }
        
        this.currentNumber = this.numbersSequence[this.currentNumberIndex];
        this.updateNumberWordDisplay(DRAW_CONFIG.NUMBER_WORDS[this.currentNumber]);
        
        if (!this.renderer.renderNumber(this.currentNumber)) return;
        
        if (this.nextBtn) this.nextBtn.classList.add('hidden');
        
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText(`Draw the number ${this.currentNumber}`);
            }, 500);
        }
    }

    restartCurrentNumber() {
        this.renderer.clearDrawing();
        this.updateNumberWordDisplay(DRAW_CONFIG.NUMBER_WORDS[this.currentNumber]);
        
        if (this.nextBtn) this.nextBtn.classList.add('hidden');
        
        if (this.audioEnabled) {
            this.speakText(`Try drawing the number ${this.currentNumber} again`);
        }
    }

    clearDrawing() {
        if (this.renderer) {
            this.renderer.clearDrawing();
        }
        if (this.nextBtn) this.nextBtn.classList.add('hidden');
    }

    handleNumberCompletion() {
        if (this.isProcessingCompletion) return;
        this.isProcessingCompletion = true;
        
        this.rainbow.addPiece();
        
        if (this.audioEnabled) {
            this.speakText('Great job! Well done!');
        }
        
        // Show next button
        if (this.nextBtn) {
            this.nextBtn.classList.remove('hidden');
        }
        
        this.playCompletionSound();
    }

    moveToNextNumber() {
        this.numbersCompleted++;
        this.currentNumberIndex++;
        this.isProcessingCompletion = false;
        
        if (this.rainbow.isComplete()) {
            setTimeout(() => this.completeGame(), 1000);
            return;
        }
        
        this.startNewNumber();
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
        
        if (this.modal) this.modal.classList.remove('hidden');
        this.bear.startCelebration();
        
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Fantastic! You drew all the numbers perfectly!');
            }, 1000);
        }
    }

    speakText(text) {
        if (!this.audioEnabled) return;
        
        try {
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1.3;
                utterance.volume = 0.8;
                
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
                utterance.pitch = 1.3;
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            // Silent failure
        }
    }

    playCompletionSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (error) {
            // Silent failure
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            if ('speechSynthesis' in window) speechSynthesis.pause();
        } else {
            if ('speechSynthesis' in window) speechSynthesis.resume();
        }
    }

    getCurrentNumber() {
        return this.currentNumber;
    }

    getCurrentProgress() {
        return {
            currentNumber: this.currentNumber,
            currentIndex: this.currentNumberIndex,
            totalNumbers: this.numbersSequence.length,
            completed: this.numbersCompleted,
            progress: this.numbersCompleted / DRAW_CONFIG.NUMBERS_TO_COMPLETE
        };
    }

    isGameComplete() {
        return this.gameComplete;
    }

    skipToNumber(number) {
        if (!DRAW_CONFIG.DEBUG_MODE) return;
        const index = this.numbersSequence.indexOf(number);
        if (index !== -1) {
            this.currentNumberIndex = index;
            this.startNewNumber();
        }
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer.reset();
        }
        
        this.rainbow.reset();
        this.bear.reset();
        
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        if (this.audioContext) this.audioContext.close();
        
        // Clean up mute button
        if (this.muteContainer && this.muteContainer.parentNode) {
            this.muteContainer.parentNode.removeChild(this.muteContainer);
        }
    }
}

// Game initialization and cleanup
document.addEventListener('DOMContentLoaded', () => {
    // Handle page visibility changes (tab switching, minimizing, etc.)
    document.addEventListener('visibilitychange', () => {
        if (window.drawGame) {
            window.drawGame.handleVisibilityChange();
        }
    });
    
    // Initialize the draw game
    window.drawGame = new DrawGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.drawGame) {
        window.drawGame.destroy();
    }
});
