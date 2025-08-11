class MultiDiceGameController {
    constructor() {
        // Initialize components in proper order
        this.diceRenderer = new MultiDiceRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        this.stats = new TwoDiceStats();
        
        // Game state
        this.questionsCompleted = 0;
        this.gameComplete = false;
        this.currentMode = CONFIG.GAME_MODES.TWO_DICE; // Start with 2 dice
        
        // Level-based system
        this.currentLevel = 'L1'; // Always start at L1
        this.usedSumsThisRound = new Set(); // Track used combinations for current round
        this.roundQuestionCount = 0; // Questions completed in current round
        
        // Current question state
        this.currentValues = []; // Array of dice values
        this.currentTotal = 0;
        this.buttonsDisabled = false;
        
        // Track which boxes are filled
        this.filledBoxes = new Set(); // Track by position key
        
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
        
        // Loading state and initialization tracking
        this.isLoading = true;
        this.initializationComplete = false;
        this.buttonBarReady = false;
        this.gameAreaReady = false;
        
        // DOM elements
        this.modal = document.getElementById('gameModal');
        this.gameArea = document.querySelector('.game-area');
        this.sumRow = document.getElementById('sumRow');
        
        // Stats display elements
        this.statsDisplay = {
            accuracy: document.getElementById('accuracyStat'),
            resilience: document.getElementById('resilienceStat'),
            speed: document.getElementById('speedStat'),
            variety: document.getElementById('varietyStat'),
            questions: document.getElementById('questionsStat')
        };
        
        // Update stats display periodically
        this.statsUpdateInterval = setInterval(() => {
            this.updateStatsDisplay();
        }, 1000);
        
        // Initialize in proper order
        this.initializeEventListeners();
        this.setupVisibilityHandling();
        this.waitForSystemsAndInitialize();
        
        console.log(`🎮 Game started in ${this.currentMode} mode at ${this.currentLevel}: ${this.getLevelDescription(this.currentLevel)}`);
    }

    /**
     * Set the current game mode and update renderer
     */
    setGameMode(mode) {
        this.currentMode = mode;
        this.diceRenderer.setGameMode(mode);
        this.updateSumRow();
        console.log(`🎯 Game mode set to: ${mode}`);
    }

    /**
     * Get human-readable description of level
     */
    getLevelDescription(level) {
        const descriptions = {
            L1: 'Easy (1-3)',
            L2: 'Medium (2-4)', 
            L3: 'Hard (1-6)'
        };
        return descriptions[level] || level;
    }

    /**
     * Update level based on question performance
     */
    updateLevel(wasCorrectFirstAttempt) {
        const levels = ['L1', 'L2', 'L3'];
        const currentIndex = levels.indexOf(this.currentLevel);
        
        if (wasCorrectFirstAttempt && currentIndex < levels.length - 1) {
            // Level up for correct first attempt
            this.currentLevel = levels[currentIndex + 1];
            console.log(`📈 Level up to ${this.currentLevel}: ${this.getLevelDescription(this.currentLevel)}`);
        } else if (!wasCorrectFirstAttempt && currentIndex > 0) {
            // Level down for any mistake
            this.currentLevel = levels[currentIndex - 1];
            console.log(`📉 Level down to ${this.currentLevel}: ${this.getLevelDescription(this.currentLevel)}`);
        } else {
            console.log(`📊 Level remains ${this.currentLevel}: ${this.getLevelDescription(this.currentLevel)}`);
        }
    }

    /**
     * Create and update sum row based on current mode
     */
    updateSumRow() {
        if (!this.sumRow) return;
        
        const config = CONFIG.SUM_BAR_CONFIG[this.currentMode.toUpperCase().replace('_', '_')];
        if (!config) return;
        
        // Clear existing content
        this.sumRow.innerHTML = '';
        
        // Create input boxes and symbols
        for (let i = 0; i < config.boxes; i++) {
            // Create input box
            const inputBox = document.createElement('div');
            inputBox.className = 'input-box dice-input-box';
            inputBox.id = `diceInput${i}`;
            inputBox.dataset.position = config.inputOrder[i];
            this.sumRow.appendChild(inputBox);
            
            // Add plus sign (except after last box)
            if (i < config.boxes - 1) {
                const plusSign = document.createElement('div');
                plusSign.className = 'sum-plus-sign';
                plusSign.textContent = '+';
                this.sumRow.appendChild(plusSign);
            }
        }
        
        // Add equals sign
        const equalsSign = document.createElement('div');
        equalsSign.className = 'sum-equals-sign';
        equalsSign.textContent = '=';
        this.sumRow.appendChild(equalsSign);
        
        // Add total input box
        const totalBox = document.createElement('div');
        totalBox.className = 'input-box dice-input-box';
        totalBox.id = 'totalInputBox';
        totalBox.dataset.position = 'total';
        this.sumRow.appendChild(totalBox);
        
        // Add check mark
        const checkMark = document.createElement('div');
        checkMark.className = 'check-mark';
        checkMark.id = 'checkMark';
        checkMark.innerHTML = '✓';
        this.sumRow.appendChild(checkMark);
    }

    /**
     * Get the appropriate hint message for current mode and position
     */
    getHintMessage(position) {
        const messages = {
            left: CONFIG.AUDIO.MESSAGES.HINT_LEFT_DICE,
            right: CONFIG.AUDIO.MESSAGES.HINT_RIGHT_DICE,
            bottom: CONFIG.AUDIO.MESSAGES.HINT_BOTTOM_DICE,
            topLeft: CONFIG.AUDIO.MESSAGES.HINT_TOP_LEFT_DICE,
            topRight: CONFIG.AUDIO.MESSAGES.HINT_TOP_RIGHT_DICE,
            bottomLeft: CONFIG.AUDIO.MESSAGES.HINT_BOTTOM_LEFT_DICE,
            bottomRight: CONFIG.AUDIO.MESSAGES.HINT_BOTTOM_RIGHT_DICE
        };
        
        return messages[position] || CONFIG.AUDIO.MESSAGES.HINT_LEFT_DICE;
    }

    /**
     * Get the appropriate total hint for current mode
     */
    getTotalHint() {
        switch (this.currentMode) {
            case CONFIG.GAME_MODES.TWO_DICE:
                return CONFIG.AUDIO.MESSAGES.HINT_TOTAL;
            case CONFIG.GAME_MODES.THREE_DICE:
                return CONFIG.AUDIO.MESSAGES.HINT_TOTAL_THREE;
            case CONFIG.GAME_MODES.FOUR_DICE:
                return CONFIG.AUDIO.MESSAGES.HINT_TOTAL_FOUR;
            default:
                return CONFIG.AUDIO.MESSAGES.HINT_TOTAL;
        }
    }

    /**
     * FIXED: Create completion modal with brief text and simple buttons
     */
    createCompletionModal() {
        if (!this.modal) return;
        
        // Clear existing content
        this.modal.innerHTML = '';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // FIXED: Simple title only
        const title = document.createElement('h2');
        title.textContent = CONFIG.AUDIO.MESSAGES.GAME_MODAL_TITLE; // Just "Well done!"
        modalContent.appendChild(title);
        
        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'modal-buttons';
        
        // Play Again button (always present)
        const playAgainBtn = document.createElement('button');
        playAgainBtn.className = 'modal-button primary';
        playAgainBtn.textContent = 'Play again'; // FIXED: Simple text
        playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });
        buttonContainer.appendChild(playAgainBtn);
        
        // FIXED: Mode-specific buttons with simple text
        if (this.currentMode === CONFIG.GAME_MODES.TWO_DICE) {
            // 3 Dice button
            const threeDiceBtn = document.createElement('button');
            threeDiceBtn.className = 'modal-button success';
            threeDiceBtn.textContent = '3 dice'; // FIXED: Simple text
            threeDiceBtn.addEventListener('click', () => {
                this.switchToMode(CONFIG.GAME_MODES.THREE_DICE);
            });
            buttonContainer.appendChild(threeDiceBtn);
            
        } else if (this.currentMode === CONFIG.GAME_MODES.THREE_DICE) {
            // 4 Dice button
            const fourDiceBtn = document.createElement('button');
            fourDiceBtn.className = 'modal-button success';
            fourDiceBtn.textContent = '4 dice'; // FIXED: Simple text
            fourDiceBtn.addEventListener('click', () => {
                this.switchToMode(CONFIG.GAME_MODES.FOUR_DICE);
            });
            buttonContainer.appendChild(fourDiceBtn);
            
            // 2 Dice button
            const twoDiceBtn = document.createElement('button');
            twoDiceBtn.className = 'modal-button secondary';
            twoDiceBtn.textContent = '2 dice'; // FIXED: Simple text
            twoDiceBtn.addEventListener('click', () => {
                this.switchToMode(CONFIG.GAME_MODES.TWO_DICE);
            });
            buttonContainer.appendChild(twoDiceBtn);
            
        } else if (this.currentMode === CONFIG.GAME_MODES.FOUR_DICE) {
            // 3 Dice button
            const threeDiceBtn = document.createElement('button');
            threeDiceBtn.className = 'modal-button secondary';
            threeDiceBtn.textContent = '3 dice'; // FIXED: Simple text
            threeDiceBtn.addEventListener('click', () => {
                this.switchToMode(CONFIG.GAME_MODES.THREE_DICE);
            });
            buttonContainer.appendChild(threeDiceBtn);
            
            // 2 Dice button
            const twoDiceBtn = document.createElement('button');
            twoDiceBtn.className = 'modal-button secondary';
            twoDiceBtn.textContent = '2 dice'; // FIXED: Simple text
            twoDiceBtn.addEventListener('click', () => {
                this.switchToMode(CONFIG.GAME_MODES.TWO_DICE);
            });
            buttonContainer.appendChild(twoDiceBtn);
        }
        
        modalContent.appendChild(buttonContainer);
        this.modal.appendChild(modalContent);
    }

    /**
     * Switch to a different game mode
     */
    switchToMode(newMode) {
        this.setGameMode(newMode);
        this.startNewGame();
    }

    /**
     * Wait for both ButtonBar AND proper game area setup
     */
    waitForSystemsAndInitialize() {
        console.log('🎲 Checking system readiness...');
        
        const buttonBarReady = window.ButtonBar && typeof window.ButtonBar.create === 'function';
        const gameAreaReady = this.gameArea && this.sumRow;
        
        if (buttonBarReady && gameAreaReady) {
            console.log('🎲 All systems ready, proceeding with initialization');
            this.buttonBarReady = true;
            this.gameAreaReady = true;
            
            this.createButtons();
            this.setupButtonBarCoordination();
            
            setTimeout(() => {
                console.log('🎲 ButtonBar coordination complete, initializing game');
                this.initializeGame();
            }, 800);
        } else {
            console.log(`⏳ Waiting for systems... ButtonBar: ${buttonBarReady}, GameArea: ${gameAreaReady}`);
            setTimeout(() => {
                this.waitForSystemsAndInitialize();
            }, 100);
        }
    }

    setupButtonBarCoordination() {
        if (window.ButtonBar) {
            window.ButtonBar.addObserver((dimensionData) => {
                console.log('🎯 ButtonBar dimensions updated:', dimensionData);
                this.updateGameAreaDimensions();
            });
        }
    }

    updateGameAreaDimensions() {
        if (!this.gameArea) {
            console.error('❌ Game area not found when trying to update dimensions');
            return;
        }
        
        this.gameArea.offsetHeight;
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        
        if (gameAreaRect.width < 100 || gameAreaRect.height < 100) {
            console.warn('⚠️ Game area dimensions seem too small, retrying...', gameAreaRect);
            setTimeout(() => {
                this.updateGameAreaDimensions();
            }, 100);
            return;
        }
        
        document.documentElement.style.setProperty('--game-area-width', `${gameAreaRect.width}px`);
        
        console.log('📏 Game area dimensions updated and CSS custom property set:', gameAreaRect.width, 'px');
        
        this.forceStyleRecalculation();
    }
    
    forceStyleRecalculation() {
        const elementsToUpdate = [
            document.querySelector('.plus-sign'),
            document.querySelector('.sum-row'),
            ...document.querySelectorAll('.input-box'),
            ...document.querySelectorAll('.sum-plus-sign, .sum-equals-sign'),
            document.querySelector('.check-mark')
        ];
        
        elementsToUpdate.forEach(element => {
            if (element) {
                const originalDisplay = element.style.display;
                element.style.display = 'none';
                element.offsetHeight;
                element.style.display = originalDisplay;
            }
        });
        
        console.log('🔄 Forced style recalculation for CSS custom property dependent elements');
    }

    initializeGame() {
        console.log('🎲 Starting game initialization with loading sequence');
        
        this.hideGameElements();
        
        setTimeout(() => {
            console.log('🎲 Starting fade-in sequence');
            this.showGameElements();
            this.isLoading = false;
            this.initializationComplete = true;
            
            setTimeout(() => {
                this.startNewQuestion();
            }, 1000);
            
        }, 500);
    }

    hideGameElements() {
        if (this.gameArea) this.gameArea.classList.remove('loaded');
        if (this.sumRow) this.sumRow.classList.remove('loaded');
    }

    showGameElements() {
        if (this.gameArea) {
            this.gameArea.classList.add('loaded');
        }
        
        if (this.sumRow) {
            this.sumRow.classList.add('loaded');
        }
        
        console.log('🎲 Game elements faded in');
    }

    createButtons() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
            '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894',
            '#00cec9', '#e17055'
        ];
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        
        if (window.ButtonBar && this.buttonBarReady) {
            window.ButtonBar.create(
                12,
                6.7,
                6.7,
                colors,
                numbers,
                (selectedNumber, buttonElement) => {
                    if (this.buttonsDisabled || !this.initializationComplete) return;
                    
                    this.clearInactivityTimer();
                    this.startInactivityTimer();
                    
                    this.handleNumberClick(selectedNumber, buttonElement);
                }
            );
            console.log('✅ Button bar created successfully');
        } else {
            console.warn('ButtonBar not available - using fallback');
        }
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

startInactivityTimer() {
        if (!this.isTabVisible || this.hintGiven || !this.initializationComplete) {
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
        if (this.buttonsDisabled || this.gameComplete || !this.isTabVisible || !this.initializationComplete) return;
        
        this.hintGiven = true;
        
        // Find the first unfilled position to give a hint for
        const config = CONFIG.SUM_BAR_CONFIG[this.currentMode.toUpperCase().replace('_', '_')];
        if (!config) return;
        
        let hintText = '';
        
        // Check dice input boxes first
        for (const position of config.inputOrder) {
            if (!this.filledBoxes.has(position)) {
                hintText = this.getHintMessage(position);
                break;
            }
        }
        
        // If all dice boxes are filled, check total
        if (!hintText && !this.filledBoxes.has('total')) {
            hintText = this.getTotalHint();
        }
        
        if (hintText) {
            this.speakText(hintText);
        }
    }

    initializeEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.buttonsDisabled || this.gameComplete || !this.initializationComplete) {
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

        window.addEventListener('beforeunload', () => {
            this.destroy();
        });
    }

    handleKeyboardDigit(digit) {
        if (this.keyboardBuffer === '1' && (digit === 0 || digit === 1 || digit === 2)) {
            this.clearKeyboardTimer();
            const number = parseInt('1' + digit);
            if (number >= 10 && number <= 12) {
                this.handleNumberClick(number, null);
            }
            return;
        }
        
        this.clearKeyboardTimer();
        
        if (digit === 1) {
            if (this.isDigitValidAnswer(1)) {
                this.handleNumberClick(1, null);
                return;
            }
            
            if (this.isDigitValidAnswer(10) || this.isDigitValidAnswer(11) || this.isDigitValidAnswer(12)) {
                this.keyboardBuffer = '1';
                this.keyboardTimer = setTimeout(() => {
                    this.clearKeyboardTimer();
                    this.handleNumberClick(1, null);
                }, this.keyboardWaitDuration);
                return;
            }
        }
        
        if (digit >= 1 && digit <= 9) {
            this.handleNumberClick(digit, null);
        }
    }

    isDigitValidAnswer(number) {
        // Check if number matches any unfilled dice value
        const config = CONFIG.SUM_BAR_CONFIG[this.currentMode.toUpperCase().replace('_', '_')];
        if (!config) return false;
        
        for (let i = 0; i < config.inputOrder.length; i++) {
            const position = config.inputOrder[i];
            if (!this.filledBoxes.has(position) && this.currentValues[i] === number) {
                return true;
            }
        }
        
        // Check total
        if (!this.filledBoxes.has('total') && this.currentTotal === number) {
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
        
        // Reset level system for new game
        this.currentLevel = 'L1'; // Always start at L1
        this.usedSumsThisRound = new Set(); // Clear used combinations
        this.roundQuestionCount = 0; // Reset question count
        
        this.rainbow.reset();
        this.bear.reset();
        this.diceRenderer.reset();
        
        // Set up for current mode
        this.diceRenderer.setGameMode(this.currentMode);
        this.updateSumRow();
        
        this.modal.classList.add('hidden');
        this.hideAllInputBoxes();
        
        this.initializationComplete = true;
        
        console.log(`🔄 New game started in ${this.currentMode} mode at ${this.currentLevel}: ${this.getLevelDescription(this.currentLevel)}`);
        this.startNewQuestion();
    }

    resetBoxState() {
        this.filledBoxes.clear();
        this.stopFlashing();
    }

    startFlashing() {
        this.stopFlashing();
        
        const flashElements = () => {
            // Find first unfilled position
            const config = CONFIG.SUM_BAR_CONFIG[this.currentMode.toUpperCase().replace('_', '_')];
            if (!config) return;
            
            let flashPosition = null;
            
            // Check dice positions first
            for (const position of config.inputOrder) {
                if (!this.filledBoxes.has(position)) {
                    flashPosition = position;
                    break;
                }
            }
            
            // If all dice filled, check total
            if (!flashPosition && !this.filledBoxes.has('total')) {
                flashPosition = 'total';
            }
            
            if (flashPosition) {
                // Flash the corresponding input box
                const inputBox = document.querySelector(`[data-position="${flashPosition}"]`);
                if (inputBox) {
                    inputBox.classList.add('box-flash');
                }
                
                // Flash the corresponding dice circle (not for total)
                if (flashPosition !== 'total') {
                    this.diceRenderer.showFlashForPosition(flashPosition);
                }
                
                setTimeout(() => {
                    if (inputBox) {
                        inputBox.classList.remove('box-flash');
                    }
                    if (flashPosition !== 'total') {
                        this.diceRenderer.hideFlashForPosition(flashPosition);
                    }
                }, 1000);
            }
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
        
        // Remove all flashing
        const inputBoxes = document.querySelectorAll('.input-box');
        inputBoxes.forEach(box => {
            box.classList.remove('box-flash');
        });
        
        this.diceRenderer.hideAllFlash();
    }

    async startNewQuestion() {
        if (this.gameComplete || !this.initializationComplete) {
            return;
        }

        // Check if we need to start a new round (after 10 questions)
        if (this.roundQuestionCount >= CONFIG.RAINBOW_PIECES) {
            this.usedSumsThisRound.clear();
            this.roundQuestionCount = 0;
            console.log('🆕 Starting new round - cleared used combinations');
        }

        this.resetBoxState();
        this.hideAllInputBoxes();
        this.hintGiven = false;

        console.log(`🎲 Starting question ${this.questionsCompleted + 1} (round question ${this.roundQuestionCount + 1}) in ${this.currentMode} mode`);
        console.log(`📊 Current level: ${this.currentLevel} (${this.getLevelDescription(this.currentLevel)})`);
        console.log(`🚫 Used combinations this round: [${Array.from(this.usedSumsThisRound).sort().join(', ')}]`);
        
        this.resetButtonStates();
        this.giveStartingInstruction();
        
        // Disable buttons during dice roll
        this.buttonsDisabled = true;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(false);
        }
        
        try {
            // Use level-based dice rolling
            const result = await this.diceRenderer.rollDiceForLevel(this.currentLevel, this.usedSumsThisRound);
            
            console.log('🎲 DICE RENDERER RETURNED:', result);
            
            // Store the target values from the dice result
            this.currentValues = result.values;
            this.currentTotal = result.total;
            
            // Add this combination to used combinations for this round
            this.usedSumsThisRound.add(result.combinationKey);
            
            console.log(`🎯 TARGET VALUES: [${this.currentValues.join(', ')}], Total=${this.currentTotal}`);
            console.log(`📝 Updated used combinations: [${Array.from(this.usedSumsThisRound).sort().join(', ')}]`);
            
            // Enable buttons and show input boxes
            this.buttonsDisabled = false;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(true);
            }
            this.showInputBoxes();
            this.startInactivityTimer();
            
            // Start question timer for stats tracking
            this.stats.startQuestionTimer();
            
        } catch (error) {
            console.error('Error rolling dice:', error);
            // Fallback values
            this.currentValues = Array(this.diceRenderer.getDiceCount()).fill(1);
            this.currentTotal = this.currentValues.reduce((a, b) => a + b, 0);
            
            this.buttonsDisabled = false;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(true);
            }
            this.showInputBoxes();
            this.startInactivityTimer();
            
            this.stats.startQuestionTimer();
        }
    }

    giveStartingInstruction() {
        if (!this.isTabVisible || !this.initializationComplete) return;
        
        setTimeout(() => {
            let message;
            if (this.questionsCompleted === 0) {
                message = CONFIG.AUDIO.MESSAGES.FIRST_QUESTION;
            } else if (this.questionsCompleted === 1) {
                message = CONFIG.AUDIO.MESSAGES.SECOND_QUESTION;
            } else {
                message = CONFIG.AUDIO.MESSAGES.CONTINUE_QUESTION;
            }
            this.speakText(message);
        }, 500);
    }

    hideAllInputBoxes() {
        const checkMark = document.getElementById('checkMark');
        if (checkMark) {
            checkMark.classList.remove('visible');
        }
        
        const inputBoxes = document.querySelectorAll('.input-box');
        inputBoxes.forEach(box => {
            box.textContent = '';
            box.classList.remove('flashing', 'filled');
        });
    }

    showInputBoxes() {
        // Find the first unfilled box and make it flash
        const config = CONFIG.SUM_BAR_CONFIG[this.currentMode.toUpperCase().replace('_', '_')];
        if (!config) return;
        
        let firstUnfilled = null;
        
        // Check dice positions first
        for (const position of config.inputOrder) {
            if (!this.filledBoxes.has(position)) {
                firstUnfilled = position;
                break;
            }
        }
        
        // If all dice filled, check total
        if (!firstUnfilled && !this.filledBoxes.has('total')) {
            firstUnfilled = 'total';
        }
        
        if (firstUnfilled) {
            const inputBox = document.querySelector(`[data-position="${firstUnfilled}"]`);
            if (inputBox) {
                inputBox.classList.add('flashing');
            }
        }
        
        this.startFlashing();
    }

    handleNumberClick(selectedNumber, buttonElement) {
        this.clearKeyboardTimer();
        
        let correctAnswer = false;
        const wasFirstAttempt = !this.hasAttemptedAnswer();
        
        // Check if this number matches any unfilled dice value
        const config = CONFIG.SUM_BAR_CONFIG[this.currentMode.toUpperCase().replace('_', '_')];
        if (config) {
            for (let i = 0; i < config.inputOrder.length; i++) {
                const position = config.inputOrder[i];
                if (!this.filledBoxes.has(position) && this.currentValues[i] === selectedNumber) {
                    this.fillBox(position, selectedNumber, buttonElement);
                    correctAnswer = true;
                    break;
                }
            }
        }
        
        // Check total if no dice match
        if (!correctAnswer && !this.filledBoxes.has('total') && this.currentTotal === selectedNumber) {
            this.fillBox('total', selectedNumber, buttonElement);
            correctAnswer = true;
        }
        
        // Record stats for this question attempt
        if (correctAnswer) {
            this.stats.recordQuestionAttempt(wasFirstAttempt);
            this.checkQuestionCompletion();
        } else {
            this.stats.recordQuestionAttempt(false);
            this.handleIncorrectAnswer(buttonElement, selectedNumber);
        }
    }

    fillBox(position, selectedNumber, buttonElement) {
        if (!buttonElement && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.animateButton(buttonElement, 'correct');
        }

        this.playCompletionSound();

        if (buttonElement) {
            this.createCelebrationStars(buttonElement);
        }

        // Find the input box for this position
        const inputBox = document.querySelector(`[data-position="${position}"]`);
        if (inputBox) {
            inputBox.textContent = selectedNumber;
            inputBox.classList.remove('flashing');
            inputBox.classList.add('filled');
        }
        
        // Mark this position as filled
        this.filledBoxes.add(position);
        
        // Hide flash for this position
        if (position !== 'total') {
            this.diceRenderer.hideFlashForPosition(position);
        }

        // Check if this was the last box
        const config = CONFIG.SUM_BAR_CONFIG[this.currentMode.toUpperCase().replace('_', '_')];
        const totalBoxes = config ? config.boxes + 1 : 3; // +1 for total
        const wasLastBox = this.filledBoxes.size >= totalBoxes;
        
        if (wasLastBox) {
            this.buttonsDisabled = true;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(false);
            }
            console.log('🔒 Final box filled - buttons disabled');
        }

        if (!wasLastBox) {
            this.updateFlashingBoxes();
        }
    }

    updateFlashingBoxes() {
        // Remove flashing from all boxes
        const inputBoxes = document.querySelectorAll('.input-box');
        inputBoxes.forEach(box => {
            box.classList.remove('flashing');
        });
        
        // Find next unfilled box
        const config = CONFIG.SUM_BAR_CONFIG[this.currentMode.toUpperCase().replace('_', '_')];
        if (!config) return;
        
        let nextUnfilled = null;
        
        // Check dice positions first
        for (const position of config.inputOrder) {
            if (!this.filledBoxes.has(position)) {
                nextUnfilled = position;
                break;
            }
        }
        
        // If all dice filled, check total
        if (!nextUnfilled && !this.filledBoxes.has('total')) {
            nextUnfilled = 'total';
        }
        
        if (nextUnfilled) {
            const inputBox = document.querySelector(`[data-position="${nextUnfilled}"]`);
            if (inputBox) {
                inputBox.classList.add('flashing');
            }
        }
        
        this.startFlashing();
    }

    checkQuestionCompletion() {
        const config = CONFIG.SUM_BAR_CONFIG[this.currentMode.toUpperCase().replace('_', '_')];
        const totalBoxes = config ? config.boxes + 1 : 3; // +1 for total
        
        if (this.filledBoxes.size >= totalBoxes) {
            this.clearInactivityTimer();
            this.stopFlashing();
            
            const checkMark = document.getElementById('checkMark');
            if (checkMark) {
                checkMark.classList.add('visible');
            }
            
            const pieces = this.rainbow.addPiece();
            console.log(`Rainbow pieces: ${pieces}`);
            
            // Determine if this was answered correctly on first attempt for level progression
            const wasCorrectFirstAttempt = !this.hasAttemptedAnswer();
            console.log(`📊 Question completed - First attempt: ${wasCorrectFirstAttempt ? 'Yes' : 'No'}`);
            
            // Update level based on performance
            this.updateLevel(wasCorrectFirstAttempt);
            
            // Random encouragement
            const encouragements = CONFIG.AUDIO.MESSAGES.CORRECT_ANSWERS;
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            this.speakText(randomEncouragement);
            
            this.questionsCompleted++;
            this.roundQuestionCount++;
            
            if (this.rainbow.isComplete()) {
                this.stats.recordRoundCompletion();
                
                setTimeout(() => {
                    this.completeGame();
                }, 3000);
                return;
            }

            setTimeout(() => {
                this.fadeOutDice();
            }, CONFIG.NEXT_QUESTION_DELAY);
        }
    }

    handleIncorrectAnswer(buttonElement, selectedNumber) {
        if (!buttonElement && selectedNumber && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        this.clearInactivityTimer();
        
        this.playFailureSound();
        
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText(CONFIG.AUDIO.MESSAGES.INCORRECT_ANSWER);
            }, 800);
        }
        
        this.buttonsDisabled = true;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(false);
        }
        
        this.stopFlashing();
        
        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.animateButton(buttonElement, 'incorrect');
        }

        let crossOverlay = null;
        if (buttonElement && window.ButtonBar) {
            crossOverlay = window.ButtonBar.addCrossOverlay(buttonElement);
        }

        if (buttonElement) {
            buttonElement.dataset.attempted = 'true';
        }
        
        this.fadeOtherButtons(buttonElement);

        setTimeout(() => {
            setTimeout(() => {
                this.fadeInAllButtons();
                
                if (crossOverlay && crossOverlay.parentNode) {
                    crossOverlay.style.transition = 'opacity 700ms ease-out';
                    crossOverlay.style.opacity = '0';
                }
                
                setTimeout(() => {
                    if (buttonElement && window.ButtonBar) {
                        window.ButtonBar.removeCrossOverlay(buttonElement);
                    }
                }, 700);
            }, 700);
            
            setTimeout(() => {
                this.buttonsDisabled = false;
                if (window.ButtonBar) {
                    window.ButtonBar.setButtonsEnabled(true);
                }
                this.startFlashing();
                this.startInactivityTimer();
            }, 1400);
        }, 700);
    }

    fadeOtherButtons(excludeButton) {
        if (window.ButtonBar && window.ButtonBar.buttons) {
            window.ButtonBar.buttons.forEach(btn => {
                if (btn !== excludeButton) {
                    btn.style.transition = 'opacity 700ms ease-in-out';
                    btn.style.opacity = '0.1';
                }
            });
        }
    }

    fadeInAllButtons() {
        if (window.ButtonBar && window.ButtonBar.buttons) {
            window.ButtonBar.buttons.forEach(btn => {
                btn.style.transition = 'opacity 700ms ease-in-out';
                btn.style.opacity = '1';
            });
            
            setTimeout(() => {
                window.ButtonBar.buttons.forEach(btn => {
                    btn.style.transition = '';
                });
            }, 700);
        }
    }

    async fadeOutDice() {
        console.log('Starting dice transition');
        
        await this.diceRenderer.fadeOutCurrentDice();
        this.startNewQuestion();
    }

    hasAttemptedAnswer() {
        if (window.ButtonBar && window.ButtonBar.buttons) {
            return window.ButtonBar.buttons.some(btn => 
                btn.dataset.attempted === 'true'
            );
        }
        return false;
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

    completeGame() {
        this.gameComplete = true;
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        this.stopFlashing();
        
        // Create the appropriate modal for current mode
        this.createCompletionModal();
        this.modal.classList.remove('hidden');
        
        this.bear.startCelebration();
        
        // FIXED: Play audio message but don't show it in modal
        if (this.isTabVisible) {
            setTimeout(() => {
                let audioMessage;
                switch (this.currentMode) {
                    case CONFIG.GAME_MODES.TWO_DICE:
                        audioMessage = CONFIG.AUDIO.MESSAGES.GAME_TWODICE_COMPLETE_AUDIO;
                        break;
                    case CONFIG.GAME_MODES.THREE_DICE:
                        audioMessage = CONFIG.AUDIO.MESSAGES.GAME_THREEDICE_COMPLETE_AUDIO;
                        break;
                    case CONFIG.GAME_MODES.FOUR_DICE:
                        audioMessage = CONFIG.AUDIO.MESSAGES.GAME_FOURDICE_COMPLETE_AUDIO;
                        break;
                    default:
                        audioMessage = CONFIG.AUDIO.MESSAGES.GAME_TWODICE_COMPLETE_AUDIO;
                }
                this.speakText(audioMessage);
            }, 1000);
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

    updateStatsDisplay() {
        if (this.stats && this.statsDisplay.accuracy) {
            const currentStats = this.stats.getCurrentStats();
            this.statsDisplay.accuracy.textContent = currentStats.accuracy;
            this.statsDisplay.resilience.textContent = currentStats.resilience;
            this.statsDisplay.speed.textContent = currentStats.speed;
            this.statsDisplay.variety.textContent = currentStats.variety;
            this.statsDisplay.questions.textContent = this.stats.totalQuestions;
        }
    }

    destroy() {
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
        }
        
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        if (this.stats) {
            this.stats.destroy();
        }
        
        this.rainbow.reset();
        this.bear.reset();
        this.diceRenderer.reset();
        
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎲 DOM loaded, creating MultiDiceGameController');
    window.multiDiceGame = new MultiDiceGameController();
});

// Clean up resources when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.multiDiceGame) {
        window.multiDiceGame.destroy();
    }
});
