class AddGameController {
    constructor() {
        this.iconRenderer = new AddIconRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentDifficulty = CONFIG.DIFFICULTY.EASY;
        this.currentAnswer = 0;
        this.currentLeftCount = 0;
        this.currentRightCount = 0;
        this.previousSum = 0;
        this.previousAddition = null;
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.questionsInLevel = 0;
        this.gameComplete = false;
        this.hasSeenHigherNumbers = false;
        this.buttonsDisabled = false;
        
        // Track if 1+? format has been used and answered correctly in current level
        this.hasUsedOnePlusFormat = false;
        this.currentLevelTurn = 0;
        
        // Track completed sums to avoid repetition
        this.correctlyCompletedSums = new Set(); // Store canonical addition strings (e.g., "2+3")
        
        // Audio functionality
        this.audioContext = null;
        this.audioEnabled = CONFIG.AUDIO_ENABLED || true;
        this.sumsCompleted = 0; // Track total sums completed for audio logic
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.inactivityDuration = 10000; // 10 seconds
        
        // Keyboard two-digit handling for "10"
        this.keyboardBuffer = '';
        this.keyboardTimer = null;
        this.keyboardWaitDuration = 4000; // 4 seconds to wait for second digit
        
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
        
        this.initializeEventListeners();
        this.initializeAudio();
        this.createMuteButton();
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
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
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
        if (!this.audioEnabled || this.buttonsDisabled || this.gameComplete) return;
        
        // Determine which hint to give based on current flashing box
        let hintText = '';
        if (!this.leftFilled) {
            hintText = 'Try counting the number of pictures on the left side';
        } else if (!this.rightFilled) {
            hintText = 'Try counting the number of pictures on the right side';
        } else if (!this.totalFilled) {
            hintText = 'Try counting the number of pictures in total';
        }
        
        if (hintText) {
            this.speakText(hintText);
        }
        
        // Restart the timer for continuous hints
        this.startInactivityTimer();
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

    startNewGame() {
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.questionsInLevel = 0;
        this.gameComplete = false;
        this.previousSum = 0;
        this.previousAddition = null;
        this.hasSeenHigherNumbers = false;
        this.buttonsDisabled = false;
        this.hasUsedOnePlusFormat = false;
        this.currentLevelTurn = 0;
        this.sumsCompleted = 0; // Reset sum counter
        this.correctlyCompletedSums.clear(); // Reset completed sums tracking
        this.clearInactivityTimer();
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

        // Check if we need to force higher numbers
        let forceHigherNumbers = false;
        if (this.correctStreak === 1 && !this.hasSeenHigherNumbers) {
            forceHigherNumbers = true;
        }

        let leftCount, rightCount, sum, currentAddition;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            if (forceHigherNumbers) {
                const addition = this.generateForcedHigherAddition();
                leftCount = addition.left;
                rightCount = addition.right;
                sum = addition.sum;
            } else {
                const addition = this.generateAdditionForDifficulty();
                leftCount = addition.left;
                rightCount = addition.right;
                sum = addition.sum;
            }
            
            currentAddition = this.getCanonicalAddition(leftCount, rightCount);
            attempts++;
            
        } while (
            (sum === this.previousSum || 
             currentAddition === this.previousAddition ||
             this.isConsecutiveHighNumbers(sum, this.previousSum) ||
             this.shouldAvoidOnePlusFormat(leftCount, rightCount) ||
             this.shouldAvoidCompletedSum(currentAddition)) && 
            attempts < maxAttempts
        );
        
        // Update tracking variables
        this.previousSum = sum;
        this.previousAddition = currentAddition;
        
        // Check if this question contains higher numbers for current level
        this.checkForHigherNumbers(sum);
        
        // Set current game state
        this.currentLeftCount = leftCount;
        this.currentRightCount = rightCount;
        this.currentAnswer = sum;
        
        console.log(`Question: ${leftCount} + ${rightCount} = ${sum}, Level: ${this.currentDifficulty.name}, HasUsedOnePlus: ${this.hasUsedOnePlusFormat}`);
        
        // Render the icons
        this.iconRenderer.renderIcons(leftCount, rightCount);
        
        // Reset button states and show input boxes
        this.resetButtonStates();
        this.showInputBoxes();
        
        // Give audio instruction based on sum number
        this.giveStartingSumInstruction();
        
        // Start inactivity timer
        this.startInactivityTimer();
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
        
        // If digit is 1 and no 1 is currently needed as answer
        if (digit === 1 && !this.isDigitValidAnswer(1)) {
            // Check if 10 could be a valid answer
            if (this.isDigitValidAnswer(10)) {
                // Start waiting for potential "0" to complete "10"
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
        
        // Handle normal single digit input
        const button = Array.from(this.numberButtons).find(btn => 
            parseInt(btn.dataset.number) === digit
        );
        if (button) {
            this.handleNumberClick(digit, button);
        }
    }

    giveStartingSumInstruction() {
        if (!this.audioEnabled) return;
        
        setTimeout(() => {
            if (this.sumsCompleted === 0) {
                // First sum
                this.speakText('Complete the three numbers in the addition sum. How many pictures are on the left side? How many pictures are on the right side? What is the total?');
            } else if (this.sumsCompleted === 1) {
                // Second sum
                this.speakText('Try again and complete the sum');
            }
            // No audio for further sums
        }, 500);
    }

    // Check if we should avoid a previously completed sum
    shouldAvoidCompletedSum(canonicalAddition) {
        // If this sum was completed correctly before, avoid it only if there are other options
        if (!this.correctlyCompletedSums.has(canonicalAddition)) {
            return false; // Haven't completed this sum before, so it's fine to use
        }
        
        // Check if there are any unused sums available for current difficulty
        const availableSums = this.getAllPossibleSumsForCurrentDifficulty();
        const unusedSums = availableSums.filter(sum => !this.correctlyCompletedSums.has(sum));
        
        // If there are unused sums available, avoid the completed one
        // If no unused sums available, allow repetition
        return unusedSums.length > 0;
    }

    // Get all possible canonical addition combinations for current difficulty
    getAllPossibleSumsForCurrentDifficulty() {
        const possibleSums = [];
        const maxTotal = this.currentDifficulty.maxTotal;
        const minSum = 2;
        
        for (let sum = minSum; sum <= maxTotal; sum++) {
            for (let left = CONFIG.MIN_ICONS_PER_SIDE; left <= CONFIG.MAX_ICONS_PER_SIDE; left++) {
                const right = sum - left;
                if (right >= CONFIG.MIN_ICONS_PER_SIDE && right <= CONFIG.MAX_ICONS_PER_SIDE) {
                    const canonical = this.getCanonicalAddition(left, right);
                    if (!possibleSums.includes(canonical)) {
                        possibleSums.push(canonical);
                    }
                }
            }
        }
        
        return possibleSums;
    }

    // Check if we should avoid 1+? format
    shouldAvoidOnePlusFormat(leftCount, rightCount) {
        if (!this.hasUsedOnePlusFormat) {
            return false;
        }
        return (leftCount === 1 || rightCount === 1);
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
            
            // Mark that we've used 1+? format if this question was 1+? or ?+1
            if (wasFirstAttempt && (this.currentLeftCount === 1 || this.currentRightCount === 1)) {
                this.hasUsedOnePlusFormat = true;
                console.log('Marked 1+? format as used in this level');
            }
            
            // Add rainbow piece
            const pieces = this.rainbow.addPiece();
            console.log(`Rainbow pieces: ${pieces}, wasFirstAttempt: ${wasFirstAttempt}`);
            
            // Give completion audio feedback
            if (this.audioEnabled && wasFirstAttempt) {
                const encouragements = ['Well done!', 'Excellent!', 'Perfect!'];
                const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                this.speakText(randomEncouragement);
            }
            
            // Update streaks and difficulty progression
            if (wasFirstAttempt) {
                this.correctStreak++;
                this.wrongStreak = 0;
                this.questionsInLevel++;
                this.sumsCompleted++; // Increment completed sums counter
                
                // Add this sum to correctly completed sums (no mistakes made)
                const currentCanonicalAddition = this.getCanonicalAddition(this.currentLeftCount, this.currentRightCount);
                this.correctlyCompletedSums.add(currentCanonicalAddition);
                console.log(`Added ${currentCanonicalAddition} to completed sums. Total completed: ${this.correctlyCompletedSums.size}`);
                
                const progressionRequirement = this.getProgressionRequirement();
                if (this.correctStreak >= progressionRequirement) {
                    this.progressDifficulty();
                }
            } else {
                this.wrongStreak++;
                this.correctStreak = 0;
                this.questionsInLevel++;
                this.sumsCompleted++; // Still increment even if not first attempt
                // Don't add to completed sums since mistakes were made
                
                if (this.wrongStreak >= CONFIG.CONSECUTIVE_WRONG_TO_DROP) {
                    this.dropDifficulty();
                }
            }
            
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

    getProgressionRequirement() {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.EASY) {
            return 2; // Easy to Medium: 2 correct
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
            return 3; // Medium to Hard: 3 correct (unchanged)
        } else {
            return 2; // Hard level: 2 correct (for potential future levels)
        }
    }

    handleIncorrectAnswer(buttonElement) {
        // Clear inactivity timer and give immediate hint
        this.clearInactivityTimer();
        
        // Give audio hint for wrong answer
        if (this.audioEnabled) {
            let hintText = '';
            if (!this.leftFilled) {
                hintText = 'Try counting the number of pictures on the left side';
            } else if (!this.rightFilled) {
                hintText = 'Try counting the number of pictures on the right side';
            } else if (!this.totalFilled) {
                hintText = 'Try counting the number of pictures in total';
            }
            
            if (hintText) {
                setTimeout(() => {
                    this.speakText(hintText);
                }, 800); // Give hint after error animation
            }
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

    // Addition generation methods (unchanged)
    generateForcedHigherAddition() {
        const higherNumbers = this.currentDifficulty.higherNumbers;
        if (!higherNumbers) return this.generateAdditionForDifficulty();
        
        const targetSum = higherNumbers[Math.floor(Math.random() * higherNumbers.length)];
        return this.generateAdditionForSum(targetSum);
    }

    generateAdditionForDifficulty() {
        const maxTotal = this.currentDifficulty.maxTotal;
        const minSum = 2;
        
        const sum = Math.floor(Math.random() * (maxTotal - minSum + 1)) + minSum;
        return this.generateAdditionForSum(sum);
    }

    generateAdditionForSum(targetSum) {
        const combinations = [];
        
        for (let left = CONFIG.MIN_ICONS_PER_SIDE; left <= CONFIG.MAX_ICONS_PER_SIDE; left++) {
            const right = targetSum - left;
            if (right >= CONFIG.MIN_ICONS_PER_SIDE && right <= CONFIG.MAX_ICONS_PER_SIDE) {
                combinations.push({ left, right, sum: targetSum });
            }
        }
        
        if (combinations.length === 0) {
            return { left: 1, right: 1, sum: 2 };
        }
        
        return combinations[Math.floor(Math.random() * combinations.length)];
    }

    getCanonicalAddition(left, right) {
        const smaller = Math.min(left, right);
        const larger = Math.max(left, right);
        return `${smaller}+${larger}`;
    }

    isConsecutiveHighNumbers(currentSum, previousSum) {
        if (this.currentDifficulty.name === 'hard') {
            const highNumbers = [8, 9, 10];
            return highNumbers.includes(currentSum) && highNumbers.includes(previousSum);
        }
        return false;
    }

    checkForHigherNumbers(sum) {
        const higherNumbers = this.currentDifficulty.higherNumbers;
        if (higherNumbers && higherNumbers.includes(sum)) {
            this.hasSeenHigherNumbers = true;
        }
    }

    progressDifficulty() {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.EASY) {
            this.currentDifficulty = CONFIG.DIFFICULTY.MEDIUM;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
            this.currentDifficulty = CONFIG.DIFFICULTY.HARD;
        }
        
        this.correctStreak = 0;
        this.questionsInLevel = 0;
        this.hasSeenHigherNumbers = false;
        this.hasUsedOnePlusFormat = false;
        this.currentLevelTurn++;
        console.log(`Advanced to ${this.currentDifficulty.name}, reset 1+? tracking`);
    }

    dropDifficulty() {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.HARD) {
            this.currentDifficulty = CONFIG.DIFFICULTY.MEDIUM;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
            this.currentDifficulty = CONFIG.DIFFICULTY.EASY;
        }
        
        this.wrongStreak = 0;
        this.correctStreak = 0;
        this.questionsInLevel = 0;
        this.hasSeenHigherNumbers = false;
        this.hasUsedOnePlusFormat = false;
        this.currentLevelTurn++;
        console.log(`Dropped to ${this.currentDifficulty.name}, reset 1+? tracking`);
    }

    completeGame() {
        this.gameComplete = true;
        this.clearInactivityTimer();
        this.stopFlashing();
        this.modal.classList.remove('hidden');
        
        // Start bear celebration when modal opens
        this.bear.startCelebration();
        
        // Give completion audio message
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Well done! You have completed all ten sums! Try again or return to the home page and try another game.');
            }, 1000);
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
