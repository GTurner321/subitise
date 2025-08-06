class PlusOneGameController {
    constructor() {
        console.log('🎮 Plus One Game Controller - Complete Rewrite');
        
        // Initialize components
        this.contentRenderer = new PlusOneContentRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game progression
        this.currentLevel = 1;
        this.questionsCompleted = 0;
        this.gameComplete = false;
        
        // Track used numbers per level to avoid repetition
        this.usedNumbersInLevel = new Set();
        
        // Level progression tracking for redemption system
        this.failedAtCurrentLevel = false;
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.hintGiven = false;
        this.isTabVisible = true;
        
        // Enhanced keyboard handling with smart algorithm
        this.keyboardBuffer = '';
        this.keyboardTimer = null;
        this.lastKeyTime = 0;
        this.isTypingSequence = false;
        this.usedAnswersInCurrentQuestion = new Set();
        
        // Game state
        this.currentNumber = 0; // The 'n' in n+1
        this.currentAnswer = 0; // n+1
        this.buttonsDisabled = false;
        this.hasAttemptedAnyAnswer = false;
        
        // Box state tracking
        this.leftFilled = false;
        this.rightFilled = false;
        this.totalFilled = false;
        
        // Flashing intervals
        this.flashingInterval = null;
        this.flashingTimeout = null;
        
        // System readiness
        this.systemsReady = false;
        this.initializationComplete = false;
        this.readyCheckCount = 0;
        
        // Track current question type for smooth transitions
        this.currentQuestionType = null; // 'picture' or 'number'
        this.previousQuestionType = null;
        
        // DOM elements
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.leftInputBox = document.getElementById('leftInputBox');
        this.rightInputBox = document.getElementById('rightInputBox');
        this.sumRow = document.getElementById('sumRow');
        this.totalInputBox = document.getElementById('totalInputBox');
        this.checkMark = document.getElementById('checkMark');
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.gameArea = document.querySelector('.game-area');
        this.leftPulseArea = document.getElementById('leftPulseArea');
        this.rightPulseArea = document.getElementById('rightPulseArea');
        
        // Initialize
        this.initializeEventListeners();
        this.setupVisibilityHandling();
        this.setupTouchProtection();
        this.waitForSystemsAndInitialize();
    }

    // Helper functions
    shouldUsePictureFormat() {
        return this.currentLevel <= 2 || this.currentLevel === 5;
    }

    shouldUseNumberFormat() {
        return this.currentLevel >= 3 && this.currentLevel !== 5;
    }

    waitForSystemsAndInitialize() {
        console.log('🎮 Checking system readiness...');
        
        const checkSystemsReady = () => {
            this.readyCheckCount++;
            
            const buttonBarReady = window.ButtonBar && typeof window.ButtonBar.create === 'function';
            const gameAreaReady = this.gameArea && this.leftSide && this.rightSide && this.sumRow;
            
            if (buttonBarReady && gameAreaReady) {
                console.log(`🎮 Systems ready after ${this.readyCheckCount} checks`);
                this.systemsReady = true;
                
                if (this.contentRenderer && typeof this.contentRenderer.setupButtonBarCoordination === 'function') {
                    this.contentRenderer.setupButtonBarCoordination();
                }
                
                this.createButtons();
                
                setTimeout(() => {
                    this.initializeGame();
                }, CONFIG.BUTTON_SETUP_DELAY);
                
                return;
            }
            
            if (this.readyCheckCount >= CONFIG.MAX_READY_CHECKS) {
                console.warn('⚠️ Systems not ready, forcing initialization');
                this.systemsReady = true;
                this.forceInitialization();
                return;
            }
            
            setTimeout(checkSystemsReady, CONFIG.SYSTEM_CHECK_INTERVAL);
        };
        
        checkSystemsReady();
    }

    forceInitialization() {
        console.log('🚨 Force initializing game systems');
        this.systemsReady = true;
        
        if (this.contentRenderer && typeof this.contentRenderer.setupButtonBarCoordination === 'function') {
            try {
                this.contentRenderer.setupButtonBarCoordination();
            } catch (error) {
                console.warn('Content renderer setup failed:', error);
            }
        }
        
        if (window.ButtonBar && typeof window.ButtonBar.create === 'function') {
            try {
                this.createButtons();
            } catch (error) {
                console.warn('Button creation failed:', error);
            }
        }
        
        setTimeout(() => {
            this.initializeGame();
        }, CONFIG.BUTTON_SETUP_DELAY);
    }

    initializeGame() {
        console.log('🎮 Starting game initialization');
        
        // Hide elements initially (except persistent ones like button bar, game area structure)
        this.hideTransitionElements();
        
        // Set up sum bar ready state after fade-in
        setTimeout(() => {
            if (this.sumRow) {
                this.sumRow.classList.add('sum-bar-ready');
            }
        }, 1000);
        
        setTimeout(() => {
            this.showPersistentElements();
            this.initializationComplete = true;
            
            setTimeout(() => {
                this.startNewQuestion();
            }, 500);
            
        }, 200);
    }

    hideTransitionElements() {
        // Only hide elements that transition between questions
        if (this.gameArea) this.gameArea.classList.remove('loaded');
    }

    showPersistentElements() {
        // Show persistent game structure
        if (this.gameArea) {
            this.gameArea.classList.add('dimensions-ready', 'loaded');
        }
        
        // Failsafe
        setTimeout(() => {
            if (this.gameArea && !this.gameArea.classList.contains('loaded')) {
                this.gameArea.classList.add('dimensions-ready', 'loaded');
                this.gameArea.style.visibility = 'visible';
                this.gameArea.style.opacity = '1';
            }
        }, 1000);
    }

    createButtons() {
        const isPictureFormat = this.shouldUsePictureFormat();
        const config = isPictureFormat ? CONFIG.BUTTON_CONFIGS.PICTURE_FORMAT : CONFIG.BUTTON_CONFIGS.NUMBER_FORMAT;
        
        console.log(`Creating buttons: ${isPictureFormat ? 'Picture' : 'Number'} format (${config.count} buttons)`);
        
        const colors = CONFIG.COLORS.slice(0, config.count);
        let numbers = isPictureFormat ? [...config.numbers] : [1, 2, 3, 4];
        
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
        
        setTimeout(() => {
            if (window.ButtonBar) {
                window.ButtonBar.create(
                    config.count,
                    config.width,
                    config.height,
                    colors,
                    numbers,
                    (selectedNumber, buttonElement) => {
                        if (this.buttonsDisabled || this.gameComplete) return;
                        
                        this.clearInactivityTimer();
                        this.startInactivityTimer();
                        this.handleNumberClick(selectedNumber, buttonElement);
                    }
                );
            }
        }, 50);
    }

    // SMOOTH TRANSITION SYSTEM
    startNewQuestion() {
        if (this.gameComplete) return;
        
        if (!this.systemsReady) {
            setTimeout(() => this.startNewQuestion(), 100);
            return;
        }

        // Track question types for smooth transitions
        this.previousQuestionType = this.currentQuestionType;
        this.currentQuestionType = this.shouldUsePictureFormat() ? 'picture' : 'number';
        
        this.resetQuestionState();
        this.generatePlusOneQuestion();
        
        console.log(`🎮 NEW QUESTION: ${this.currentNumber} + 1 = ${this.currentAnswer}, Level: ${this.currentLevel}`);
        
        // Handle transitions based on question type changes
        if (this.previousQuestionType !== this.currentQuestionType) {
            // Different question types - need button recreation and content fade
            this.handleQuestionTypeChange();
        } else {
            // Same question type - smooth content update only
            this.handleSameQuestionType();
        }
    }

    handleQuestionTypeChange() {
        console.log(`🔄 Question type change: ${this.previousQuestionType} → ${this.currentQuestionType}`);
        
        // Fade out current content
        this.fadeOutCurrentContent();
        
        // Recreate buttons for new format
        this.createButtons();
        
        setTimeout(() => {
            // Update buttons for number format
            if (this.shouldUseNumberFormat()) {
                this.updateButtonsForNumberFormat(this.currentAnswer);
            }
            
            this.setupQuestionElements();
            this.renderNewContent();
            
            setTimeout(() => {
                this.fadeInNewContent();
                this.finalizeNewQuestion();
            }, 200);
            
        }, 400); // Wait for button recreation
    }

    handleSameQuestionType() {
        console.log(`✨ Same question type: ${this.currentQuestionType} - smooth transition`);
        
        // Smooth content transition - no button recreation needed
        this.fadeOutCurrentContent();
        
        setTimeout(() => {
            // Update button numbers if needed (number format)
            if (this.shouldUseNumberFormat()) {
                this.updateButtonsForNumberFormat(this.currentAnswer);
            }
            
            this.setupQuestionElements();
            this.renderNewContent();
            
            setTimeout(() => {
                this.fadeInNewContent();
                this.finalizeNewQuestion();
            }, 100);
            
        }, 600); // Wait for fade out
    }

    fadeOutCurrentContent() {
        const currentContent = [...this.contentRenderer.currentContent];
        currentContent.forEach(element => {
            if (element) {
                element.classList.add('fade-out');
            }
        });
    }

    fadeInNewContent() {
        const newContent = [...this.contentRenderer.currentContent];
        newContent.forEach(element => {
            if (element) {
                element.classList.remove('fade-out');
                element.classList.add('fade-in');
            }
        });
        
        setTimeout(() => {
            newContent.forEach(element => {
                if (element) {
                    element.classList.remove('fade-in');
                }
            });
        }, 800);
    }

    setupQuestionElements() {
        this.setupInputBoxesForQuestion();
        this.resetButtonStates();
        this.buttonsDisabled = false;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(true);
        }
    }

    renderNewContent() {
        this.contentRenderer.renderContent(this.currentNumber, this.currentLevel);
    }

    finalizeNewQuestion() {
        this.showInputBoxes();
        this.giveStartingInstruction();
        this.startInactivityTimer();
    }

    resetQuestionState() {
        this.resetBoxState();
        this.hintGiven = false;
        this.hasAttemptedAnyAnswer = false;
        this.usedAnswersInCurrentQuestion.clear();
        this.resetKeyboardState();
    }

    generatePlusOneQuestion() {
        const levelNumbers = CONFIG.LEVELS[this.currentLevel].numbers;
        const availableNumbers = levelNumbers.filter(num => !this.usedNumbersInLevel.has(num));
        
        if (availableNumbers.length === 0) {
            this.usedNumbersInLevel.clear();
            this.currentNumber = levelNumbers[Math.floor(Math.random() * levelNumbers.length)];
        } else {
            this.currentNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        }
        
        this.usedNumbersInLevel.add(this.currentNumber);
        this.currentAnswer = this.currentNumber + 1;
    }

    setupInputBoxesForQuestion() {
        this.checkMark.classList.remove('visible');
        
        this.leftInputBox.textContent = '';
        this.rightInputBox.textContent = '';
        this.totalInputBox.textContent = '';
        
        this.leftInputBox.classList.remove('flashing', 'filled', 'fixed-one');
        this.rightInputBox.classList.remove('flashing', 'filled', 'fixed-one');
        this.totalInputBox.classList.remove('flashing', 'filled');
        
        if (this.shouldUsePictureFormat()) {
            this.leftFilled = false;
            this.rightFilled = false;
            this.totalFilled = false;
        } else {
            this.leftInputBox.textContent = this.currentNumber;
            this.leftInputBox.classList.add('filled');
            this.leftFilled = true;
            
            this.rightInputBox.textContent = '1';
            this.rightInputBox.classList.add('filled', 'fixed-one');
            this.rightFilled = true;
            
            this.totalFilled = false;
        }
        
        this.updateSumRowWidth();
    }

    updateSumRowWidth() {
        if (!this.sumRow) return;
        
        const leftDigits = this.currentNumber.toString().length;
        const rightDigits = 1;
        const totalDigits = this.currentAnswer.toString().length;
        
        const baseBoxSize = 'calc(var(--game-area-width) * 0.07)';
        let leftBoxWidth, totalBoxWidth;
        
        // PICTURE FORMAT: Keep all boxes same size
        if (this.shouldUsePictureFormat()) {
            leftBoxWidth = baseBoxSize;
            totalBoxWidth = baseBoxSize;
        } else {
            // NUMBER FORMAT: Size boxes based on digit count
            if (leftDigits === 1) {
                leftBoxWidth = baseBoxSize;
            } else if (leftDigits === 2) {
                leftBoxWidth = `calc(${baseBoxSize} * 1.4)`;
            } else {
                leftBoxWidth = `calc(${baseBoxSize} * 1.8)`;
            }
            
            if (totalDigits === 1) {
                totalBoxWidth = baseBoxSize;
            } else if (totalDigits === 2) {
                totalBoxWidth = `calc(${baseBoxSize} * 1.4)`;
            } else {
                totalBoxWidth = `calc(${baseBoxSize} * 1.8)`;
            }
        }
        
        this.leftInputBox.style.width = leftBoxWidth;
        this.rightInputBox.style.width = baseBoxSize;
        this.totalInputBox.style.width = totalBoxWidth;
        
        const boxHeight = baseBoxSize;
        const combinedBoxWidth = `calc(${leftBoxWidth} + ${baseBoxSize} + ${totalBoxWidth})`;
        const sumRowWidth = `calc(${combinedBoxWidth} + ${boxHeight} * 3.5)`;
        this.sumRow.style.width = sumRowWidth;
    }

    updateButtonsForNumberFormat(correctAnswer) {
        const options = new Set();
        
        options.add(correctAnswer);
        options.add(Math.max(1, this.currentNumber - 1));
        
        const levelNumbers = CONFIG.LEVELS[this.currentLevel].numbers;
        let randomFromLevel;
        let attempts = 0;
        do {
            randomFromLevel = levelNumbers[Math.floor(Math.random() * levelNumbers.length)] + 1;
            attempts++;
        } while (options.has(randomFromLevel) && attempts < 50);
        options.add(randomFromLevel);
        
        const bonusOptions = [this.currentNumber + 2, this.currentNumber + 3, this.currentNumber + 5, this.currentNumber + 10];
        let bonusChoice;
        attempts = 0;
        do {
            bonusChoice = bonusOptions[Math.floor(Math.random() * bonusOptions.length)];
            attempts++;
        } while (options.has(bonusChoice) && attempts < 20);
        options.add(bonusChoice);
        
        const shuffledOptions = Array.from(options).slice(0, 4);
        this.shuffleArray(shuffledOptions);
        
        if (window.ButtonBar) {
            window.ButtonBar.shuffleNumbers(shuffledOptions);
        }
        
        return shuffledOptions;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // EVENT LISTENERS AND INTERACTION HANDLING
    initializeEventListeners() {
        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });

        const keyboardHandler = (e) => {
            if (this.buttonsDisabled || this.gameComplete) return;
            
            if (!this.systemsReady) return;
            
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                console.log('⌨️ Keyboard digit accepted:', e.key);
                
                this.clearInactivityTimer();
                this.startInactivityTimer();
                
                const digit = parseInt(e.key);
                this.handleKeyboardDigit(digit);
            }
        };
        
        document.addEventListener('keydown', keyboardHandler);
        
        if (document.activeElement !== document.body) {
            document.body.focus();
        }
        
        this.keyboardHandler = keyboardHandler;
    }

    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            
            if (!this.isTabVisible) {
                this.clearInactivityTimer();
                if (window.AudioSystem) {
                    window.AudioSystem.stopAllAudio();
                }
            } else {
                if (!this.gameComplete && !this.buttonsDisabled && this.initializationComplete) {
                    this.startInactivityTimer();
                }
            }
        });
    }

    setupTouchProtection() {
        const gameAreaElements = [this.gameArea, this.leftSide, this.rightSide];
        
        gameAreaElements.forEach(element => {
            if (element) {
                element.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
                
                element.addEventListener('touchstart', (e) => {
                    if (e.target.closest('.number-btn, .back-button, .audio-button-container')) {
                        return;
                    }
                });
                
                element.addEventListener('touchend', (e) => {
                    if (e.target.closest('.number-btn, .back-button, .audio-button-container')) {
                        return;
                    }
                    e.preventDefault();
                });
            }
        });
    }

    // ENHANCED KEYBOARD ALGORITHM
    handleKeyboardDigit(digit) {
        const currentTime = Date.now();
        
        if (this.isTypingSequence && (currentTime - this.lastKeyTime) > CONFIG.MULTI_DIGIT_TIMEOUT) {
            this.resetKeyboardState();
        }
        
        this.lastKeyTime = currentTime;
        this.keyboardBuffer += digit.toString();
        this.isTypingSequence = true;
        
        console.log(`Keyboard buffer: "${this.keyboardBuffer}"`);
        
        this.clearKeyboardTimer();
        
        const availableAnswerSets = this.getAvailableAnswerSets();
        console.log(`Available answer sets: [${availableAnswerSets.join(', ')}]`);
        
        this.processKeyboardBufferWithAlgorithm(availableAnswerSets);
    }

    getAvailableAnswerSets() {
        const allValidAnswers = [];
        
        if (!this.leftFilled) {
            allValidAnswers.push(this.currentNumber);
        }
        if (!this.rightFilled) {
            allValidAnswers.push(1);
        }
        if (!this.totalFilled) {
            allValidAnswers.push(this.currentAnswer);
        }
        
        if (this.shouldUsePictureFormat()) {
            CONFIG.BUTTON_CONFIGS.PICTURE_FORMAT.numbers.forEach(num => {
                if (!allValidAnswers.includes(num)) {
                    allValidAnswers.push(num);
                }
            });
        } else {
            if (window.ButtonBar && window.ButtonBar.buttons) {
                window.ButtonBar.buttons.forEach(btn => {
                    const btnNumber = parseInt(btn.dataset.number);
                    if (!allValidAnswers.includes(btnNumber)) {
                        allValidAnswers.push(btnNumber);
                    }
                });
            }
        }
        
        const availableAnswers = [...new Set(allValidAnswers)]
            .filter(answer => !this.usedAnswersInCurrentQuestion.has(answer))
            .sort((a, b) => a - b);
            
        return availableAnswers;
    }

    processKeyboardBufferWithAlgorithm(availableAnswerSets) {
        const bufferLength = this.keyboardBuffer.length;
        const currentBufferNumber = parseInt(this.keyboardBuffer);
        
        // Step 1: Check for exact matches of current buffer length
        const exactMatches = availableAnswerSets.filter(answer => 
            answer.toString().length === bufferLength && 
            parseInt(answer.toString()) === currentBufferNumber
        );
        
        if (exactMatches.length > 0) {
            console.log(`✅ EXACT MATCH: Buffer "${this.keyboardBuffer}" matches ${bufferLength}-digit number`);
            this.submitKeyboardInput(currentBufferNumber);
            return;
        }
        
        // Step 2: Check if any longer numbers exist
        const longerNumbers = availableAnswerSets.filter(answer => 
            answer.toString().length > bufferLength
        );
        
        if (longerNumbers.length === 0) {
            console.log(`❌ NO LONGER NUMBERS: Submitting buffer`);
            this.submitKeyboardInput(currentBufferNumber);
            return;
        }
        
        // Step 3: Check if buffer matches start of any longer numbers
        const matchingPrefixes = longerNumbers.filter(answer => 
            answer.toString().startsWith(this.keyboardBuffer)
        );
        
        if (matchingPrefixes.length === 0) {
            console.log(`❌ NO PREFIX MATCHES: Submitting buffer`);
            this.submitKeyboardInput(currentBufferNumber);
            return;
        }
        
        // Buffer could lead to valid longer numbers - wait
        console.log(`⏳ WAITING: Could become: [${matchingPrefixes.join(', ')}]`);
        this.keyboardTimer = setTimeout(() => {
            const timeoutBufferValue = this.keyboardBuffer;
            const timeoutBufferNumber = parseInt(timeoutBufferValue);
            this.resetKeyboardState();
            
            if (!isNaN(timeoutBufferNumber)) {
                this.handleNumberClick(timeoutBufferNumber, null);
            }
        }, CONFIG.MULTI_DIGIT_TIMEOUT);
    }

    submitKeyboardInput(number) {
        this.resetKeyboardState();
        this.handleNumberClick(number, null);
    }

    resetKeyboardState() {
        this.keyboardBuffer = '';
        this.isTypingSequence = false;
        this.lastKeyTime = 0;
        this.clearKeyboardTimer();
    }

    clearKeyboardTimer() {
        if (this.keyboardTimer) {
            clearTimeout(this.keyboardTimer);
            this.keyboardTimer = null;
        }
    }

    // GAME INTERACTION HANDLING
    handleNumberClick(selectedNumber, buttonElement) {
        this.clearKeyboardTimer();
        
        let correctAnswer = false;
        
        if (!this.leftFilled && selectedNumber === this.currentNumber) {
            this.fillBox('left', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.rightFilled && selectedNumber === 1) {
            this.fillBox('right', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.totalFilled && selectedNumber === this.currentAnswer) {
            this.fillBox('total', selectedNumber, buttonElement);
            correctAnswer = true;
        }
        
        if (correctAnswer) {
            this.usedAnswersInCurrentQuestion.add(selectedNumber);
            console.log(`✅ Used answer: ${selectedNumber}. Used: [${Array.from(this.usedAnswersInCurrentQuestion).join(', ')}]`);
            this.checkQuestionCompletion();
        } else {
            this.handleIncorrectAnswer(buttonElement, selectedNumber);
        }
    }

    fillBox(boxType, selectedNumber, buttonElement) {
        if (!buttonElement && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.animateButton(buttonElement, 'correct');
        }

        this.playCompletionSound();

        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.createCelebrationStars(buttonElement);
        }

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

        const boxesFilledBefore = [this.leftFilled, this.rightFilled, this.totalFilled].filter(Boolean).length - 1;
        const wasLastBox = boxesFilledBefore === 2;
        
        if (wasLastBox) {
            this.buttonsDisabled = true;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(false);
            }
        }

        if (!wasLastBox) {
            this.updateFlashingBoxes();
        }
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
        const questionComplete = this.leftFilled && this.totalFilled;
        
        if (questionComplete) {
            this.clearInactivityTimer();
            this.stopFlashing();
            
            this.checkMark.classList.add('visible');
            
            const wasFirstAttempt = !this.hasAttemptedAnyAnswer;
            this.handleLevelProgression(wasFirstAttempt);
            
            const pieces = this.rainbow.addPiece();
            
            if (this.shouldUsePictureFormat() || wasFirstAttempt) {
                this.giveCompletionFeedback(wasFirstAttempt);
            }
            
            this.questionsCompleted++;
            
            if (this.rainbow.isComplete()) {
                setTimeout(() => {
                    this.completeGame();
                }, 3000);
                return;
            }

            const delay = this.shouldUsePictureFormat() ? 3000 : 1500;
            setTimeout(() => {
                this.startNewQuestion(); // This now handles smooth transitions
            }, delay);
        }
    }

    giveCompletionFeedback(wasFirstAttempt = true) {
        if (this.shouldUsePictureFormat()) {
            const encouragements = CONFIG.AUDIO.ENCOURAGEMENTS;
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            
            this.speakText(randomEncouragement);
            
            setTimeout(() => {
                const sumMessage = CONFIG.AUDIO.SUM_REPETITION(this.currentNumber, this.currentAnswer);
                this.speakText(sumMessage);
            }, 1500);
        } else {
            const encouragements = CONFIG.AUDIO.ENCOURAGEMENTS;
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            this.speakText(randomEncouragement);
        }
    }

    handleLevelProgression(wasFirstAttempt) {
        const oldLevel = this.currentLevel;
        
        if (wasFirstAttempt) {
            if (this.currentLevel < 10) {
                this.currentLevel++;
            }
            this.failedAtCurrentLevel = false;
        } else {
            if (this.failedAtCurrentLevel) {
                if (this.currentLevel > 1) {
                    this.currentLevel--;
                }
                this.failedAtCurrentLevel = false;
            } else {
                this.failedAtCurrentLevel = true;
            }
        }
    }

    handleIncorrectAnswer(buttonElement, selectedNumber) {
        if (!buttonElement && selectedNumber && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        this.hasAttemptedAnyAnswer = true;
        this.clearInactivityTimer();
        this.playFailureSound();
        
        if (this.isTabVisible) {
            setTimeout(() => {
                    this.speakText(CONFIG.AUDIO.NUMBER_HINTS.WHAT_COMES_AFTER(this.currentNumber));
                } else {
                    this.speakText(CONFIG.AUDIO.TRY_AGAIN);
                }
            }, 800);
        }
        
        this.buttonsDisabled = true;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(false);
        }
        
        this.stopFlashing();
        
        if (window.ButtonBar) {
            window.ButtonBar.showIncorrectFeedback(selectedNumber, buttonElement);
        }

        if (buttonElement) {
            buttonElement.dataset.attempted = 'true';
        }
        
        setTimeout(() => {
            this.buttonsDisabled = false;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(true);
            }
            this.startFlashing();
            this.startInactivityTimer();
        }, 2100);
    }

    resetButtonStates() {
        this.buttonsDisabled = false;
        
        if (window.ButtonBar && window.ButtonBar.buttons) {
            window.ButtonBar.setButtonsEnabled(true);
            window.ButtonBar.buttons.forEach(btn => {
                btn.dataset.attempted = 'false';
                btn.classList.remove('correct', 'incorrect');
                btn.style.opacity = '1';
                btn.style.transition = '';
                
                window.ButtonBar.removeCrossOverlay(btn);
            });
        }
    }

    // AUDIO AND INTERACTION HELPERS
    speakText(text, options = {}) {
        if (window.AudioSystem) {
            window.AudioSystem.speakText(text, options);
        }
    }

    playCompletionSound() {
        if (window.AudioSystem) {
            window.AudioSystem.playCompletionSound();
        }
    }

    playFailureSound() {
        if (window.AudioSystem) {
            window.AudioSystem.playFailureSound();
        }
    }

    giveStartingInstruction() {
        if (!window.AudioSystem || !this.isTabVisible || !this.initializationComplete) return;
        
        setTimeout(() => {
            if (this.shouldUsePictureFormat()) {
                if (this.questionsCompleted === 0) {
                    this.speakText(CONFIG.AUDIO.FIRST_QUESTION);
                } else if (this.questionsCompleted === 1) {
                    this.speakText(CONFIG.AUDIO.SECOND_QUESTION);
                } else {
                    this.speakText(CONFIG.AUDIO.LATER_QUESTIONS);
                }
            } else {
                this.speakText(CONFIG.AUDIO.NUMBER_FORMAT_QUESTION(this.currentNumber));
            }
        }, 500);
    }

    // INACTIVITY AND HINT SYSTEM
    startInactivityTimer() {
        if (!this.isTabVisible || this.hintGiven || !this.initializationComplete) {
            return;
        }
        
        this.clearInactivityTimer();
        this.inactivityTimer = setTimeout(() => {
            this.giveInactivityHint();
        }, CONFIG.INACTIVITY_DURATION);
    }

    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    giveInactivityHint() {
        if (this.buttonsDisabled || this.gameComplete || !this.isTabVisible || !this.initializationComplete) return;
        
        this.hintGiven = true;
        
        let hintText = '';
        if (this.shouldUsePictureFormat()) {
            if (!this.leftFilled) {
                hintText = CONFIG.AUDIO.HINTS.COUNT_LEFT;
            } else if (!this.rightFilled) {
                hintText = CONFIG.AUDIO.HINTS.COUNT_RIGHT;
            } else if (!this.totalFilled) {
                hintText = CONFIG.AUDIO.HINTS.WHAT_IS_PLUS_ONE(this.currentNumber);
            }
        } else {
            if (!this.totalFilled) {
                hintText = CONFIG.AUDIO.NUMBER_HINTS.WHAT_COMES_AFTER(this.currentNumber);
            }
        }
        
        if (hintText) {
            this.speakText(hintText);
        }
    }

    // FLASHING SYSTEM
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

    startFlashing() {
        this.stopFlashing();
        
        const flashElements = () => {
            if (this.shouldUsePictureFormat()) {
                if (!this.leftFilled) {
                    if (this.leftPulseArea) this.leftPulseArea.classList.add('area-flash');
                    if (this.leftInputBox) this.leftInputBox.classList.add('box-flash');
                } else if (!this.rightFilled) {
                    if (this.rightPulseArea) this.rightPulseArea.classList.add('area-flash');
                    if (this.rightInputBox) this.rightInputBox.classList.add('box-flash');
                } else if (!this.totalFilled) {
                    if (this.leftPulseArea) this.leftPulseArea.classList.add('area-flash');
                    if (this.rightPulseArea) this.rightPulseArea.classList.add('area-flash');
                    if (this.totalInputBox) this.totalInputBox.classList.add('box-flash');
                }
            } else {
                if (!this.totalFilled) {
                    if (this.leftPulseArea) this.leftPulseArea.classList.add('area-flash');
                    if (this.rightPulseArea) this.rightPulseArea.classList.add('area-flash');
                    if (this.totalInputBox) this.totalInputBox.classList.add('box-flash');
                }
            }
            
            setTimeout(() => {
                if (this.leftPulseArea) this.leftPulseArea.classList.remove('area-flash');
                if (this.rightPulseArea) this.rightPulseArea.classList.remove('area-flash');
                if (this.leftInputBox) this.leftInputBox.classList.remove('box-flash');
                if (this.rightInputBox) this.rightInputBox.classList.remove('box-flash');
                if (this.totalInputBox) this.totalInputBox.classList.remove('box-flash');
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
        
        if (this.leftPulseArea) this.leftPulseArea.classList.remove('area-flash');
        if (this.rightPulseArea) this.rightPulseArea.classList.remove('area-flash');
        if (this.leftInputBox) this.leftInputBox.classList.remove('box-flash');
        if (this.rightInputBox) this.rightInputBox.classList.remove('box-flash');
        if (this.totalInputBox) this.totalInputBox.classList.remove('box-flash');
    }

    resetBoxState() {
        this.leftFilled = false;
        this.rightFilled = false;
        this.totalFilled = false;
        this.stopFlashing();
    }

    // GAME MANAGEMENT
    startNewGame() {
        const oldLevel = this.currentLevel;
        
        this.currentLevel = Math.min(this.currentLevel, 5);
        console.log(`New game: Starting at level ${this.currentLevel}`);
        
        this.questionsCompleted = 0;
        this.gameComplete = false;
        this.usedNumbersInLevel.clear();
        this.failedAtCurrentLevel = false;
        this.clearInactivityTimer();
        this.resetKeyboardState();
        this.resetBoxState();
        this.usedAnswersInCurrentQuestion.clear();
        
        // Reset question type tracking for new game
        this.currentQuestionType = null;
        this.previousQuestionType = null;
        
        this.rainbow.reset();
        this.bear.reset();
        this.contentRenderer.reset();
        this.modal.classList.add('hidden');
        
        this.initializationComplete = true;
        
        // Always recreate buttons for new game
        this.createButtons();
        
        setTimeout(() => {
            this.startNewQuestion();
        }, 200);
    }

    completeGame() {
        this.gameComplete = true;
        this.clearInactivityTimer();
        this.resetKeyboardState();
        this.stopFlashing();
        this.modal.classList.remove('hidden');
        
        this.bear.startCelebration();
        
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText(CONFIG.AUDIO.GAME_COMPLETE);
            }, 1000);
        }
    }

    destroy() {
        this.clearInactivityTimer();
        this.resetKeyboardState();
        
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        
        this.rainbow.reset();
        this.bear.reset();
        this.contentRenderer.reset();
        
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 DOM loaded, creating PlusOneGameController (Complete Rewrite)');
    window.plusOneGame = new PlusOneGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.plusOneGame) {
        window.plusOneGame.destroy();
    }
});
