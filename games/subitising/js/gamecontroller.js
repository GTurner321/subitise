class GameController {
    constructor() {
        this.iconRenderer = new IconRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentDifficulty = CONFIG.DIFFICULTY.EASY;
        this.highestDifficultyReached = CONFIG.DIFFICULTY.EASY; // Track highest difficulty reached
        this.currentAnswer = 0;
        this.previousAnswer = 0; // Track previous question to avoid duplicates
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.questionsInLevel = 0;
        this.gameComplete = false;
        this.hasSeenHigherNumbers = false; // Track if user has seen higher numbers in current level
        this.buttonsDisabled = false; // Track if buttons are temporarily disabled
        this.questionsCompleted = 0; // Track total questions completed
        
        // Flashing intervals for visual feedback
        this.flashingInterval = null;
        this.flashingTimeout = null;
        
        // Audio functionality
        this.audioContext = null;
        this.audioEnabled = CONFIG.AUDIO_ENABLED || true;
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.inactivityDuration = 20000; // 20 seconds
        this.hintGiven = false; // Track if hint has been given for current question
        this.isTabVisible = true; // Track tab visibility
        
        // Keyboard two-digit handling for "10"
        this.keyboardBuffer = '';
        this.keyboardTimer = null;
        this.keyboardWaitDuration = 4000; // 4 seconds to wait for second digit
        
        // DOM elements
        this.numberButtons = document.querySelectorAll('.number-btn');
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // Mute button references
        this.muteButton = null;
        this.muteContainer = null;
        
        this.initializeEventListeners();
        this.initializeAudio();
        this.createMuteButton();
        this.setupVisibilityHandling();
        this.startNewQuestion();
    }

    startFlashing() {
        this.stopFlashing(); // Clear any existing interval
        
        const flashElements = () => {
            // Flash the game area to draw attention to counting
            const gameArea = document.querySelector('.game-area');
            if (gameArea) {
                gameArea.classList.add('area-flash');
                
                // Remove flash class after flash duration
                setTimeout(() => {
                    gameArea.classList.remove('area-flash');
                }, 1000);
            }
        };
        
        // Start flashing after 5 seconds
        this.flashingTimeout = setTimeout(() => {
            flashElements();
            
            // Set up interval to repeat every 5 seconds
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
        
        // Remove any existing flash classes
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.classList.remove('area-flash');
        }
    }

    createStarCelebration(buttonElement) {
        const buttonRect = buttonElement.getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;
        
        // Create container for stars with completion-effect class
        const starContainer = document.createElement('div');
        starContainer.className = 'star-celebration-container completion-effect';
        starContainer.style.position = 'fixed';
        starContainer.style.top = '0';
        starContainer.style.left = '0';
        starContainer.style.width = '100%';
        starContainer.style.height = '100%';
        starContainer.style.pointerEvents = 'none';
        starContainer.style.zIndex = '1000';
        
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
        
        // Remove stars after animation completes (same as trace game)
        setTimeout(() => {
            if (starContainer.parentNode) {
                starContainer.parentNode.removeChild(starContainer);
            }
        }, 2000);
    }

    createStar(x, y) {
        const star = document.createElement('div');
        star.className = 'completion-star';
        star.innerHTML = '✨'; // Use sparkle emoji like trace game
        star.style.position = 'fixed';
        star.style.left = (x - 15) + 'px'; // Center the star (30px / 2)
        star.style.top = (y - 15) + 'px';
        star.style.fontSize = '30px';
        star.style.color = '#FFD700';
        star.style.textAlign = 'center';
        star.style.pointerEvents = 'none';
        star.style.zIndex = '1000';
        
        return star;
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
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            
            if (!this.isTabVisible) {
                // Tab is hidden - stop all audio and clear timers
                this.clearInactivityTimer();
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

    clearKeyboardTimer() {
        if (this.keyboardTimer) {
            clearTimeout(this.keyboardTimer);
            this.keyboardTimer = null;
        }
        this.keyboardBuffer = '';
    }

    giveInactivityHint() {
        if (!this.audioEnabled || this.buttonsDisabled || this.gameComplete || !this.isTabVisible) return;
        
        // Mark that hint has been given for this question
        this.hintGiven = true;
        
        this.speakText('Try counting the number of pictures.');
        
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

        // Add keyboard event listener
        document.addEventListener('keydown', (e) => {
            if (this.buttonsDisabled || this.gameComplete) {
                return;
            }
            
            // Handle number keys 0-9
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                
                // Clear inactivity timer on user interaction
                this.clearInactivityTimer();
                this.startInactivityTimer();
                
                const digit = parseInt(e.key);
                this.handleKeyboardDigit(digit);
            }
        });
    }

    handleKeyboardDigit(digit) {
        // If we're waiting for a second digit and this is 0, check if buffer is "1"
        if (this.keyboardBuffer === '1' && digit === 0) {
            // Complete the "10" input
            this.clearKeyboardTimer();
            const button = Array.from(this.numberButtons).find(btn => 
                parseInt(btn.dataset.number) === 10
            );
            if (button) {
                this.handleNumberClick(10, button);
            }
            return;
        }
        
        // Clear any existing keyboard timer
        this.clearKeyboardTimer();
        
        // If digit is 1, check if it's a valid answer first
        if (digit === 1) {
            // If 1 is a valid answer, process it immediately
            if (this.isDigitValidAnswer(1)) {
                const button = Array.from(this.numberButtons).find(btn => 
                    parseInt(btn.dataset.number) === 1
                );
                if (button) {
                    this.handleNumberClick(1, button);
                }
                return;
            }
            
            // If 1 is NOT valid but 10 could be valid, wait for potential "0"
            if (this.isDigitValidAnswer(10)) {
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
        
        // Handle normal single digit input for all other digits
        const button = Array.from(this.numberButtons).find(btn => 
            parseInt(btn.dataset.number) === digit
        );
        if (button) {
            this.handleNumberClick(digit, button);
        }
    }

    // Check if a digit would be a valid answer
    isDigitValidAnswer(number) {
        return number === this.currentAnswer;
    }

    startNewGame() {
        // Start at highest reached difficulty, but reset other stats
        this.currentDifficulty = this.highestDifficultyReached;
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.questionsInLevel = 0;
        this.gameComplete = false;
        this.previousAnswer = 0;
        this.buttonsDisabled = false;
        this.hasSeenHigherNumbers = false;
        this.questionsCompleted = 0;
        
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        
        this.stopFlashing(); // Stop any flashing when starting new game
        
        this.rainbow.reset();
        this.bear.reset();
        this.iconRenderer.reset();
        this.modal.classList.add('hidden');
        this.startNewQuestion();
    }

    startNewQuestion() {
        if (this.gameComplete) {
            return;
        }

        // Reset hint tracking for new question
        this.hintGiven = false;

        // Update previous answer BEFORE generating new question
        this.previousAnswer = this.currentAnswer;

        // Check if we need to force higher numbers before allowing progression
        let forceHigherNumbers = false;
        if (this.correctStreak === 2 && !this.hasSeenHigherNumbers) {
            forceHigherNumbers = true;
        }

        // Generate random number of icons based on current difficulty
        let questionNumber;
        let attempts = 0;
        const maxAttempts = 50; // Increased attempts for better coverage
        
        do {
            if (forceHigherNumbers) {
                // Force higher numbers in current level
                if (this.currentDifficulty === CONFIG.DIFFICULTY.EASY) {
                    // Force 4 (highest in easy level)
                    questionNumber = 4;
                } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
                    // Force 5 or 6 (higher numbers in medium level)
                    questionNumber = Math.random() < 0.5 ? 5 : 6;
                } else if (this.currentDifficulty === CONFIG.DIFFICULTY.HARD) {
                    // Force 7-10 (higher numbers in hard level)
                    const higherNumbers = [7, 8, 9, 10];
                    questionNumber = higherNumbers[Math.floor(Math.random() * higherNumbers.length)];
                }
            } else if (this.currentDifficulty === CONFIG.DIFFICULTY.HARD) {
                // Use weighted probability for hard level
                questionNumber = this.getWeightedHardNumber();
            } else {
                // Use uniform distribution for easy and medium levels
                const min = this.currentDifficulty.min;
                const max = this.currentDifficulty.max;
                questionNumber = Math.floor(Math.random() * (max - min + 1)) + min;
            }
            attempts++;
            
        } while (
            (questionNumber === this.previousAnswer || // No consecutive duplicates
             (this.previousAnswer === 0 && questionNumber === 1) || // Don't start with 1
             (this.currentDifficulty === CONFIG.DIFFICULTY.HARD && 
              this.previousAnswer >= 7 && this.previousAnswer <= 10 && 
              questionNumber >= 7 && questionNumber <= 10)) && // In hard level, don't follow 7-10 with another 7-10
            attempts < maxAttempts
        );
        
        // Check if this question contains higher numbers for current level
        this.checkForHigherNumbers(questionNumber);
        
        // Set the new current answer
        this.currentAnswer = questionNumber;
        
        // Render the icons
        this.iconRenderer.renderIcons(this.currentAnswer);
        
        // Reset button states
        this.resetButtonStates();
        
        // Give starting instruction
        this.giveStartingInstruction();
        
        // Start visual flashing after question is set up
        this.startFlashing();
        
        // Start inactivity timer
        this.startInactivityTimer();
    }

    checkForHigherNumbers(questionNumber) {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.EASY && questionNumber === 4) {
            this.hasSeenHigherNumbers = true;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM && (questionNumber === 5 || questionNumber === 6)) {
            this.hasSeenHigherNumbers = true;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.HARD && questionNumber >= 7) {
            this.hasSeenHigherNumbers = true;
        }
    }

    getWeightedHardNumber() {
        // Weighted probabilities for hard level (3-10)
        const weights = [
            { number: 3, weight: 10 },  // 10%
            { number: 4, weight: 16 },  // 16%
            { number: 5, weight: 17 },  // 17%
            { number: 6, weight: 17 },  // 17%
            { number: 7, weight: 16 },  // 16%
            { number: 8, weight: 8 },   // 8%
            { number: 9, weight: 8 },   // 8%
            { number: 10, weight: 8 }   // 8%
        ];
        
        // Calculate total weight
        const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
        
        // Generate random number between 0 and total weight
        let random = Math.random() * totalWeight;
        
        // Find which number this random value corresponds to
        for (let item of weights) {
            random -= item.weight;
            if (random <= 0) {
                return item.number;
            }
        }
        
        // Fallback (shouldn't happen)
        return 5;
    }

    giveStartingInstruction() {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        setTimeout(() => {
            if (this.questionsCompleted === 0) {
                // First question
                this.speakText('Count the number of pictures you can see');
            } else {
                // Second and further questions
                this.speakText('Count the number of pictures.');
            }
        }, 500);
    }

    handleNumberClick(selectedNumber, buttonElement) {
        // Clear any pending keyboard timer since we're processing an answer
        this.clearKeyboardTimer();
        
        const isCorrect = selectedNumber === this.currentAnswer;
        
        if (isCorrect) {
            this.handleCorrectAnswer(buttonElement);
        } else {
            this.handleIncorrectAnswer(buttonElement);
        }
    }

    handleCorrectAnswer(buttonElement) {
        // Check if this was the first attempt BEFORE any button processing
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

        // Always add rainbow piece for any correct answer
        const pieces = this.rainbow.addPiece();
        
        // Give encouragement for correct answer
        if (this.audioEnabled && this.isTabVisible) {
            const encouragements = ['Well done!', 'Excellent!', 'Perfect!'];
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            setTimeout(() => {
                this.speakText(randomEncouragement);
            }, 400);
        }
        
        // Update streaks and difficulty progression based on first attempt performance
        if (wasFirstAttempt) {
            // First attempt correct - positive progression
            this.correctStreak++;
            this.wrongStreak = 0;
            this.questionsInLevel++;
            
            // Check for difficulty progression
            if (this.correctStreak >= CONFIG.QUESTIONS_PER_LEVEL) {
                this.progressDifficulty();
            }
        } else {
            // Multiple attempts needed - treat as "incorrect on first attempt"
            this.wrongStreak++;
            this.correctStreak = 0;
            this.questionsInLevel++;
            
            // Check if we need to drop difficulty
            if (this.wrongStreak >= CONFIG.CONSECUTIVE_WRONG_TO_DROP) {
                this.dropDifficulty();
            }
        }
        
        this.questionsCompleted++;
        
        // Check if game is complete
        if (this.rainbow.isComplete()) {
            setTimeout(() => {
                this.completeGame();
            }, CONFIG.NEXT_QUESTION_DELAY + 3000);
            return;
        }

        // Start next question after delay
        setTimeout(() => {
            this.startNewQuestion();
        }, CONFIG.NEXT_QUESTION_DELAY);
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
            
            // Remove any existing cross overlays
            const crossOverlay = btn.querySelector('.cross-overlay');
            if (crossOverlay) {
                crossOverlay.remove();
            }
        });
    }

    progressDifficulty() {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.EASY) {
            this.currentDifficulty = CONFIG.DIFFICULTY.MEDIUM;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
            this.currentDifficulty = CONFIG.DIFFICULTY.HARD;
        }
        
        // Update highest difficulty reached
        if (this.getDifficultyLevel(this.currentDifficulty) > this.getDifficultyLevel(this.highestDifficultyReached)) {
            this.highestDifficultyReached = this.currentDifficulty;
        }
        
        // Reset streak counter and higher numbers flag for new level
        this.correctStreak = 0;
        this.questionsInLevel = 0;
        this.hasSeenHigherNumbers = false;
    }

    // Helper method to get numeric difficulty level for comparison
    getDifficultyLevel(difficulty) {
        if (difficulty === CONFIG.DIFFICULTY.EASY) return 1;
        if (difficulty === CONFIG.DIFFICULTY.MEDIUM) return 2;
        if (difficulty === CONFIG.DIFFICULTY.HARD) return 3;
        return 1;
    }

    dropDifficulty() {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.HARD) {
            this.currentDifficulty = CONFIG.DIFFICULTY.MEDIUM;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
            this.currentDifficulty = CONFIG.DIFFICULTY.EASY;
        }
        
        // Reset streak counters and higher numbers flag
        this.wrongStreak = 0;
        this.correctStreak = 0;
        this.questionsInLevel = 0;
        this.hasSeenHigherNumbers = false;
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
        this.clearKeyboardTimer();
        this.modal.classList.remove('hidden');
        
        // Start bear celebration when modal opens
        this.bear.startCelebration();
        
        // Give completion audio message
        if (this.audioEnabled && this.isTabVisible) {
            setTimeout(() => {
                this.speakText('Well done! You have correctly counted the number of pictures in all of the questions. Play again or return to the home page.');
            }, 1000);
        }
    }

    destroy() {
        // Clean up audio and timers
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        this.stopFlashing();
        
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
        this.iconRenderer.reset();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.subitGame = new GameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.subitGame) {
        window.subitGame.destroy();
    }
});
