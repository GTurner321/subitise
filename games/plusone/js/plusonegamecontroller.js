class PlusOneGameController {
    constructor() {
        // Make config available globally for shared Rainbow and Bear classes
        window.CONFIG = CONFIG;
        
        this.iconRenderer = new PlusOneIconRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game progression
        this.currentLevel = 1;
        this.highestLevelReached = 1;
        this.questionsCompleted = 0;
        this.gameComplete = false;
        
        // Track used numbers per level to avoid repetition
        this.usedNumbersInLevel = new Set();
        
        // Level progression tracking for redemption system
        this.failedAtCurrentLevel = false; // Track if user has failed once at current level
        
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
        
        // Game state
        this.currentNumber = 0; // The 'n' in n+1
        this.currentAnswer = 0; // n+1
        this.buttonsDisabled = false;
        
        // Box state tracking - levels 3+ only need total box
        this.leftFilled = false;
        this.totalFilled = false; // Right box is always filled with "1"
        
        // Flashing intervals
        this.flashingInterval = null;
        this.flashingTimeout = null;
        
        // DOM elements
        this.numberButtons = document.getElementById('numberButtons');
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
        
        this.updateMuteButtonIcon();
        
        this.muteButton.addEventListener('click', () => this.toggleAudio());
        this.muteButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleAudio();
        });
        
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
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Sound on');
            }, 100);
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
        if (this.currentLevel <= 2) {
            // Levels 1-2: traditional hints
            if (!this.leftFilled) {
                hintText = 'Count the number of pictures on the left side';
            } else if (!this.totalFilled) {
                hintText = `What is ${this.currentNumber} plus one?`;
            }
        } else {
            // Levels 3+: only need to find the answer
            if (!this.totalFilled) {
                hintText = `What is ${this.currentNumber} plus one?`;
            }
        }
        
        if (hintText) {
            this.speakText(hintText);
        }
    }

    initializeEventListeners() {
        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });

        // Keyboard event listener
        document.addEventListener('keydown', (e) => {
            if (this.buttonsDisabled || this.gameComplete) {
                return;
            }
            
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
        // Handle multi-digit input for higher levels
        if (this.currentLevel >= 3) {
            // For levels 3+, we might need multi-digit numbers
            if (this.keyboardBuffer === '1' && digit === 0) {
                this.clearKeyboardTimer();
                this.handleNumberClick(10, null);
                return;
            }
            
            this.clearKeyboardTimer();
            
            if (digit === 1 && this.couldBePartOfLargerNumber()) {
                this.keyboardBuffer = '1';
                this.keyboardTimer = setTimeout(() => {
                    this.clearKeyboardTimer();
                    this.handleNumberClick(1, null);
                }, this.keyboardWaitDuration);
                return;
            }
        }
        
        this.handleNumberClick(digit, null);
    }

    couldBePartOfLargerNumber() {
        // Check if "1" could be part of a larger valid answer
        const possibleAnswers = this.getPossibleAnswers();
        return possibleAnswers.some(answer => answer >= 10 && answer.toString().startsWith('1'));
    }

    getPossibleAnswers() {
        if (this.currentLevel <= 2) {
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        } else {
            // For levels 3+, this would be the 4 multiple choice options
            return this.getCurrentOptions();
        }
    }

    getCurrentOptions() {
        // This will be set when creating buttons for levels 3+
        return this.currentOptions || [];
    }

    startNewGame() {
        this.currentLevel = this.highestLevelReached;
        this.questionsCompleted = 0;
        this.gameComplete = false;
        this.usedNumbersInLevel.clear();
        this.failedAtCurrentLevel = false; // Reset failure tracking
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
        this.totalFilled = false;
        this.stopFlashing();
    }

    startFlashing() {
        this.stopFlashing();
        
        const flashElements = () => {
            // For levels 1-2: flash based on which box needs filling
            if (this.currentLevel <= 2) {
                if (!this.leftFilled) {
                    this.leftSide.classList.add('area-flash');
                    this.leftInputBox.classList.add('box-flash');
                } else if (!this.totalFilled) {
                    this.leftSide.classList.add('area-flash');
                    this.rightSide.classList.add('area-flash');
                    this.totalInputBox.classList.add('box-flash');
                }
            } else {
                // For levels 3+: only flash for total answer (left is pre-filled)
                if (!this.totalFilled) {
                    this.leftSide.classList.add('area-flash');
                    this.rightSide.classList.add('area-flash');
                    this.totalInputBox.classList.add('box-flash');
                }
            }
            
            setTimeout(() => {
                this.leftSide.classList.remove('area-flash');
                this.rightSide.classList.remove('area-flash');
                this.leftInputBox.classList.remove('box-flash');
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
        this.totalInputBox.classList.remove('box-flash');
    }

    startNewQuestion() {
        if (this.gameComplete) {
            return;
        }

        this.resetBoxState();
        this.hideAllInputBoxes();
        this.hintGiven = false;

        // Generate n+1 question for current level
        this.generatePlusOneQuestion();
        
        console.log(`Question: ${this.currentNumber} + 1 = ${this.currentAnswer}, Level: ${this.currentLevel}`);
        
        // Render the content (icons for 1-2, numbers for 3+)
        this.iconRenderer.renderContent(this.currentNumber, this.currentLevel);
        
        // Create appropriate buttons
        this.createButtons();
        
        // Reset button states and show input boxes
        this.resetButtonStates();
        this.showInputBoxes();
        
        // Give audio instruction
        this.giveStartingInstruction();
        
        this.startInactivityTimer();
    }

    generatePlusOneQuestion() {
        const levelNumbers = CONFIG.LEVELS[this.currentLevel].numbers;
        const availableNumbers = levelNumbers.filter(num => !this.usedNumbersInLevel.has(num));
        
        // If all numbers used, reset the used numbers set
        if (availableNumbers.length === 0) {
            this.usedNumbersInLevel.clear();
            this.currentNumber = levelNumbers[Math.floor(Math.random() * levelNumbers.length)];
        } else {
            this.currentNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        }
        
        this.usedNumbersInLevel.add(this.currentNumber);
        this.currentAnswer = this.currentNumber + 1;
    }

    createButtons() {
        this.numberButtons.innerHTML = '';
        
        if (this.currentLevel <= 2) {
            // Levels 1-2: Use 1-10 buttons like add game
            this.numberButtons.classList.remove('multiple-choice');
            
            for (let i = 1; i <= 10; i++) {
                const button = document.createElement('button');
                button.className = 'number-btn';
                button.dataset.number = i;
                button.textContent = i;
                
                button.addEventListener('click', (e) => {
                    if (this.buttonsDisabled) return;
                    this.clearInactivityTimer();
                    this.startInactivityTimer();
                    const selectedNumber = parseInt(e.target.dataset.number);
                    this.handleNumberClick(selectedNumber, e.target);
                });
                
                this.numberButtons.appendChild(button);
            }
        } else {
            // Levels 3+: Use 4 multiple choice options
            this.numberButtons.classList.add('multiple-choice');
            this.createMultipleChoiceButtons();
        }
    }

    createMultipleChoiceButtons() {
        // Generate 4 options: correct answer, n-1, random from level set, and n+2/n+3/n+5/n+10
        const options = new Set();
        
        // Add correct answer (n+1)
        options.add(this.currentAnswer);
        
        // Add n-1 (one less than original number)
        const nMinus1 = Math.max(1, this.currentNumber - 1);
        options.add(nMinus1);
        
        // Add random number from current level set
        const levelNumbers = CONFIG.LEVELS[this.currentLevel].numbers;
        let randomFromLevel;
        let attempts = 0;
        do {
            randomFromLevel = levelNumbers[Math.floor(Math.random() * levelNumbers.length)] + 1;
            attempts++;
        } while (options.has(randomFromLevel) && attempts < 50);
        options.add(randomFromLevel);
        
        // Add one of: n+2, n+3, n+5, n+10
        const bonusOptions = [this.currentNumber + 2, this.currentNumber + 3, this.currentNumber + 5, this.currentNumber + 10];
        let bonusChoice;
        attempts = 0;
        do {
            bonusChoice = bonusOptions[Math.floor(Math.random() * bonusOptions.length)];
            attempts++;
        } while (options.has(bonusChoice) && attempts < 20);
        options.add(bonusChoice);
        
        // Convert to array and shuffle
        this.currentOptions = Array.from(options).slice(0, 4);
        this.shuffleArray(this.currentOptions);
        
        // Create buttons
        this.currentOptions.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'number-btn';
            button.dataset.number = option;
            button.textContent = option;
            
            button.addEventListener('click', (e) => {
                if (this.buttonsDisabled) return;
                this.clearInactivityTimer();
                this.startInactivityTimer();
                const selectedNumber = parseInt(e.target.dataset.number);
                this.handleNumberClick(selectedNumber, e.target);
            });
            
            this.numberButtons.appendChild(button);
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    giveStartingInstruction() {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        setTimeout(() => {
            if (this.questionsCompleted === 0) {
                this.speakText('Complete the plus one sum');
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
        this.totalInputBox.textContent = '';
        
        this.leftInputBox.classList.remove('flashing', 'filled');
        this.totalInputBox.classList.remove('flashing', 'filled');
        
        // Right box always shows "1"
        this.rightInputBox.textContent = '1';
        this.rightInputBox.classList.add('filled');
        
        // For levels 3+, pre-fill the left box
        if (this.currentLevel >= 3) {
            this.leftInputBox.textContent = this.currentNumber;
            this.leftInputBox.classList.add('filled');
            this.leftFilled = true;
        }
    }

    showInputBoxes() {
        if (this.currentLevel <= 2) {
            // Levels 1-2: show flashing based on what needs to be filled
            if (!this.leftFilled) {
                this.leftInputBox.classList.add('flashing');
            } else if (!this.totalFilled) {
                this.totalInputBox.classList.add('flashing');
            }
        } else {
            // Levels 3+: only total box needs to be filled (left is pre-filled)
            if (!this.totalFilled) {
                this.totalInputBox.classList.add('flashing');
            }
        }
        this.startFlashing();
    }

    handleNumberClick(selectedNumber, buttonElement) {
        this.clearKeyboardTimer();
        
        let correctAnswer = false;
        
        // Check which box should be filled based on level
        if (this.currentLevel <= 2) {
            // Levels 1-2: traditional left then total filling
            if (!this.leftFilled && selectedNumber === this.currentNumber) {
                this.fillBox('left', selectedNumber, buttonElement);
                correctAnswer = true;
            } else if (!this.totalFilled && selectedNumber === this.currentAnswer) {
                this.fillBox('total', selectedNumber, buttonElement);
                correctAnswer = true;
            }
        } else {
            // Levels 3+: only total box needs to be filled (left is pre-filled)
            if (!this.totalFilled && selectedNumber === this.currentAnswer) {
                this.fillBox('total', selectedNumber, buttonElement);
                correctAnswer = true;
            }
        }
        
        if (correctAnswer) {
            this.checkQuestionCompletion();
        } else {
            this.handleIncorrectAnswer(buttonElement);
        }
    }

    fillBox(boxType, selectedNumber, buttonElement) {
        // Flash green on correct answer
        if (buttonElement) {
            buttonElement.classList.add('correct');
            setTimeout(() => {
                buttonElement.classList.remove('correct');
            }, CONFIG.FLASH_DURATION || 800);
        }

        // Play completion sound
        if (this.audioEnabled) {
            this.playCompletionSound();
        }

        // Create celebration stars around the button
        if (buttonElement) {
            this.createCelebrationStars(buttonElement);
        }

        // Fill the appropriate box
        switch (boxType) {
            case 'left':
                this.leftInputBox.textContent = selectedNumber;
                this.leftInputBox.classList.remove('flashing');
                this.leftInputBox.classList.add('filled');
                this.leftFilled = true;
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
        this.totalInputBox.classList.remove('flashing');
        
        if (this.currentLevel <= 2) {
            // Levels 1-2: traditional progression
            if (!this.leftFilled) {
                this.leftInputBox.classList.add('flashing');
            } else if (!this.totalFilled) {
                this.totalInputBox.classList.add('flashing');
            }
        } else {
            // Levels 3+: only total box needs flashing (left is pre-filled)
            if (!this.totalFilled) {
                this.totalInputBox.classList.add('flashing');
            }
        }
        
        this.startFlashing();
    }

    checkQuestionCompletion() {
        let questionComplete = false;
        
        if (this.currentLevel <= 2) {
            // Levels 1-2: need both left and total filled
            questionComplete = this.leftFilled && this.totalFilled;
        } else {
            // Levels 3+: only need total filled (left is pre-filled)
            questionComplete = this.totalFilled;
        }
        
        if (questionComplete) {
            this.clearInactivityTimer();
            this.stopFlashing();
            
            this.checkMark.classList.add('visible');
            
            const wasFirstAttempt = !this.hasAttemptedAnswer();
            
            this.handleLevelProgression(wasFirstAttempt);
            
            const pieces = this.rainbow.addPiece();
            console.log(`Rainbow pieces: ${pieces}, wasFirstAttempt: ${wasFirstAttempt}, new level: ${this.currentLevel}`);
            
            if (this.audioEnabled && wasFirstAttempt) {
                const encouragements = ['Well done!', 'Excellent!', 'Perfect!'];
                const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                this.speakText(randomEncouragement);
            }
            
            this.questionsCompleted++;
            
            if (this.rainbow.isComplete()) {
                setTimeout(() => {
                    this.completeGame();
                }, 3000);
                return;
            }

            setTimeout(() => {
                this.fadeOutQuestion();
            }, 2000);
        }
    }

    handleLevelProgression(wasFirstAttempt) {
        if (wasFirstAttempt) {
            // Success - advance to next level and reset failure tracking
            if (this.currentLevel < 10) {
                this.currentLevel++;
                console.log(`Advanced to level ${this.currentLevel}`);
            }
            if (this.currentLevel > this.highestLevelReached) {
                this.highestLevelReached = this.currentLevel;
            }
            this.failedAtCurrentLevel = false; // Reset failure tracking on success
        } else {
            // Failure - implement redemption system
            if (this.failedAtCurrentLevel) {
                // This is the second failure at this level - go back one level
                if (this.currentLevel > 1) {
                    this.currentLevel--;
                    console.log(`Second failure at level, dropping to level ${this.currentLevel}`);
                }
                this.failedAtCurrentLevel = false; // Reset for new level
            } else {
                // This is the first failure - stay at same level for redemption
                this.failedAtCurrentLevel = true;
                console.log(`First failure at level ${this.currentLevel}, staying for redemption question`);
            }
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
        
        if (buttonElement) {
            buttonElement.classList.add('incorrect');
            setTimeout(() => {
                buttonElement.classList.remove('incorrect');
            }, CONFIG.FLASH_DURATION || 800);

            const crossOverlay = document.createElement('div');
            crossOverlay.className = 'cross-overlay';
            buttonElement.appendChild(crossOverlay);

            buttonElement.dataset.attempted = 'true';
            
            // Fade out other buttons
            const allButtons = this.numberButtons.querySelectorAll('.number-btn');
            allButtons.forEach(btn => {
                if (btn !== buttonElement) {
                    btn.style.transition = 'opacity 700ms ease-in-out';
                    btn.style.opacity = '0.1';
                }
            });

            setTimeout(() => {
                setTimeout(() => {
                    allButtons.forEach(btn => {
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
                        
                        allButtons.forEach(btn => {
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
    }

    fadeOutQuestion() {
        const gameElements = [...this.iconRenderer.currentIcons];
        
        gameElements.forEach(element => {
            if (element) {
                element.classList.add('fade-out');
            }
        });
        
        setTimeout(() => {
            this.startNewQuestion();
            
            setTimeout(() => {
                const newElements = [...this.iconRenderer.currentIcons];
                
                newElements.forEach(element => {
                    if (element) {
                        element.classList.remove('fade-out');
                        element.classList.add('fade-in');
                    }
                });
                
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
        const allButtons = this.numberButtons.querySelectorAll('.number-btn');
        return Array.from(allButtons).some(btn => 
            btn.dataset.attempted === 'true'
        );
    }

    resetButtonStates() {
        this.buttonsDisabled = false;
        const allButtons = this.numberButtons.querySelectorAll('.number-btn');
        allButtons.forEach(btn => {
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
                this.speakText('Well done! You have completed all ten plus one sums! Try again or return to the home page.');
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
        if (!buttonElement) return;
        
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
        this.iconRenderer.reset();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.plusOneGame = new PlusOneGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.plusOneGame) {
        window.plusOneGame.destroy();
    }
});
