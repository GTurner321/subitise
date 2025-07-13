class AddGameController {
    constructor() {
        this.iconRenderer = new AddIconRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Simplified level-based progression
        this.currentLevel = 1;
        this.highestLevelReached = 1;
        this.sumsCompleted = 0;
        this.gameComplete = false;
        
        // Track used sums for level 6 avoidance
        this.usedSumsInSession = new Set(); // Stores canonical addition strings
        
        // Audio functionality
        this.audioContext = null;
        this.audioEnabled = CONFIG.AUDIO_ENABLED || true;
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.inactivityDuration = 20000; // 20 seconds (changed from 10 seconds)
        this.hintGiven = false; // Track if hint has been given for current question
        this.isTabVisible = true; // Track tab visibility
        
        // Keyboard two-digit handling for "10"
        this.keyboardBuffer = '';
        this.keyboardTimer = null;
        this.keyboardWaitDuration = 4000; // 4 seconds to wait for second digit
        
        // Game state
        this.currentLeftCount = 0;
        this.currentRightCount = 0;
        this.currentAnswer = 0;
        this.buttonsDisabled = false;
        
        // Simplified box state - track which boxes are filled
        this.leftFilled = false;
        this.rightFilled = false;
        this.totalFilled = false;
        
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
        
        // Level definitions
        this.levels = {
            1: [[1,1], [1,2], [1,3], [2,2], [2,3], [2,1], [3,1], [3,2]],
            2: [[3,3], [1,4], [1,5], [2,4], [4,1], [5,1], [4,2]],
            3: [[3,4], [2,5], [1,6], [1,7], [4,3], [5,2], [6,1], [7,1]],
            4: [[1,9], [4,4], [2,6], [2,7], [3,5], [1,8], [9,1], [6,2], [7,2], [5,3], [8,1]],
            5: [[3,6], [4,5], [4,6], [3,7], [5,5], [2,8], [6,3], [5,4], [6,4], [7,3], [8,2]],
            6: [[2,3], [3,2], [3,3], [1,4], [1,5], [2,4], [3,4], [2,5], [1,6], [1,7], [1,8], [1,9], [4,4], [2,6], [2,7], [3,5], [2,8], [3,6], [4,5], [4,6], [3,7], [5,5], [4,1], [5,1], [4,2], [4,3], [5,2], [6,1], [7,1], [8,1], [9,1], [6,2], [7,2], [5,3], [8,2], [6,3], [5,4], [6,4], [7,3]]
        };
        
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
                this.speakText('Sound on'); // Changed from "Audio enabled"
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
        
        // Determine which hint to give based on current flashing box
        let hintText = '';
        if (!this.leftFilled) {
            hintText = 'Count the number of pictures on the left side'; // Changed from "Try counting..."
        } else if (!this.rightFilled) {
            hintText = 'Count the number of pictures on the right side'; // Changed from "Try counting..."
        } else if (!this.totalFilled) {
            hintText = 'Count the number of pictures in total'; // Changed from "Try counting..."
        }
        
        if (hintText) {
            this.speakText(hintText);
        }
        
        // Don't restart the timer - hint is only given once per question
    }

    initializeEventListeners() {
        this.numberButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
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

    // Check if a digit would be a valid answer for any current empty box
    isDigitValidAnswer(number) {
        if (!this.leftFilled && number === this.currentLeftCount) {
            return true;
        }
        if (!this.rightFilled && number === this.currentRightCount) {
            return true;
        }
        if (!this.totalFilled && number === this.currentAnswer) {
            return true;
        }
        return false;
    }

    startNewGame() {
        // Start at highest reached level, but clear used sums cache
        this.currentLevel = this.highestLevelReached;
        this.sumsCompleted = 0;
        this.gameComplete = false;
        this.usedSumsInSession.clear();
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        this.resetBoxState();
        
        this.rainbow.reset();
        this.bear.reset();
        this.iconRenderer.reset();
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
        this.stopFlashing(); // Clear any existing interval
        
        const flashElements = () => {
            // Flash only the first uncompleted box from left to right
            if (!this.leftFilled) {
                this.leftSide.classList.add('area-flash');
                this.leftInputBox.classList.add('box-flash');
            } else if (!this.rightFilled) {
                this.rightSide.classList.add('area-flash');
                this.rightInputBox.classList.add('box-flash');
            } else if (!this.totalFilled) {
                // Flash both areas when total is the only remaining box
                this.leftSide.classList.add('area-flash');
                this.rightSide.classList.add('area-flash');
                this.totalInputBox.classList.add('box-flash');
            }
            
            // Remove flash classes after flash duration
            setTimeout(() => {
                this.leftSide.classList.remove('area-flash');
                this.rightSide.classList.remove('area-flash');
                this.leftInputBox.classList.remove('box-flash');
                this.rightInputBox.classList.remove('box-flash');
                this.totalInputBox.classList.remove('box-flash');
            }, 1000);
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
        this.leftSide.classList.remove('area-flash');
        this.rightSide.classList.remove('area-flash');
        this.leftInputBox.classList.remove('box-flash');
        this.rightInputBox.classList.remove('box-flash');
        this.totalInputBox.classList.remove('box-flash');
    }

    startNewQuestion() {
        if (this.gameComplete) {
            return;
        }

        this.resetBoxState();
        this.hideAllInputBoxes();

        // Reset hint tracking for new question
        this.hintGiven = false;

        // Generate a sum based on current level
        const addition = this.generateAdditionForCurrentLevel();
        
        // Set current game state
        this.currentLeftCount = addition.left;
        this.currentRightCount = addition.right;
        this.currentAnswer = addition.sum;
        
        console.log(`Question: ${addition.left} + ${addition.right} = ${addition.sum}, Level: ${this.currentLevel}`);
        
        // Render the icons
        this.iconRenderer.renderIcons(addition.left, addition.right);
        
        // Reset button states and show input boxes
        this.resetButtonStates();
        this.showInputBoxes();
        
        // Give audio instruction based on sum number
        this.giveStartingSumInstruction();
        
        // Start inactivity timer
        this.startInactivityTimer();
    }

    generateAdditionForCurrentLevel() {
        const levelSums = this.levels[this.currentLevel];
        let selectedSum;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            // Randomly select from current level's sums
            selectedSum = levelSums[Math.floor(Math.random() * levelSums.length)];
            attempts++;
            
            // For level 6, check if this sum has been used before
            if (this.currentLevel === 6) {
                const canonical = this.getCanonicalAddition(selectedSum[0], selectedSum[1]);
                if (!this.usedSumsInSession.has(canonical)) {
                    break; // Found an unused sum
                }
                // If all sums have been used, allow repetition (break the loop)
                if (attempts >= maxAttempts) {
                    break;
                }
            } else {
                break; // For levels 1-5, any random selection is fine
            }
        } while (attempts < maxAttempts);
        
        // Add to used sums if level 6
        if (this.currentLevel === 6) {
            const canonical = this.getCanonicalAddition(selectedSum[0], selectedSum[1]);
            this.usedSumsInSession.add(canonical);
        }
        
        return {
            left: selectedSum[0],
            right: selectedSum[1],
            sum: selectedSum[0] + selectedSum[1]
        };
    }

    getCanonicalAddition(left, right) {
        const smaller = Math.min(left, right);
        const larger = Math.max(left, right);
        return `${smaller}+${larger}`;
    }

    giveStartingSumInstruction() {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        setTimeout(() => {
            if (this.sumsCompleted === 0) {
                // First sum
                this.speakText('Complete the three numbers in the addition sum.'); // Simplified message
            } else if (this.sumsCompleted === 1) {
                // Second sum
                this.speakText('Try again and complete the sum');
            } else {
                // Third sum onwards
                this.speakText('Complete the sum'); // New message for 3rd+ sums
            }
        }, 500);
    }

    hideAllInputBoxes() {
        this.checkMark.classList.remove('visible');
        
        // Clear box contents
        this.leftInputBox.textContent = '';
        this.rightInputBox.textContent = '';
        this.totalInputBox.textContent = '';
        
        // Reset box states
        this.leftInputBox.classList.remove('flashing', 'filled');
        this.rightInputBox.classList.remove('flashing', 'filled');
        this.totalInputBox.classList.remove('flashing', 'filled');
    }

    showInputBoxes() {
        // Show only the first uncompleted box as actively flashing
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
        // Clear any pending keyboard timer since we're processing an answer
        this.clearKeyboardTimer();
        
        let correctAnswer = false;
        
        // Check boxes in left-to-right priority order for filling
        if (!this.leftFilled && selectedNumber === this.currentLeftCount) {
            this.fillBox('left', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.rightFilled && selectedNumber === this.currentRightCount) {
            this.fillBox('right', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.totalFilled && selectedNumber === this.currentAnswer) {
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

        // Update flashing to show next priority box
        this.updateFlashingBoxes();
    }

    updateFlashingBoxes() {
        // Remove flashing from all boxes first
        this.leftInputBox.classList.remove('flashing');
        this.rightInputBox.classList.remove('flashing');
        this.totalInputBox.classList.remove('flashing');
        
        // Add flashing to the first uncompleted box (left-to-right priority)
        if (!this.leftFilled) {
            this.leftInputBox.classList.add('flashing');
        } else if (!this.rightFilled) {
            this.rightInputBox.classList.add('flashing');
        } else if (!this.totalFilled) {
            this.totalInputBox.classList.add('flashing');
        }
        
        // Restart flashing for the new priority box
        this.startFlashing();
    }

    checkQuestionCompletion() {
        if (this.leftFilled && this.rightFilled && this.totalFilled) {
            // All boxes completed - clear inactivity timer
            this.clearInactivityTimer();
            this.stopFlashing();
            
            // Show check mark
            this.checkMark.classList.add('visible');
            
            // Check if this was the first attempt for the entire question
            const wasFirstAttempt = !this.hasAttemptedAnswer();
            
            // Handle level progression BEFORE incrementing sumsCompleted
            this.handleLevelProgression(wasFirstAttempt);
            
            // Add rainbow piece
            const pieces = this.rainbow.addPiece();
            console.log(`Rainbow pieces: ${pieces}, wasFirstAttempt: ${wasFirstAttempt}, new level: ${this.currentLevel}`);
            
            // Give completion audio feedback
            if (this.audioEnabled && wasFirstAttempt) {
                const encouragements = ['Well done!', 'Excellent!', 'Perfect!'];
                const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                this.speakText(randomEncouragement);
            }
            
            this.sumsCompleted++;
            
            // Check if game is complete (10 sums total)
            if (this.rainbow.isComplete()) {
                setTimeout(() => {
                    this.completeGame();
                }, 3000);
                return;
            }

            // Start fade out after 2 seconds, then new question
            setTimeout(() => {
                this.fadeOutQuestion();
            }, 2000);
        }
    }

    handleLevelProgression(wasFirstAttempt) {
        if (wasFirstAttempt) {
            // Success - advance to next level (unless already at level 6)
            if (this.currentLevel < 6) {
                this.currentLevel++;
                console.log(`Advanced to level ${this.currentLevel}`);
            }
            // Update highest level reached
            if (this.currentLevel > this.highestLevelReached) {
                this.highestLevelReached = this.currentLevel;
            }
        } else {
            // Failure - handle level regression
            if (this.currentLevel <= 3) {
                // Levels 1-3: Special rules
                if (this.currentLevel === 1) {
                    // Stay at level 1
                    console.log('Failed at level 1, staying at level 1');
                } else if (this.currentLevel === 2) {
                    // Return to level 1
                    this.currentLevel = 1;
                    console.log('Failed at level 2, returning to level 1');
                } else if (this.currentLevel === 3) {
                    // Return to level 2
                    this.currentLevel = 2;
                    console.log('Failed at level 3, returning to level 2');
                }
            } else {
                // Levels 4-6: Return to level 3
                this.currentLevel = 3;
                console.log('Failed at level 4+, returning to level 3');
            }
        }
    }

    handleIncorrectAnswer(buttonElement) {
        // Clear inactivity timer and give immediate hint
        this.clearInactivityTimer();
        
        // Play failure sound
        if (this.audioEnabled) {
            this.playFailureSound();
        }
        
        // Give immediate "Try again" message for wrong answer
        if (this.audioEnabled && this.isTabVisible) {
            setTimeout(() => {
                this.speakText('Try again'); // Simple "Try again" message
            }, 800); // Give hint after error animation
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
            
            // Re-enable buttons and restart inactivity timer
            setTimeout(() => {
                this.buttonsDisabled = false;
                this.startFlashing();
                this.startInactivityTimer();
            }, 1400);
        }, 700);
    }

    fadeOutQuestion() {
        // Add fade out class to icons only
        const gameElements = [...this.iconRenderer.currentIcons];
        
        gameElements.forEach(element => {
            if (element) {
                element.classList.add('fade-out');
            }
        });
        
        // Start new question after fade out completes
        setTimeout(() => {
            this.startNewQuestion();
            
            // Remove fade out classes and add fade in to new icons
            setTimeout(() => {
                const newElements = [...this.iconRenderer.currentIcons];
                
                newElements.forEach(element => {
                    if (element) {
                        element.classList.remove('fade-out');
                        element.classList.add('fade-in');
                    }
                });
                
                // Clean up fade in classes
                setTimeout(() => {
                    newElements.forEach(element => {
                        if (element) {
                            element.classList.remove('fade-in');
                        }
                    });
                }, 1000);
            }, 100);
        }, 1000);
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

    completeGame() {
        this.gameComplete = true;
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        this.stopFlashing();
        this.modal.classList.remove('hidden');
        
        // Start bear celebration when modal opens
        this.bear.startCelebration();
        
        // Give completion audio message
        if (this.audioEnabled && this.isTabVisible) {
            setTimeout(() => {
                this.speakText('Well done! You have completed all ten sums! Try again or return to the home page.'); // Simplified message
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

    destroy() {
        // Clean up audio and timers
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        
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
    window.addGame = new AddGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.addGame) {
        window.addGame.destroy();
    }
});
