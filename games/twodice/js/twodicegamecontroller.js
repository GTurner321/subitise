class TwoDiceGameController {
    constructor() {
        this.diceRenderer = new DiceRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Initialize dice tester
        this.diceTester = new DiceTransitionTester(this.diceRenderer);
        
        // Game state
        this.questionsCompleted = 0;
        this.gameComplete = false;
        // Remove the usedCombinations tracking for now
        
        // Current question state
        this.currentLeftValue = 0;
        this.currentRightValue = 0;
        this.currentTotal = 0;
        this.buttonsDisabled = false;
        
        // Track which boxes are filled
        this.leftFilled = false;
        this.rightFilled = false;
        this.totalFilled = false;
        
        // Audio functionality
        this.audioContext = null;
        this.audioEnabled = CONFIG.AUDIO_ENABLED || true;
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.inactivityDuration = 20000; // 20 seconds
        this.hintGiven = false;
        this.isTabVisible = true;
        
        // Keyboard handling for two-digit numbers
        this.keyboardBuffer = '';
        this.keyboardTimer = null;
        this.keyboardWaitDuration = 4000; // 4 seconds
        
        // Flashing intervals
        this.flashingInterval = null;
        this.flashingTimeout = null;
        
        // DOM elements
        this.numberButtons = document.querySelectorAll('.number-btn');
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.leftInputBox = document.getElementById('leftInputBox');
        this.rightInputBox = document.getElementById('rightInputBox');
        this.sumRow = document.getElementById('sumRow');
        this.totalInputBox = document.getElementById('totalInputBox');
        this.checkMark = document.getElementById('checkMark');
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        
        // Mute button references
        this.muteButton = null;
        this.muteContainer = null;
        
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

    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            
            if (!this.isTabVisible) {
                this.clearInactivityTimer();
                if ('speechSynthesis' in window) {
                    speechSynthesis.cancel();
                }
            } else {
                if (!this.gameComplete && !this.buttonsDisabled) {
                    this.startInactivityTimer();
                }
            }
        });
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        this.updateMuteButtonIcon();
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Sound on');
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

    startInactivityTimer() {
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

    clearKeyboardTimer() {
        if (this.keyboardTimer) {
            clearTimeout(this.keyboardTimer);
            this.keyboardTimer = null;
        }
        this.keyboardBuffer = '';
    }

    giveInactivityHint() {
        if (!this.audioEnabled || this.buttonsDisabled || this.gameComplete || !this.isTabVisible) return;
        
        this.hintGiven = true;
        
        let hintText = '';
        if (!this.leftFilled) {
            hintText = 'Look at the number on the left dice';
        } else if (!this.rightFilled) {
            hintText = 'Look at the number on the right dice';
        } else if (!this.totalFilled) {
            hintText = 'Add the two dice numbers together';
        }
        
        if (hintText) {
            this.speakText(hintText);
        }
    }

    initializeEventListeners() {
        this.numberButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.buttonsDisabled) {
                    return;
                }
                
                this.clearInactivityTimer();
                this.startInactivityTimer();
                
                const selectedNumber = parseInt(e.target.dataset.number);
                this.handleNumberClick(selectedNumber, e.target);
            });
        });

        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });

        // Add keyboard event listener
        document.addEventListener('keydown', (e) => {
            if (this.buttonsDisabled || this.gameComplete) {
                return;
            }
            
            // Handle number keys 0-9
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                
                this.clearInactivityTimer();
                this.startInactivityTimer();
                
                const digit = parseInt(e.key);
                this.handleKeyboardDigit(digit);
            }
        });
    }

    handleKeyboardDigit(digit) {
        // Handle keyboard input for numbers 1-12
        if (this.keyboardBuffer === '1' && (digit === 0 || digit === 1 || digit === 2)) {
            // Complete two-digit numbers: 10, 11, 12
            this.clearKeyboardTimer();
            const number = parseInt('1' + digit);
            if (number >= 10 && number <= 12) {
                const button = Array.from(this.numberButtons).find(btn => 
                    parseInt(btn.dataset.number) === number
                );
                if (button) {
                    this.handleNumberClick(number, button);
                }
            }
            return;
        }
        
        this.clearKeyboardTimer();
        
        if (digit === 1) {
            // Check if 1 alone is valid first
            if (this.isDigitValidAnswer(1)) {
                const button = Array.from(this.numberButtons).find(btn => 
                    parseInt(btn.dataset.number) === 1
                );
                if (button) {
                    this.handleNumberClick(1, button);
                }
                return;
            }
            
            // If 1 is not valid but 10, 11, or 12 could be valid, wait for potential second digit
            if (this.isDigitValidAnswer(10) || this.isDigitValidAnswer(11) || this.isDigitValidAnswer(12)) {
                this.keyboardBuffer = '1';
                this.keyboardTimer = setTimeout(() => {
                    // Timeout - treat the "1" as an incorrect answer
                    this.clearKeyboardTimer();
                    const button = Array.from(this.numberButtons).find(btn => 
                        parseInt(btn.dataset.number) === 1
                    );
                    if (button) {
                        this.handleNumberClick(1, button);
                    }
                }, this.keyboardWaitDuration);
                return;
            }
        }
        
        // Handle single digits 1-9
        if (digit >= 1 && digit <= 9) {
            const button = Array.from(this.numberButtons).find(btn => 
                parseInt(btn.dataset.number) === digit
            );
            if (button) {
                this.handleNumberClick(digit, button);
            }
        }
        
        // Handle 0 (only valid as part of 10)
        if (digit === 0) {
            // 0 alone is not valid in our game (no 0 on dice), so ignore
            return;
        }
    }

    isDigitValidAnswer(number) {
        if (!this.leftFilled && number === this.currentLeftValue) {
            return true;
        }
        if (!this.rightFilled && number === this.currentRightValue) {
            return true;
        }
        if (!this.totalFilled && number === this.currentTotal) {
            return true;
        }
        return false;
    }

    startNewGame() {
        this.questionsCompleted = 0;
        this.gameComplete = false;
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        this.resetBoxState();
        
        this.rainbow.reset();
        this.bear.reset();
        this.diceRenderer.reset();
        this.modal.classList.add('hidden');
        this.hideAllInputBoxes();
        this.startNewQuestion();
    }

    resetBoxState() {
        this.leftFilled = false;
        this.rightFilled = false;
        this.totalFilled = false;
        this.stopFlashing();
    }

    startFlashing() {
        this.stopFlashing();
        
        const flashElements = () => {
            if (!this.leftFilled) {
                this.leftSide.classList.add('area-flash');
                this.leftInputBox.classList.add('box-flash');
            } else if (!this.rightFilled) {
                this.rightSide.classList.add('area-flash');
                this.rightInputBox.classList.add('box-flash');
            } else if (!this.totalFilled) {
                this.leftSide.classList.add('area-flash');
                this.rightSide.classList.add('area-flash');
                this.totalInputBox.classList.add('box-flash');
            }
            
            setTimeout(() => {
                this.leftSide.classList.remove('area-flash');
                this.rightSide.classList.remove('area-flash');
                this.leftInputBox.classList.remove('box-flash');
                this.rightInputBox.classList.remove('box-flash');
                this.totalInputBox.classList.remove('box-flash');
            }, 1000);
        };
        
        this.flashingTimeout = setTimeout(() => {
            flashElements();
            this.flashingInterval = setInterval(flashElements, 5000);
        }, 5000);
    }

    stopFlashing() {
        if (this.flashingInterval) {
            clearInterval(this.flashingInterval);
            this.flashingInterval = null;
        }
        
        if (this.flashingTimeout) {
            clearTimeout(this.flashingTimeout);
            this.flashingTimeout = null;
        }
        
        this.leftSide.classList.remove('area-flash');
        this.rightSide.classList.remove('area-flash');
        this.leftInputBox.classList.remove('box-flash');
        this.rightInputBox.classList.remove('box-flash');
        this.totalInputBox.classList.remove('box-flash');
    }

    async startNewQuestion() {
        if (this.gameComplete) {
            return;
        }

        this.resetBoxState();
        this.hideAllInputBoxes();
        this.hintGiven = false;

        console.log(`Starting question ${this.questionsCompleted + 1}`);
        
        // Reset button states
        this.resetButtonStates();
        
        // Give starting instruction
        this.giveStartingInstruction();
        
        // Roll the dice and wait for them to finish
        this.buttonsDisabled = true; // Disable buttons during dice roll
        
        try {
            // Roll dice - this will return the final values based on where they land
            const result = await this.diceRenderer.rollDice();
            
            // Update our target values based on what the dice actually show
            this.currentLeftValue = result.left;
            this.currentRightValue = result.right;
            this.currentTotal = result.total;
            
            console.log(`Dice finished rolling - Left: ${this.currentLeftValue}, Right: ${this.currentRightValue}, Total: ${this.currentTotal}`);
            
            // Dice have finished rolling, now show input boxes and enable buttons
            this.buttonsDisabled = false;
            this.showInputBoxes();
            this.startInactivityTimer();
        } catch (error) {
            console.error('Error rolling dice:', error);
            // Fallback: enable buttons anyway with default values
            this.currentLeftValue = Math.floor(Math.random() * 6) + 1;
            this.currentRightValue = Math.floor(Math.random() * 6) + 1;
            this.currentTotal = this.currentLeftValue + this.currentRightValue;
            
            this.buttonsDisabled = false;
            this.showInputBoxes();
            this.startInactivityTimer();
        }
    }

    giveStartingInstruction() {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        setTimeout(() => {
            if (this.questionsCompleted === 0) {
                this.speakText('Watch the dice roll and complete the three numbers in the addition sum.');
            } else if (this.questionsCompleted === 1) {
                this.speakText('Try again and complete the sum');
            } else {
                this.speakText('Complete the sum');
            }
        }, 500);
    }

    hideAllInputBoxes() {
        this.checkMark.classList.remove('visible');
        
        this.leftInputBox.textContent = '';
        this.rightInputBox.textContent = '';
        this.totalInputBox.textContent = '';
        
        this.leftInputBox.classList.remove('flashing', 'filled');
        this.rightInputBox.classList.remove('flashing', 'filled');
        this.totalInputBox.classList.remove('flashing', 'filled');
    }

    showInputBoxes() {
        if (!this.leftFilled) {
            this.leftInputBox.classList.add('flashing');
        } else if (!this.rightFilled) {
            this.rightInputBox.classList.add('flashing');
        } else if (!this.totalFilled) {
            this.totalInputBox.classList.add('flashing');
        }
        this.startFlashing();
    }

    handleNumberClick(selectedNumber, buttonElement) {
        this.clearKeyboardTimer();
        
        let correctAnswer = false;
        
        if (!this.leftFilled && selectedNumber === this.currentLeftValue) {
            this.fillBox('left', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.rightFilled && selectedNumber === this.currentRightValue) {
            this.fillBox('right', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.totalFilled && selectedNumber === this.currentTotal) {
            this.fillBox('total', selectedNumber, buttonElement);
            correctAnswer = true;
        }
        
        if (correctAnswer) {
            this.checkQuestionCompletion();
        } else {
            this.handleIncorrectAnswer(buttonElement);
        }
    }

    fillBox(boxType, selectedNumber, buttonElement) {
        // Flash green on correct answer
        buttonElement.classList.add('correct');
        setTimeout(() => {
            buttonElement.classList.remove('correct');
        }, CONFIG.FLASH_DURATION);

        // Play completion sound
        if (this.audioEnabled) {
            this.playCompletionSound();
        }

        // Create celebration stars
        this.createCelebrationStars(buttonElement);

        // Fill the appropriate box
        switch (boxType) {
            case 'left':
                this.leftInputBox.textContent = selectedNumber;
                this.leftInputBox.classList.remove('flashing');
                this.leftInputBox.classList.add('filled');
                this.leftFilled = true;
                break;
            case 'right':
                this.rightInputBox.textContent = selectedNumber;
                this.rightInputBox.classList.remove('flashing');
                this.rightInputBox.classList.add('filled');
                this.rightFilled = true;
                break;
            case 'total':
                this.totalInputBox.textContent = selectedNumber;
                this.totalInputBox.classList.remove('flashing');
                this.totalInputBox.classList.add('filled');
                this.totalFilled = true;
                break;
        }

        this.updateFlashingBoxes();
    }

    updateFlashingBoxes() {
        this.leftInputBox.classList.remove('flashing');
        this.rightInputBox.classList.remove('flashing');
        this.totalInputBox.classList.remove('flashing');
        
        if (!this.leftFilled) {
            this.leftInputBox.classList.add('flashing');
        } else if (!this.rightFilled) {
            this.rightInputBox.classList.add('flashing');
        } else if (!this.totalFilled) {
            this.totalInputBox.classList.add('flashing');
        }
        
        this.startFlashing();
    }

    checkQuestionCompletion() {
        if (this.leftFilled && this.rightFilled && this.totalFilled) {
            this.clearInactivityTimer();
            this.stopFlashing();
            
            this.checkMark.classList.add('visible');
            
            // Add rainbow piece
            const pieces = this.rainbow.addPiece();
            console.log(`Rainbow pieces: ${pieces}`);
            
            // Give completion feedback
            if (this.audioEnabled) {
                const encouragements = ['Well done!', 'Excellent!', 'Perfect!'];
                const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                this.speakText(randomEncouragement);
            }
            
            this.questionsCompleted++;
            
            // Check if game is complete
            if (this.rainbow.isComplete()) {
                setTimeout(() => {
                    this.completeGame();
                }, 3000);
                return;
            }

            // Start next question after delay
            setTimeout(() => {
                this.fadeOutDice();
            }, CONFIG.NEXT_QUESTION_DELAY);
        }
    }

    handleIncorrectAnswer(buttonElement) {
        this.clearInactivityTimer();
        
        if (this.audioEnabled) {
            this.playFailureSound();
        }
        
        if (this.audioEnabled && this.isTabVisible) {
            setTimeout(() => {
                this.speakText('Try again');
            }, 800);
        }
        
        this.buttonsDisabled = true;
        this.stopFlashing();
        
        buttonElement.classList.add('incorrect');
        setTimeout(() => {
            buttonElement.classList.remove('incorrect');
        }, CONFIG.FLASH_DURATION);

        // Add cross overlay
        const crossOverlay = document.createElement('div');
        crossOverlay.className = 'cross-overlay';
        buttonElement.appendChild(crossOverlay);

        buttonElement.dataset.attempted = 'true';
        
        // Fade out other buttons
        this.numberButtons.forEach(btn => {
            if (btn !== buttonElement) {
                btn.style.transition = 'opacity 700ms ease-in-out';
                btn.style.opacity = '0.1';
            }
        });

        setTimeout(() => {
            setTimeout(() => {
                this.numberButtons.forEach(btn => {
                    if (btn !== buttonElement) {
                        btn.style.transition = 'opacity 700ms ease-in-out';
                        btn.style.opacity = '1';
                    }
                });
                
                if (crossOverlay && crossOverlay.parentNode) {
                    crossOverlay.style.transition = 'opacity 700ms ease-out';
                    crossOverlay.style.opacity = '0';
                }
                
                setTimeout(() => {
                    if (crossOverlay && crossOverlay.parentNode) {
                        crossOverlay.parentNode.removeChild(crossOverlay);
                    }
                    
                    this.numberButtons.forEach(btn => {
                        btn.style.transition = '';
                    });
                }, 700);
            }, 700);
            
            setTimeout(() => {
                this.buttonsDisabled = false;
                this.startFlashing();
                this.startInactivityTimer();
            }, 1400);
        }, 700);
    }

    async fadeOutDice() {
        console.log('Starting dice transition');
        
        // Fade out current dice first
        await this.diceRenderer.fadeOutCurrentDice();
        
        // Then start new question (which will fade in new dice)
        this.startNewQuestion();
    }

    hasAttemptedAnswer() {
        return Array.from(this.numberButtons).some(btn => 
            btn.dataset.attempted === 'true'
        );
    }

    resetButtonStates() {
        this.buttonsDisabled = false;
        this.numberButtons.forEach(btn => {
            btn.dataset.attempted = 'false';
            btn.classList.remove('correct', 'incorrect');
            btn.style.opacity = '1';
            btn.style.transition = '';
            
            const crossOverlay = btn.querySelector('.cross-overlay');
            if (crossOverlay) {
                crossOverlay.remove();
            }
        });
    }

    completeGame() {
        this.gameComplete = true;
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        this.stopFlashing();
        this.modal.classList.remove('hidden');
        
        this.bear.startCelebration();
        
        if (this.audioEnabled && this.isTabVisible) {
            setTimeout(() => {
                this.speakText('Well done! You have completed all ten sums! Try again or return to the home page.');
            }, 1000);
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

    createCelebrationStars(buttonElement) {
        const buttonRect = buttonElement.getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;
        
        const starCount = 5;
        const radius = 60;
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.innerHTML = '⭐';
            star.className = 'completion-star';
            star.style.fontSize = '20px';
            
            const angle = (i / starCount) * 2 * Math.PI;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            star.style.left = x + 'px';
            star.style.top = y + 'px';
            star.style.animationDelay = (i * 0.1) + 's';
            
            document.body.appendChild(star);
            
            setTimeout(() => {
                if (star.parentNode) {
                    star.parentNode.removeChild(star);
                }
            }, 1500 + (i * 100));
        }
    }

 destroy() {
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        if (this.muteContainer && this.muteContainer.parentNode) {
            this.muteContainer.parentNode.removeChild(this.muteContainer);
        }
        
        this.rainbow.reset();
        this.bear.reset();
        this.diceRenderer.reset();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.twoDiceGame = new TwoDiceGameController();
});

// Clean up resources when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.twoDiceGame) {
        window.twoDiceGame.destroy();
    }
});
