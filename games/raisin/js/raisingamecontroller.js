class RaisinGameController {
    constructor() {
        this.raisinRenderer = new RaisinRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentQuestion = 0;
        this.currentAnswer = 0;
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.questionsCompleted = 0;
        
        // Hidden difficulty levels
        this.currentLevel = 1;
        this.levelNames = ['Level 1', 'Level 2', 'Level 3'];
        
        // Flashing intervals for visual feedback
        this.flashingInterval = null;
        this.flashingTimeout = null;
        
        // Audio functionality
        this.audioContext = null;
        this.audioEnabled = CONFIG.AUDIO_ENABLED || true;
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.inactivityDuration = 20000; // 20 seconds
        this.hintGiven = false;
        this.isTabVisible = true;
        
        // DOM elements
        this.numberButtons = document.querySelectorAll('.number-btn');
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // Mute button references
        this.muteButton = null;
        this.muteContainer = null;
        
        // Guinea pig sounds
        this.guineaPigSoundInterval = null;
        
        this.initializeEventListeners();
        this.initializeAudio();
        this.createMuteButton();
        this.setupVisibilityHandling();
        this.startNewQuestion();
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
        muteContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background-color: rgba(0, 0, 0, 0.7);
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        // Create button
        this.muteButton = document.createElement('button');
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
        `;
        
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
    
    setupVisibilityHandling() {
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            
            if (!this.isTabVisible) {
                // Tab is hidden - stop all audio and clear timers
                this.clearInactivityTimer();
                this.stopGuineaPigSounds();
                if ('speechSynthesis' in window) {
                    speechSynthesis.cancel();
                }
            } else {
                // Tab is visible again - restart inactivity timer if game is active
                if (!this.gameComplete && !this.buttonsDisabled) {
                    this.startInactivityTimer();
                }
            }
        });
    }
    
    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        this.updateMuteButtonIcon();
        
        // Stop any current speech and sounds
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        this.stopGuineaPigSounds();
        
        // Provide feedback
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Audio enabled');
            }, 100);
        }
    }
    
    speakText(text) {
        if (!this.audioEnabled) return;
        
        try {
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.volume = 0.8;
                utterance.pitch = 1.3;
                
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
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            // Silent failure
        }
    }
    
    playGuineaPigSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Create a faster squeaky guinea pig sound (3x faster)
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.033);
            oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.067);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.083);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.083);
        } catch (error) {
            // Silent failure
        }
    }
    
    startGuineaPigSounds() {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        this.stopGuineaPigSounds(); // Clear any existing interval
        
        // Play first sound immediately
        this.playGuineaPigSound();
        
        // Continue playing sounds at intervals (3x faster)
        this.guineaPigSoundInterval = setInterval(() => {
            this.playGuineaPigSound();
        }, 200); // Play every 200ms (was 600ms)
    }
    
    stopGuineaPigSounds() {
        if (this.guineaPigSoundInterval) {
            clearInterval(this.guineaPigSoundInterval);
            this.guineaPigSoundInterval = null;
        }
    }
    
    startFlashing() {
        // No flashing prompts needed for raisin game
        return;
    }
    
    stopFlashing() {
        // No flashing prompts needed for raisin game
        return;
    }
    
    startInactivityTimer() {
        // Only start timer if tab is visible and hint hasn't been given
        if (!this.isTabVisible || this.hintGiven) {
            return;
        }
        
        this.clearInactivityTimer();
        this.inactivityTimer = setTimeout(() => {
            this.giveInactivityHint();
        }, this.inactivityDuration);
    }
    
    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }
    
    giveInactivityHint() {
        if (!this.audioEnabled || this.buttonsDisabled || this.gameComplete || !this.isTabVisible) return;
        
        // Mark that hint has been given for this question
        this.hintGiven = true;
        
        this.speakText('Try counting how many more will make 10.');
        
        // Don't restart the timer - hint is only given once per question
    }
    
    initializeEventListeners() {
        // Number button clicks
        this.numberButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Ignore clicks if buttons are disabled
                if (this.buttonsDisabled) {
                    return;
                }
                
                // Clear inactivity timer on user interaction
                this.clearInactivityTimer();
                this.startInactivityTimer();
                
                const selectedNumber = parseInt(e.target.dataset.number);
                this.handleNumberClick(selectedNumber, e.target);
            });
        });

        // Play again button
        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });
    }
    
    createStarCelebration(buttonElement) {
        const buttonRect = buttonElement.getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;
        
        // Create container for stars with completion-effect class
        const starContainer = document.createElement('div');
        starContainer.className = 'star-celebration-container completion-effect';
        starContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Use the exact same star positions as trace game (scaled for button size)
        const starPositions = [
            { x: centerX - 60, y: centerY - 60 },  // top-left
            { x: centerX + 60, y: centerY - 60 },  // top-right
            { x: centerX + 72, y: centerY },       // right
            { x: centerX + 60, y: centerY + 60 },  // bottom-right
            { x: centerX - 60, y: centerY + 60 },  // bottom-left
            { x: centerX - 72, y: centerY }        // left
        ];
        
        starPositions.forEach((pos, index) => {
            const star = this.createStar(pos.x, pos.y);
            star.style.animationDelay = `${index * 0.1}s`;
            starContainer.appendChild(star);
        });
        
        document.body.appendChild(starContainer);
        
        // Remove stars after animation completes
        setTimeout(() => {
            if (starContainer.parentNode) {
                starContainer.parentNode.removeChild(starContainer);
            }
        }, 2000);
    }
    
    createStar(x, y) {
        const star = document.createElement('div');
        star.className = 'completion-star';
        star.innerHTML = '✨';
        star.style.cssText = `
            position: fixed;
            left: ${x - 15}px;
            top: ${y - 15}px;
            font-size: 30px;
            color: #FFD700;
            text-align: center;
            pointer-events: none;
            z-index: 1000;
        `;
        
        return star;
    }
    
    async startNewQuestion() {
        if (this.gameComplete || this.currentQuestion >= CONFIG.TOTAL_QUESTIONS) {
            return;
        }
        
        // Reset hint tracking for new question
        this.hintGiven = false;
        this.buttonsDisabled = false;
        
        // Generate question based on current difficulty level
        this.currentAnswer = this.generateAnswerForLevel();
        
        console.log(`Question ${this.currentQuestion + 1}: Level ${this.currentLevel}, Answer: ${this.currentAnswer}`);
        
        // Reset button states
        this.resetButtonStates();
        
        // Render all 10 raisins with staggered appearance
        await this.raisinRenderer.renderRaisinsStaggered();
        
        // Select exactly currentAnswer raisins to eat
        const raisinsToEat = this.selectRaisinsToEat();
        
        // Give starting instruction (different for first question vs subsequent)
        this.giveStartingInstruction();
        
        // Start the guinea pig sequence
        await this.runGuineaPigSequence(raisinsToEat);
        
        // Start visual flashing and inactivity timer after guinea pigs finish
        this.startFlashing();
        this.startInactivityTimer();
    }
    
    generateAnswerForLevel() {
        const level = CONFIG.DIFFICULTY_LEVELS[`LEVEL_${this.currentLevel}`];
        const possibleAnswers = level.possibleRaisinsToEat;
        return possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];
    }
    
    selectRaisinsToEat() {
        const totalRaisins = CONFIG.TOTAL_RAISINS;
        const raisinsToEat = [];
        
        // Randomly select exactly currentAnswer raisins to eat
        while (raisinsToEat.length < this.currentAnswer) {
            const randomIndex = Math.floor(Math.random() * totalRaisins);
            if (!raisinsToEat.includes(randomIndex)) {
                raisinsToEat.push(randomIndex);
            }
        }
        
        return raisinsToEat;
    }
    
    giveStartingInstruction() {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        setTimeout(() => {
            if (this.currentQuestion === 0) {
                // First question - full instruction
                this.speakText('Watch the hungry guinea pig');
            } else {
                // Subsequent questions - shorter instruction
                this.speakText('How many of the 10 raisins does the guinea pig eat this time?');
            }
        }, 500);
    }
    
    async runGuineaPigSequence(raisinsToEat) {
        this.buttonsDisabled = true;
        
        // Show guinea pig 3 and raisins for 4 seconds
        this.raisinRenderer.showGuineaPig3();
        
        // Wait for initial display period
        await this.sleep(CONFIG.GUINEA_PIG_3_INITIAL_DISPLAY);
        
        // For first question only, give extended instruction
        if (this.currentQuestion === 0) {
            await this.sleep(CONFIG.INITIAL_INSTRUCTION_DELAY);
            
            if (this.audioEnabled && this.isTabVisible) {
                this.speakText('There are 10 raisins. The hungry guinea pig is going to eat some of them.');
            }
            
            // Wait for instruction to finish (approximately 5 seconds)
            await this.sleep(5000);
        }
        
        // Fade out guinea pig 3 completely before moving guinea pigs appear
        await this.raisinRenderer.fadeOutGuineaPig3();
        
        // Start guinea pig sounds
        this.startGuineaPigSounds();
        
        // Guinea pig 2 moves left to right (only after GP3 is completely gone)
        await this.raisinRenderer.moveGuineaPig2(raisinsToEat);
        
        // Short pause
        await this.sleep(CONFIG.GUINEA_PIG_PAUSE_DURATION);
        
        // Guinea pig 1 moves right to left (only after GP2 is completely gone)
        await this.raisinRenderer.moveGuineaPig1(raisinsToEat);
        
        // Stop guinea pig sounds
        this.stopGuineaPigSounds();
        
        // Fade in guinea pig 3 again (only after GP1 is completely gone)
        await this.raisinRenderer.fadeInGuineaPig3();
        
        // Give question instruction
        setTimeout(() => {
            if (this.audioEnabled && this.isTabVisible) {
                this.speakText('How many raisins did the guinea pig eat?');
            }
        }, 500);
        
        this.buttonsDisabled = false;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    handleNumberClick(selectedNumber, buttonElement) {
        const isCorrect = selectedNumber === this.currentAnswer;
        
        if (isCorrect) {
            this.handleCorrectAnswer(buttonElement);
        } else {
            this.handleIncorrectAnswer(buttonElement);
        }
    }
    
    handleCorrectAnswer(buttonElement) {
        // Check if this was the first attempt
        const wasFirstAttempt = !this.hasAttemptedAnswer();
        
        // Flash green on correct answer
        buttonElement.classList.add('correct');
        setTimeout(() => {
            buttonElement.classList.remove('correct');
        }, CONFIG.FLASH_DURATION);

        // Create star celebration around the button
        this.createStarCelebration(buttonElement);

        // Play completion sound
        if (this.audioEnabled) {
            this.playCompletionSound();
        }

        // Add rainbow piece
        this.rainbow.addPiece();
        
        // Give encouragement for correct answer
        if (this.audioEnabled && this.isTabVisible) {
            const encouragements = ['Well done!', 'Excellent!', 'Perfect!', 'Great counting!'];
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            setTimeout(() => {
                this.speakText(randomEncouragement);
            }, 400);
        }
        
        // Update difficulty level based on first attempt performance
        if (wasFirstAttempt) {
            this.updateDifficultyOnSuccess();
        } else {
            this.updateDifficultyOnFailure();
        }
        
        this.currentQuestion++;
        this.questionsCompleted++;
        
        // Stop flashing and timers
        this.stopFlashing();
        this.clearInactivityTimer();
        
        // Check if game is complete
        if (this.currentQuestion >= CONFIG.TOTAL_QUESTIONS) {
            setTimeout(() => {
                this.completeGame();
            }, CONFIG.NEXT_QUESTION_DELAY + 1000);
            return;
        }

        // Start next question after delay
        setTimeout(() => {
            this.startNewQuestion();
        }, CONFIG.NEXT_QUESTION_DELAY);
    }
    
    updateDifficultyOnSuccess() {
        if (this.currentLevel === 1) {
            this.currentLevel = 2; // Level 1 correct on first attempt → Level 2
        } else if (this.currentLevel === 3) {
            this.currentLevel = 2; // Level 3 correct on first attempt → Level 2
        }
        // Level 2 stays at Level 2 when correct
    }
    
    updateDifficultyOnFailure() {
        if (this.currentLevel === 2) {
            this.currentLevel = 3; // Level 2 not correct on first attempt → Level 3
        } else if (this.currentLevel === 3) {
            this.currentLevel = 1; // Level 3 not correct on first attempt → Level 1
        }
        // Level 1 stays at Level 1 when not correct on first attempt
    }
    
    hasAttemptedAnswer() {
        return Array.from(this.numberButtons).some(btn => 
            btn.dataset.attempted === 'true'
        );
    }
    
    handleIncorrectAnswer(buttonElement) {
        // Clear inactivity timer and give immediate hint
        this.clearInactivityTimer();
        
        // Play failure sound
        if (this.audioEnabled) {
            this.playFailureSound();
        }
        
        // Disable buttons during error handling
        this.buttonsDisabled = true;
        
        // Stop flashing during error handling
        this.stopFlashing();
        
        // Flash red on the clicked button
        buttonElement.classList.add('incorrect');
        setTimeout(() => {
            buttonElement.classList.remove('incorrect');
        }, CONFIG.FLASH_DURATION);

        // Add crimson cross overlay to the incorrect button
        const crossOverlay = document.createElement('div');
        crossOverlay.className = 'cross-overlay';
        buttonElement.appendChild(crossOverlay);

        // Mark that an attempt was made
        buttonElement.dataset.attempted = 'true';
        
        // Fade out all other buttons
        this.numberButtons.forEach(btn => {
            if (btn !== buttonElement) {
                btn.style.transition = 'opacity 700ms ease-in-out';
                btn.style.opacity = '0.1';
            }
        });

        // After fade out completes, wait, then fade back in
        setTimeout(() => {
            setTimeout(() => {
                this.numberButtons.forEach(btn => {
                    if (btn !== buttonElement) {
                        btn.style.transition = 'opacity 700ms ease-in-out';
                        btn.style.opacity = '1';
                    }
                });
                
                // Start fading out the cross
                if (crossOverlay && crossOverlay.parentNode) {
                    crossOverlay.style.transition = 'opacity 700ms ease-out';
                    crossOverlay.style.opacity = '0';
                }
                
                // Clean up after fade in completes
                setTimeout(() => {
                    // Remove the cross overlay
                    if (crossOverlay && crossOverlay.parentNode) {
                        crossOverlay.parentNode.removeChild(crossOverlay);
                    }
                    
                    // Clean up transition styles
                    this.numberButtons.forEach(btn => {
                        btn.style.transition = '';
                    });
                }, 700);
            }, 700);
            
            // Re-enable buttons and restart flashing and inactivity timer
            setTimeout(() => {
                this.buttonsDisabled = false;
                this.startFlashing();
                this.startInactivityTimer();
            }, 1400);
        }, 700);
    }
    
    resetButtonStates() {
        this.buttonsDisabled = false;
        this.numberButtons.forEach(btn => {
            btn.dataset.attempted = 'false';
            btn.classList.remove('correct', 'incorrect');
            btn.style.opacity = '1';
            btn.style.transition = '';
            
            // Remove any existing cross overlays
            const crossOverlay = btn.querySelector('.cross-overlay');
            if (crossOverlay) {
                crossOverlay.remove();
            }
        });
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

    playFailureSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            // Silent failure
        }
    }
    
    completeGame() {
        this.gameComplete = true;
        this.clearInactivityTimer();
        this.stopFlashing();
        this.stopGuineaPigSounds();
        this.modal.classList.remove('hidden');
        
        // Start bear celebration when modal opens
        this.bear.startCelebration();
        
        // Give completion audio message
        if (this.audioEnabled && this.isTabVisible) {
            setTimeout(() => {
                this.speakText('Well done! You have correctly counted how many raisins the guinea pig ate in all of the questions. Play again or return to the home page.');
            }, 1000);
        }
    }
    
    startNewGame() {
        this.currentQuestion = 0;
        this.currentAnswer = 0;
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.questionsCompleted = 0;
        this.currentLevel = 1; // Reset to Level 1
        
        this.clearInactivityTimer();
        this.stopFlashing();
        this.stopGuineaPigSounds();
        
        this.rainbow.reset();
        this.bear.reset();
        this.raisinRenderer.reset();
        this.modal.classList.add('hidden');
        this.startNewQuestion();
    }
    
    destroy() {
        // Clean up audio and timers
        this.clearInactivityTimer();
        this.stopFlashing();
        this.stopGuineaPigSounds();
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // Clean up mute button
        if (this.muteContainer && this.muteContainer.parentNode) {
            this.muteContainer.parentNode.removeChild(this.muteContainer);
        }
        
        // Clean up other resources
        this.rainbow.reset();
        this.bear.reset();
        this.raisinRenderer.reset();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.raisinGame = new RaisinGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.raisinGame) {
        window.raisinGame.destroy();
    }
});
