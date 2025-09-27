class PlusOneGameLogic {
    constructor(controller) {
        this.controller = controller;
        
        // Enhanced keyboard handling with fixed algorithm
        this.keyboardBuffer = '';
        this.keyboardTimer = null;
        this.lastKeyTime = 0;
        this.isTypingSequence = false;
        this.usedAnswersInCurrentQuestion = new Set();
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.hintGiven = false;
        
        console.log('🎮 Game Logic initialized');
    }

    // ===== QUESTION GENERATION AND MANAGEMENT =====
    
    startNewQuestion() {
        if (this.controller.gameComplete) return;
        
        if (!this.controller.systemsReady) {
            setTimeout(() => this.startNewQuestion(), 100);
            return;
        }

        // Track question types for smooth transitions
        this.controller.previousQuestionType = this.controller.currentQuestionType;
        this.controller.currentQuestionType = this.controller.shouldUsePictureFormat() ? 'picture' : 'number';
        
        this.controller.resetQuestionState();
        this.generateQuestion();
        
        console.log(`🎮 NEW QUESTION: ${this.controller.currentNumber} ${this.controller.getOperatorSymbol()} ${this.controller.getOperatorValue()} = ${this.controller.currentAnswer}, Level: ${this.controller.currentLevel}, Mode: ${this.controller.gameMode}`);
        
        // Update sum row operator display
        this.updateSumRowOperator();
        
        // Handle transitions based on question type changes
        if (this.controller.previousQuestionType !== this.controller.currentQuestionType) {
            // Different question types - need button recreation
            this.handleQuestionTypeChange();
        } else {
            // Same question type - smooth content update only
            this.handleSameQuestionType();
        }
    }

    generateQuestion() {
        const levelNumbers = this.controller.getCurrentLevels()[this.controller.currentLevel].numbers;
        const availableNumbers = levelNumbers.filter(num => !this.controller.usedNumbersInLevel.has(num));
        
        if (availableNumbers.length === 0) {
            this.controller.usedNumbersInLevel.clear();
            this.controller.currentNumber = levelNumbers[Math.floor(Math.random() * levelNumbers.length)];
        } else {
            this.controller.currentNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        }
        
        this.controller.usedNumbersInLevel.add(this.controller.currentNumber);
        this.controller.currentAnswer = this.controller.calculateAnswer(this.controller.currentNumber);
    }

    updateSumRowOperator() {
        // Update the operator symbol in the sum row
        const operatorElement = this.controller.sumRow.querySelector('.sum-plus-sign');
        if (operatorElement) {
            operatorElement.textContent = this.controller.getOperatorSymbol();
        }
    }

    handleQuestionTypeChange() {
        console.log(`🔄 Question type change: ${this.controller.previousQuestionType} → ${this.controller.currentQuestionType}`);
        
        // Fade out only the content that needs to change
        this.controller.uiManager.fadeOutChangingElements();
        
        // Recreate buttons for new format
        this.controller.createButtons();
        
        setTimeout(() => {
            // Update buttons for number format
            if (this.controller.shouldUseNumberFormat()) {
                this.updateButtonsForNumberFormat(this.controller.currentAnswer);
            }
            
            this.setupQuestionElements();
            this.renderNewContent();
            
            setTimeout(() => {
                this.controller.uiManager.fadeInChangingElements();
                this.finalizeNewQuestion();
            }, 200);
            
        }, 400); // Wait for button recreation
    }

    handleSameQuestionType() {
        console.log(`✨ Same question type: ${this.controller.currentQuestionType} - smooth transition`);
        
        // Smooth content transition - no button recreation needed
        this.controller.uiManager.fadeOutChangingElements();
        
        setTimeout(() => {
            // Update button numbers if needed (number format)
            if (this.controller.shouldUseNumberFormat()) {
                this.updateButtonsForNumberFormat(this.controller.currentAnswer);
            }
            
            this.setupQuestionElements();
            this.renderNewContent();
            
            setTimeout(() => {
                this.controller.uiManager.fadeInChangingElements();
                this.finalizeNewQuestion();
            }, 100);
            
        }, 600); // Wait for fade out
    }

    setupQuestionElements() {
        this.setupInputBoxesForQuestion();
        this.resetButtonStates();
        this.controller.buttonsDisabled = false;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(true);
        }
    }

    renderNewContent() {
        this.controller.contentRenderer.renderContent(this.controller.currentNumber, this.controller.currentLevel, this.controller.gameMode);
    }

    finalizeNewQuestion() {
        this.controller.uiManager.showInputBoxes();
        this.giveStartingInstruction();
        this.controller.uiManager.startInactivityTimer();
    }

    // ===== INPUT BOX MANAGEMENT =====
    
    setupInputBoxesForQuestion() {
        this.controller.checkMark.classList.remove('visible');
        
        this.controller.leftInputBox.textContent = '';
        this.controller.rightInputBox.textContent = '';
        this.controller.totalInputBox.textContent = '';
        
        this.controller.leftInputBox.classList.remove('flashing', 'filled', 'fixed-one');
        this.controller.rightInputBox.classList.remove('flashing', 'filled', 'fixed-one');
        this.controller.totalInputBox.classList.remove('flashing', 'filled');
        
        if (this.controller.shouldUsePictureFormat()) {
            this.controller.leftFilled = false;
            this.controller.rightFilled = false;
            this.controller.totalFilled = false;
        } else {
            this.controller.leftInputBox.textContent = this.controller.currentNumber;
            this.controller.leftInputBox.classList.add('filled');
            this.controller.leftFilled = true;
            
            this.controller.rightInputBox.textContent = this.controller.getOperatorValue();
            this.controller.rightInputBox.classList.add('filled', 'fixed-one');
            this.controller.rightFilled = true;
            
            this.controller.totalFilled = false;
        }
        
        this.updateSumRowWidth();
    }

    updateSumRowWidth() {
        if (!this.controller.sumRow) return;
        
        const leftDigits = this.controller.currentNumber.toString().length;
        const rightDigits = this.controller.getOperatorValue().toString().length;
        const totalDigits = this.controller.currentAnswer.toString().length;
        
        const baseBoxSize = 'calc(var(--game-area-width) * 0.07)';
        let leftBoxWidth, rightBoxWidth, totalBoxWidth;
        
        // PICTURE FORMAT: Keep all boxes same size
        if (this.controller.shouldUsePictureFormat()) {
            leftBoxWidth = baseBoxSize;
            rightBoxWidth = baseBoxSize;
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
            
            if (rightDigits === 1) {
                rightBoxWidth = baseBoxSize;
            } else {
                rightBoxWidth = `calc(${baseBoxSize} * 1.4)`;
            }
            
            if (totalDigits === 1) {
                totalBoxWidth = baseBoxSize;
            } else if (totalDigits === 2) {
                totalBoxWidth = `calc(${baseBoxSize} * 1.4)`;
            } else {
                totalBoxWidth = `calc(${baseBoxSize} * 1.8)`;
            }
        }
        
        this.controller.leftInputBox.style.width = leftBoxWidth;
        this.controller.rightInputBox.style.width = rightBoxWidth;
        this.controller.totalInputBox.style.width = totalBoxWidth;
        
        const boxHeight = baseBoxSize;
        const combinedBoxWidth = `calc(${leftBoxWidth} + ${rightBoxWidth} + ${totalBoxWidth})`;
        const sumRowWidth = `calc(${combinedBoxWidth} + ${boxHeight} * 3.5)`;
        this.controller.sumRow.style.width = sumRowWidth;
    }

    // ===== BUTTON MANAGEMENT FOR NUMBER FORMAT =====
    
    updateButtonsForNumberFormat(correctAnswer) {
        const options = new Set();
        
        options.add(correctAnswer);
        
        // Add contextually appropriate wrong answers based on game mode
        if (this.controller.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
            options.add(this.controller.currentNumber); // Original number
            options.add(Math.max(0, this.controller.currentNumber - 2)); // Two less
        } else if (this.controller.gameMode === CONFIG.GAME_MODES.PLUS_TWO) {
            // Plus Two: 2 more (correct), random choice of 1 more or 3 more, random choice of 1 less or 2 less, random other
            const oneOrThreeMore = Math.random() < 0.5 ? 
                this.controller.currentNumber + 1 : this.controller.currentNumber + 3;
            const oneOrTwoLess = Math.random() < 0.5 ? 
                Math.max(0, this.controller.currentNumber - 1) : Math.max(0, this.controller.currentNumber - 2);
            
            options.add(oneOrThreeMore);
            options.add(oneOrTwoLess);
        } else {
            // Plus One: 1 more (correct), 2 more, 1 less, random other
            options.add(Math.max(1, this.controller.currentNumber - 1)); // One less
            options.add(this.controller.currentNumber + 2); // Two more
        }
        
        // Add a random number from current level if we need more options
        const levelNumbers = this.controller.getCurrentLevels()[this.controller.currentLevel].numbers;
        let randomFromLevel;
        let attempts = 0;
        do {
            const randomBase = levelNumbers[Math.floor(Math.random() * levelNumbers.length)];
            randomFromLevel = this.controller.calculateAnswer(randomBase);
            attempts++;
        } while (options.has(randomFromLevel) && attempts < 50);
        options.add(randomFromLevel);
        
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

    resetButtonStates() {
        this.controller.buttonsDisabled = false;
        
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

    // ===== KEYBOARD INPUT HANDLING =====
    
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
        
        const unfilledBoxAnswers = this.getUnfilledBoxAnswers();
        console.log(`Unfilled box answers: [${unfilledBoxAnswers.join(', ')}]`);
        
        this.processKeyboardBufferWithFixedAlgorithm(unfilledBoxAnswers);
        
        this.controller.uiManager.clearInactivityTimer();
        this.controller.uiManager.startInactivityTimer();
    }

    getUnfilledBoxAnswers() {
        const answers = [];
        
        // Only include answers for unfilled boxes
        if (!this.controller.leftFilled) {
            answers.push(this.controller.currentNumber);
        }
        if (!this.controller.rightFilled) {
            answers.push(this.controller.getOperatorValue());
        }
        if (!this.controller.totalFilled) {
            answers.push(this.controller.currentAnswer);
        }
        
        // Remove already used answers in current question
        return answers.filter(answer => !this.usedAnswersInCurrentQuestion.has(answer));
    }

    processKeyboardBufferWithFixedAlgorithm(availableAnswers) {
        const bufferLength = this.keyboardBuffer.length;
        const currentBufferNumber = parseInt(this.keyboardBuffer);
        
        // Step 1: Check for exact matches of current buffer length
        const exactMatches = availableAnswers.filter(answer => 
            answer.toString().length === bufferLength && 
            parseInt(answer.toString()) === currentBufferNumber
        );
        
        if (exactMatches.length > 0) {
            console.log(`✅ EXACT MATCH: Buffer "${this.keyboardBuffer}" matches ${bufferLength}-digit number`);
            this.submitKeyboardInput(currentBufferNumber);
            return;
        }
        
        // Step 2: Check if any longer numbers exist
        const longerNumbers = availableAnswers.filter(answer => 
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

    // ===== ANSWER HANDLING =====
    
    handleNumberClick(selectedNumber, buttonElement) {
        this.clearKeyboardTimer();
        
        let correctAnswer = false;
        
        if (!this.controller.leftFilled && selectedNumber === this.controller.currentNumber) {
            this.fillBox('left', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.controller.rightFilled && selectedNumber === this.controller.getOperatorValue()) {
            this.fillBox('right', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.controller.totalFilled && selectedNumber === this.controller.currentAnswer) {
            this.fillBox('total', selectedNumber, buttonElement);
            correctAnswer = true;
        }
        
        // Record first attempt
        if (!this.controller.hasAttemptedAnyAnswer) {
            this.controller.hasAttemptedAnyAnswer = true;
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

        this.controller.uiManager.playCompletionSound();

        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.createCelebrationStars(buttonElement);
        }

        switch (boxType) {
            case 'left':
                this.controller.leftInputBox.textContent = selectedNumber;
                this.controller.leftInputBox.classList.remove('flashing');
                this.controller.leftInputBox.classList.add('filled');
                this.controller.leftFilled = true;
                break;
            case 'right':
                this.controller.rightInputBox.textContent = selectedNumber;
                this.controller.rightInputBox.classList.remove('flashing');
                this.controller.rightInputBox.classList.add('filled');
                this.controller.rightFilled = true;
                break;
            case 'total':
                this.controller.totalInputBox.textContent = selectedNumber;
                this.controller.totalInputBox.classList.remove('flashing');
                this.controller.totalInputBox.classList.add('filled');
                this.controller.totalFilled = true;
                break;
        }

        const boxesFilledBefore = [this.controller.leftFilled, this.controller.rightFilled, this.controller.totalFilled].filter(Boolean).length - 1;
        const wasLastBox = boxesFilledBefore === 2;
        
        if (wasLastBox) {
            this.controller.buttonsDisabled = true;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(false);
            }
        }

        if (!wasLastBox) {
            this.controller.uiManager.updateFlashingBoxes();
        }
    }

    handleIncorrectAnswer(buttonElement, selectedNumber) {
        if (!buttonElement && selectedNumber && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        this.controller.hasAttemptedAnyAnswer = true;
        this.controller.uiManager.clearInactivityTimer();
        this.controller.uiManager.playFailureSound();
        
        const audioConfig = this.controller.getCurrentAudio();
        
        if (this.controller.uiManager.isTabVisible) {
            setTimeout(() => {
                if (this.controller.shouldUseNumberFormat()) {
                    let hintMessage;
                    if (this.controller.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
                        hintMessage = audioConfig.NUMBER_HINTS.WHAT_COMES_BEFORE(this.controller.currentNumber);
                    } else if (this.controller.gameMode === CONFIG.GAME_MODES.PLUS_TWO) {
                        hintMessage = audioConfig.NUMBER_HINTS.WHAT_COMES_AFTER_TWO(this.controller.currentNumber);
                    } else {
                        hintMessage = audioConfig.NUMBER_HINTS.WHAT_COMES_AFTER(this.controller.currentNumber);
                    }
                    this.controller.uiManager.speakText(hintMessage);
                } else {
                    this.controller.uiManager.speakText(CONFIG.AUDIO.TRY_AGAIN);
                }
            }, 800);
        }
        
        this.controller.buttonsDisabled = true;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(false);
        }
        
        this.controller.uiManager.stopFlashing();
        
        if (window.ButtonBar) {
            window.ButtonBar.showIncorrectFeedback(selectedNumber, buttonElement);
        }

        if (buttonElement) {
            buttonElement.dataset.attempted = 'true';
        }
        
        setTimeout(() => {
            this.controller.buttonsDisabled = false;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(true);
            }
            this.controller.uiManager.startFlashing();
            this.controller.uiManager.startInactivityTimer();
        }, 2100);
    }

    checkQuestionCompletion() {
        const questionComplete = this.controller.leftFilled && this.controller.totalFilled;
        
        if (questionComplete) {
            this.controller.uiManager.clearInactivityTimer();
            this.controller.uiManager.stopFlashing();
            
            this.controller.checkMark.classList.add('visible');
            
            const wasFirstAttempt = !this.controller.hasAttemptedAnyAnswer;
            this.handleLevelProgression(wasFirstAttempt);
            
            const pieces = this.controller.rainbow.addPiece();
            
            if (this.controller.shouldUsePictureFormat() || wasFirstAttempt) {
                this.giveCompletionFeedback(wasFirstAttempt);
            }
            
            this.controller.questionsCompleted++;
            
            // Save current level progress
            this.controller.saveCurrentLevel();
            
            if (this.controller.rainbow.isComplete()) {
                setTimeout(() => {
                    this.controller.completeGame();
                }, 3000);
                return;
            }

            const delay = this.controller.shouldUsePictureFormat() ? 3000 : 1500;
            setTimeout(() => {
                this.startNewQuestion();
            }, delay);
        }
    }

    handleLevelProgression(wasFirstAttempt) {
        const oldLevel = this.controller.currentLevel;
        
        if (wasFirstAttempt) {
            if (this.controller.currentLevel < 10) {
                this.controller.currentLevel++;
                console.log(`📈 Level progression: ${oldLevel} → ${this.controller.currentLevel} (first attempt success)`);
            }
            this.controller.failedAtCurrentLevel = false;
        } else {
            if (this.controller.failedAtCurrentLevel) {
                if (this.controller.currentLevel > 1) {
                    this.controller.currentLevel--;
                    console.log(`📉 Level regression: ${oldLevel} → ${this.controller.currentLevel} (redemption system)`);
                }
                this.controller.failedAtCurrentLevel = false;
            } else {
                this.controller.failedAtCurrentLevel = true;
                console.log(`⚠️ Failed at level ${this.controller.currentLevel}, marked for potential regression`);
            }
        }
        
        // Log level transition information
        const newLevelConfig = this.controller.getCurrentLevels()[this.controller.currentLevel];
        const willUsePictureFormat = CONFIG.usesPictureFormat(this.controller.currentLevel, this.controller.gameMode);
        console.log(`🎯 Next level ${this.controller.currentLevel}: ${newLevelConfig.name}, Format: ${willUsePictureFormat ? 'Pictures' : 'Numbers'}`);
    }

    giveCompletionFeedback(wasFirstAttempt = true) {
        const audioConfig = this.controller.getCurrentAudio();
        
        if (this.controller.shouldUsePictureFormat()) {
            const encouragements = CONFIG.AUDIO.ENCOURAGEMENTS;
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            
            this.controller.uiManager.speakText(randomEncouragement);
            
            setTimeout(() => {
                const sumMessage = audioConfig.SUM_REPETITION(this.controller.currentNumber, this.controller.currentAnswer);
                this.controller.uiManager.speakText(sumMessage);
            }, 1500);
        } else {
            const encouragements = CONFIG.AUDIO.ENCOURAGEMENTS;
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            this.controller.uiManager.speakText(randomEncouragement);
        }
    }

    giveStartingInstruction() {
        if (!window.AudioSystem || !this.controller.uiManager.isTabVisible || !this.controller.initializationComplete) return;
        
        const audioConfig = this.controller.getCurrentAudio();
        
        setTimeout(() => {
            if (this.controller.shouldUsePictureFormat()) {
                if (this.controller.questionsCompleted === 0) {
                    this.controller.uiManager.speakText(audioConfig.FIRST_QUESTION);
                } else if (this.controller.questionsCompleted === 1) {
                    this.controller.uiManager.speakText(audioConfig.SECOND_QUESTION);
                } else {
                    this.controller.uiManager.speakText(audioConfig.LATER_QUESTIONS);
                }
            } else {
                // For number format questions
                if (this.controller.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
                    if (this.controller.questionsCompleted === 0) {
                        this.controller.uiManager.speakText(audioConfig.FIRST_NUMBER_FORMAT_QUESTION(this.controller.currentNumber));
                    } else {
                        const randomQuestions = audioConfig.NUMBER_FORMAT_QUESTIONS;
                        const randomQuestion = randomQuestions[Math.floor(Math.random() * randomQuestions.length)];
                        this.controller.uiManager.speakText(randomQuestion(this.controller.currentNumber));
                    }
                } else {
                    // Plus One and Plus Two use the same format
                    this.controller.uiManager.speakText(audioConfig.NUMBER_FORMAT_QUESTION(this.controller.currentNumber));
                }
            }
        }, 500);
    }
}
