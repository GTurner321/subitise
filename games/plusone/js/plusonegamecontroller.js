class PlusOneGameController {
    constructor() {
        // Initialize components in proper order
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
        this.failedAtCurrentLevel = false; // Track if user has failed once at current level
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.hintGiven = false; // Track if hint has been given for current question
        this.isTabVisible = true; // Track tab visibility
        
        // Keyboard handling for multi-digit numbers - ENHANCED
        this.keyboardBuffer = '';
        this.keyboardTimer = null;
        this.lastKeyTime = 0;
        this.isTypingSequence = false;
        
        // Game state
        this.currentNumber = 0; // The 'n' in n+1
        this.currentAnswer = 0; // n+1
        this.buttonsDisabled = false;
        this.hasAttemptedAnyAnswer = false; // Track if user has made any incorrect attempts on current question
        
        // Box state tracking - all boxes start empty for levels 1-2 and 5
        this.leftFilled = false;
        this.rightFilled = false; // Right box fillable in picture format
        this.totalFilled = false;
        
        // Flashing intervals
        this.flashingInterval = null;
        this.flashingTimeout = null;
        
        // Loading state and initialization tracking - SIMPLIFIED
        this.isLoading = true;
        this.initializationComplete = false;
        this.systemsReady = false;
        this.readyCheckCount = 0;
        
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
        
        // Try to find pulse areas, but don't break if they don't exist
        this.leftPulseArea = document.getElementById('leftPulseArea');
        this.rightPulseArea = document.getElementById('rightPulseArea');
        
        // Initialize in proper order
        this.initializeEventListeners();
        this.setupVisibilityHandling();
        this.waitForSystemsAndInitialize();
    }

    // Helper function to determine if current level should use picture/icon format
    shouldUsePictureFormat() {
        return this.currentLevel <= 2 || this.currentLevel === 5;
    }

    // Helper function to determine if current level should use number format  
    shouldUseNumberFormat() {
        return this.currentLevel >= 3 && this.currentLevel !== 5;
    }

    /**
     * SIMPLIFIED: Wait for systems to be ready with faster checks and shorter timeout
     */
    waitForSystemsAndInitialize() {
        console.log('🎮 Checking system readiness - fast mode...');
        
        const checkSystemsReady = () => {
            this.readyCheckCount++;
            
            // Check if ButtonBar is available and functional
            const buttonBarReady = window.ButtonBar && typeof window.ButtonBar.create === 'function';
            
            // Check if game area containers exist
            const gameAreaReady = this.gameArea && this.leftSide && this.rightSide && this.sumRow;
            
            if (buttonBarReady && gameAreaReady) {
                console.log(`🎮 All systems ready after ${this.readyCheckCount} checks (${this.readyCheckCount * CONFIG.SYSTEM_CHECK_INTERVAL}ms)`);
                this.systemsReady = true; // Set this flag early for keyboard input
                
                // Setup content renderer coordination FIRST
                if (this.contentRenderer && typeof this.contentRenderer.setupButtonBarCoordination === 'function') {
                    console.log('🔗 Setting up content renderer ButtonBar coordination');
                    this.contentRenderer.setupButtonBarCoordination();
                }
                
                // Create buttons immediately
                this.createButtons();
                
                // Initialize game with shorter delay
                setTimeout(() => {
                    console.log('🎮 Starting game initialization');
                    this.initializeGame();
                }, CONFIG.BUTTON_SETUP_DELAY);
                
                return;
            }
            
            // Check if we've exceeded maximum checks
            if (this.readyCheckCount >= CONFIG.MAX_READY_CHECKS) {
                console.warn(`⚠️ Systems not ready after ${CONFIG.FAILSAFE_TIMEOUT}ms, forcing initialization`);
                this.systemsReady = true; // Set flag even if forced
                this.forceInitialization();
                return;
            }
            
            // Continue checking
            console.log(`⏳ Waiting for systems... (${this.readyCheckCount}/${CONFIG.MAX_READY_CHECKS}) ButtonBar: ${buttonBarReady}, GameArea: ${gameAreaReady}`);
            setTimeout(checkSystemsReady, CONFIG.SYSTEM_CHECK_INTERVAL);
        };
        
        // Start checking immediately
        checkSystemsReady();
    }

    /**
     * Force initialization when systems don't become ready in time
     */
    forceInitialization() {
        console.log('🚨 Force initializing game systems');
        
        this.systemsReady = true; // Ensure this flag is set for keyboard input
        
        // Try to setup content renderer if available
        if (this.contentRenderer && typeof this.contentRenderer.setupButtonBarCoordination === 'function') {
            try {
                this.contentRenderer.setupButtonBarCoordination();
            } catch (error) {
                console.warn('⚠️ Content renderer setup failed:', error);
            }
        }
        
        // Try to create buttons if ButtonBar exists
        if (window.ButtonBar && typeof window.ButtonBar.create === 'function') {
            try {
                this.createButtons();
            } catch (error) {
                console.warn('⚠️ Button creation failed:', error);
            }
        }
        
        // Initialize game
        setTimeout(() => {
            this.initializeGame();
        }, CONFIG.BUTTON_SETUP_DELAY);
    }

    initializeGame() {
        console.log('🎮 Starting game initialization');
        
        // Hide all elements initially (except ButtonBar - it handles its own timing)
        this.hideGameElements();
        
        // Set up sum bar to become ready after its fade-in animation completes
        setTimeout(() => {
            if (this.sumRow) {
                this.sumRow.classList.add('sum-bar-ready');
                console.log('🎯 Sum bar marked as ready for normal opacity control');
            }
        }, 1000); // 0.5s delay + 0.5s animation = 1s total
        
        // Wait for elements to be hidden, then start fade-in
        setTimeout(() => {
            console.log('🎮 Starting fade-in sequence');
            this.showGameElements();
            this.isLoading = false;
            this.initializationComplete = true;
            
            // Start the first question after fade-in completes
            setTimeout(() => {
                this.startNewQuestion();
            }, 500); // Reduced delay
            
        }, 200); // Reduced delay
    }

    hideGameElements() {
        // Only hide game area - sum row will stay transparent via CSS until its animation
        if (this.gameArea) this.gameArea.classList.remove('loaded');
        // Don't touch sum row classes - let CSS animation handle everything
    }

    showGameElements() {
        console.log('🎮 showGameElements called - simplified approach');
        
        // Only handle game area - sum row handles itself via CSS animation
        if (this.gameArea) {
            this.gameArea.classList.add('dimensions-ready', 'loaded');
        }
        
        // Reduced failsafe timeout - but only for game area
        setTimeout(() => {
            if (this.gameArea && !this.gameArea.classList.contains('loaded')) {
                console.warn('⚠️ FAILSAFE: Game area never became ready, forcing visibility');
                this.gameArea.classList.add('dimensions-ready', 'loaded');
                this.gameArea.style.visibility = 'visible';
                this.gameArea.style.opacity = '1';
            }
        }, 1000);
        
        console.log('🎮 Game area show sequence initiated - sum bar will handle itself');
    }

    createButtons() {
        // Determine button configuration based on current level
        const isPictureFormat = this.shouldUsePictureFormat();
        const config = isPictureFormat ? CONFIG.BUTTON_CONFIGS.PICTURE_FORMAT : CONFIG.BUTTON_CONFIGS.NUMBER_FORMAT;
        
        console.log(`Creating buttons for level ${this.currentLevel}: ${isPictureFormat ? 'Picture' : 'Number'} format (${config.count} buttons)`);
        
        // Create button colors array
        const colors = CONFIG.COLORS.slice(0, config.count);
        
        // Create button numbers array
        let numbers;
        if (isPictureFormat) {
            numbers = [...config.numbers]; // Use spread to avoid reference issues
        } else {
            // For number format, use placeholder numbers - will be updated when question is generated
            numbers = [1, 2, 3, 4];
        }
        
        // Always destroy and recreate ButtonBar to ensure proper configuration
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
        
        // Wait a moment for cleanup, then create new ButtonBar
        setTimeout(() => {
            if (window.ButtonBar) {
                window.ButtonBar.create(
                    config.count,          // number of buttons
                    config.width,          // button width as % of button panel width
                    config.height,         // button height as % of button panel width
                    colors,                // array of button colors
                    numbers,               // array of button numbers/labels
                    (selectedNumber, buttonElement) => {  // click handler
                        if (this.buttonsDisabled || !this.initializationComplete) return;
                        
                        // Clear inactivity timer on user interaction
                        this.clearInactivityTimer();
                        this.startInactivityTimer();
                        
                        this.handleNumberClick(selectedNumber, buttonElement);
                    }
                );
                console.log(`✅ Button bar created successfully: ${config.count} buttons (${config.width}% x ${config.height}%)`);
            } else {
                console.warn('ButtonBar not available during recreation');
            }
        }, 50); // Reduced delay
    }

    updateButtonsForNumberFormat(correctAnswer) {
        // Generate 4 options: correct answer, n-1, random from level set, and n+2/n+3/n+5/n+10
        const options = new Set();
        
        // Add correct answer (n+1)
        options.add(correctAnswer);
        
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
        const shuffledOptions = Array.from(options).slice(0, 4);
        this.shuffleArray(shuffledOptions);
        
        // Update ButtonBar with new numbers
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

    setupVisibilityHandling() {
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            
            if (!this.isTabVisible) {
                // Tab is hidden - stop all audio and clear timers
                this.clearInactivityTimer();
                if (window.AudioSystem) {
                    window.AudioSystem.stopAllAudio();
                }
            } else {
                // Tab is visible again - restart inactivity timer if game is active
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
        // Only start timer if tab is visible, game is initialized, and hint hasn't been given
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

    clearKeyboardTimer() {
        if (this.keyboardTimer) {
            clearTimeout(this.keyboardTimer);
            this.keyboardTimer = null;
        }
    }

    giveInactivityHint() {
        if (this.buttonsDisabled || this.gameComplete || !this.isTabVisible || !this.initializationComplete) return;
        
        // Mark that hint has been given for this question
        this.hintGiven = true;
        
        let hintText = '';
        if (this.shouldUsePictureFormat()) {
            // Picture format levels: hints for each box in order
            if (!this.leftFilled) {
                hintText = CONFIG.AUDIO.HINTS.COUNT_LEFT;
            } else if (!this.rightFilled) {
                hintText = CONFIG.AUDIO.HINTS.COUNT_RIGHT;
            } else if (!this.totalFilled) {
                hintText = CONFIG.AUDIO.HINTS.WHAT_IS_PLUS_ONE(this.currentNumber);
            }
        } else {
            // Number format levels: focus on "what comes after"
            if (!this.totalFilled) {
                hintText = CONFIG.AUDIO.NUMBER_HINTS.WHAT_COMES_AFTER(this.currentNumber);
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

        // Keyboard event listener - ensure it's active immediately
        const keyboardHandler = (e) => {
            // More permissive conditions - allow input as soon as systems are ready
            if (this.buttonsDisabled || this.gameComplete) {
                console.log('🚫 Keyboard input blocked:', { buttonsDisabled: this.buttonsDisabled, gameComplete: this.gameComplete });
                return;
            }
            
            // Allow input as soon as systems are ready, don't wait for full initialization
            if (!this.systemsReady) {
                console.log('🚫 Keyboard input blocked: systems not ready');
                return;
            }
            
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                
                console.log('⌨️ Keyboard digit accepted:', e.key);
                
                this.clearInactivityTimer();
                this.startInactivityTimer();
                
                const digit = parseInt(e.key);
                this.handleKeyboardDigit(digit);
            }
        };
        
        // Add keyboard listener immediately and ensure it's active
        document.addEventListener('keydown', keyboardHandler);
        
        // Also ensure document has focus for keyboard events
        if (document.activeElement !== document.body) {
            document.body.focus();
        }
        
        // Store reference for potential cleanup
        this.keyboardHandler = keyboardHandler;
        
        // Disable context menu (right-click) for game areas to prevent interference with touch counting
        this.setupTouchProtection();
        
        console.log('🎹 Keyboard event listener initialized and ready');
    }
    
    setupTouchProtection() {
        // Prevent context menu on game area and its children
        const gameAreaElements = [this.gameArea, this.leftSide, this.rightSide];
        
        gameAreaElements.forEach(element => {
            if (element) {
                element.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
                
                // Also prevent long press context menu on mobile
                element.addEventListener('touchstart', (e) => {
                    // Don't prevent touch on interactive elements
                    if (e.target.closest('.number-btn, .back-button, .audio-button-container')) {
                        return;
                    }
                    // For game area touches, prevent default but don't stop propagation
                    // This prevents context menus while still allowing visual feedback
                });
                
                element.addEventListener('touchend', (e) => {
                    if (e.target.closest('.number-btn, .back-button, .audio-button-container')) {
                        return;
                    }
                    e.preventDefault();
                });
            }
        });
        
        console.log('🚫 Touch protection enabled for game areas');
    }

    handleKeyboardDigit(digit) {
        const currentTime = Date.now();
        
        // Check if this is part of a multi-digit sequence
        if (this.isTypingSequence && (currentTime - this.lastKeyTime) > CONFIG.MULTI_DIGIT_TIMEOUT) {
            // Too much time elapsed, reset sequence
            console.log('Multi-digit timeout exceeded, resetting sequence');
            this.resetKeyboardState();
        }
        
        this.lastKeyTime = currentTime;
        
        // Add digit to buffer
        this.keyboardBuffer += digit.toString();
        this.isTypingSequence = true;
        
        console.log(`Keyboard buffer: "${this.keyboardBuffer}"`);
        
        // Clear any existing timer
        this.clearKeyboardTimer();
        this.resetKeyboardState();
        
        // Check if buffer matches any valid answers immediately
        const currentBufferNumber = parseInt(this.keyboardBuffer);
        const validAnswers = this.getValidAnswersForCurrentState();
        
        // If buffer matches a valid answer exactly, use it immediately
        if (validAnswers.includes(currentBufferNumber)) {
            console.log(`Buffer "${this.keyboardBuffer}" matches valid answer ${currentBufferNumber}`);
            this.resetKeyboardState();
            this.handleNumberClick(currentBufferNumber, null);
            return;
        }
        
        // Check if buffer could be the start of a longer valid answer
        const couldBeLonger = validAnswers.some(answer => 
            answer.toString().startsWith(this.keyboardBuffer) && 
            answer.toString().length > this.keyboardBuffer.length
        );
        
        if (couldBeLonger) {
            // Wait for more digits
            console.log(`Buffer "${this.keyboardBuffer}" could be start of longer number, waiting...`);
            this.keyboardTimer = setTimeout(() => {
                // Timeout reached, try current buffer
                const bufferNumber = parseInt(this.keyboardBuffer);
                console.log(`Keyboard timeout reached, submitting buffer: ${bufferNumber}`);
                this.resetKeyboardState();
                this.handleNumberClick(bufferNumber, null);
            }, CONFIG.MULTI_DIGIT_TIMEOUT);
        } else {
            // Buffer doesn't match anything and can't be extended
            console.log(`Buffer "${this.keyboardBuffer}" doesn't match any valid pattern`);
            this.resetKeyboardState();
            this.handleNumberClick(currentBufferNumber, null);
        }
    }
    
    resetKeyboardState() {
        this.keyboardBuffer = '';
        this.isTypingSequence = false;
        this.lastKeyTime = 0;
        this.clearKeyboardTimer();
    }
    
    getValidAnswersForCurrentState() {
        // Get all possible valid answers based on current box state
        const validAnswers = [];
        
        if (!this.leftFilled) {
            validAnswers.push(this.currentNumber);
        }
        if (!this.rightFilled) {
            validAnswers.push(1);
        }
        if (!this.totalFilled) {
            validAnswers.push(this.currentAnswer);
        }
        
        // For picture format, also include all button numbers (but prioritize correct answers)
        if (this.shouldUsePictureFormat()) {
            CONFIG.BUTTON_CONFIGS.PICTURE_FORMAT.numbers.forEach(num => {
                if (!validAnswers.includes(num)) {
                    validAnswers.push(num);
                }
            });
        } else {
            // For number format, include the multiple choice options from buttons
            if (window.ButtonBar && window.ButtonBar.buttons) {
                window.ButtonBar.buttons.forEach(btn => {
                    const btnNumber = parseInt(btn.dataset.number);
                    if (!validAnswers.includes(btnNumber)) {
                        validAnswers.push(btnNumber);
                    }
                });
            }
        }
        
        // Remove duplicates and sort for consistent behavior
        return [...new Set(validAnswers)].sort((a, b) => a - b);
    }

    couldBePartOfLargerNumber() {
        // Check if "1" could be part of a larger valid answer
        const possibleAnswers = this.getPossibleAnswers();
        return possibleAnswers.some(answer => answer >= 10 && answer.toString().startsWith('1'));
    }

    getPossibleAnswers() {
        if (this.shouldUsePictureFormat()) {
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        } else {
            // For number format levels, this would be the 4 multiple choice options
            return this.getCurrentOptions();
        }
    }

    getCurrentOptions() {
        // Get current button numbers from ButtonBar
        if (window.ButtonBar && window.ButtonBar.buttons) {
            return window.ButtonBar.buttons.map(btn => parseInt(btn.dataset.number));
        }
        return [];
    }

    startNewGame() {
        const oldLevel = this.currentLevel;
        const oldFormat = this.shouldUsePictureFormat();
        
        // Start at current level, but cap at level 5 maximum for restarts
        this.currentLevel = Math.min(this.currentLevel, 5);
        console.log(`New game: Starting at level ${this.currentLevel} (was ${oldLevel}, capped at 5)`);
        
        this.questionsCompleted = 0;
        this.gameComplete = false;
        this.usedNumbersInLevel.clear();
        this.failedAtCurrentLevel = false;
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        this.resetBoxState();
        
        this.rainbow.reset();
        this.bear.reset();
        this.contentRenderer.reset();
        this.modal.classList.add('hidden');
        
        // Keep initialization flags - systems should stay ready
        this.initializationComplete = true;
        
        // Check if format changed from previous game
        const newFormat = this.shouldUsePictureFormat();
        if (oldFormat !== newFormat || Math.abs(this.currentLevel - oldLevel) > 0) {
            console.log(`New game: Level ${oldLevel} → ${this.currentLevel}, Format ${oldFormat ? 'Picture' : 'Number'} → ${newFormat ? 'Picture' : 'Number'}`);
            // Always recreate buttons for new game to ensure proper configuration
            this.createButtons();
            
            // Wait for button setup to complete
            setTimeout(() => {
                this.startNewQuestion();
            }, CONFIG.COORDINATION_DELAY);
        } else {
            // Same format, just start new question
            setTimeout(() => {
                this.startNewQuestion();
            }, 100);
        }
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
            if (this.shouldUsePictureFormat()) {
                // Picture format levels: flash based on which box needs filling (left → right → total)
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
                // Number format levels: only flash for total answer (left and right are pre-filled)
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
        
        // Safely remove flash classes - check if elements exist first
        if (this.leftPulseArea) {
            this.leftPulseArea.classList.remove('area-flash');
        }
        if (this.rightPulseArea) {
            this.rightPulseArea.classList.remove('area-flash');
        }
        if (this.leftInputBox) {
            this.leftInputBox.classList.remove('box-flash');
        }
        if (this.rightInputBox) {
            this.rightInputBox.classList.remove('box-flash');
        }
        if (this.totalInputBox) {
            this.totalInputBox.classList.remove('box-flash');
        }
    }

    startNewQuestion() {
        if (this.gameComplete) {
            return;
        }
        
        // Don't require full initialization - just systems ready
        if (!this.systemsReady) {
            console.log('⏳ Systems not ready for new question, waiting...');
            setTimeout(() => {
                this.startNewQuestion();
            }, 100);
            return;
        }

        this.resetBoxState();
        this.hintGiven = false;
        this.hasAttemptedAnyAnswer = false; // Reset attempt tracking for new question

        // Re-enable buttons FIRST before generating question
        this.buttonsDisabled = false;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(true);
        }

        // Generate n+1 question for current level
        this.generatePlusOneQuestion();
        
        console.log(`🎮 NEW QUESTION: ${this.currentNumber} + 1 = ${this.currentAnswer}, Level: ${this.currentLevel} (Keyboard input available)`);
        
        // Update buttons for number format levels
        if (this.shouldUseNumberFormat()) {
            this.updateButtonsForNumberFormat(this.currentAnswer);
        }
        
        // Setup input boxes with correct current numbers
        this.setupInputBoxesForQuestion();
        
        // Render the content (icons for picture format, numbers for number format)
        this.contentRenderer.renderContent(this.currentNumber, this.currentLevel);
        
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
        
        // Clear all boxes first
        this.leftInputBox.textContent = '';
        this.rightInputBox.textContent = '';
        this.totalInputBox.textContent = '';
        
        // Remove all classes
        this.leftInputBox.classList.remove('flashing', 'filled', 'fixed-one');
        this.rightInputBox.classList.remove('flashing', 'filled', 'fixed-one');
        this.totalInputBox.classList.remove('flashing', 'filled');
        
        if (this.shouldUsePictureFormat()) {
            // Picture format levels: All boxes start empty and need to be filled by user
            this.leftFilled = false;
            this.rightFilled = false;
            this.totalFilled = false;
        } else {
            // Number format levels: Pre-fill left and right boxes
            this.leftInputBox.textContent = this.currentNumber;
            this.leftInputBox.classList.add('filled');
            this.leftFilled = true;
            
            this.rightInputBox.textContent = '1';
            this.rightInputBox.classList.add('filled', 'fixed-one');
            this.rightFilled = true;
            
            this.totalFilled = false;
        }
        
        // Update sum row width based on number of digits
        this.updateSumRowWidth();
    }

    updateSumRowWidth() {
        if (!this.sumRow) return;
        
        // Calculate max digits in any box for CURRENT question
        const leftDigits = this.currentNumber.toString().length;
        const rightDigits = 1; // Always 1
        const totalDigits = this.currentAnswer.toString().length;
        const maxDigits = Math.max(leftDigits, rightDigits, totalDigits);
        
        console.log(`Sum row sizing: ${this.currentNumber} + 1 = ${this.currentAnswer} (${leftDigits}, ${rightDigits}, ${totalDigits} digits, max: ${maxDigits})`);
        
        // Set CSS custom properties for dynamic box sizing
        const baseBoxSize = 'calc(var(--game-area-width) * 0.07)'; // 7% of game area width
        let leftBoxWidth, totalBoxWidth;
        
        // PICTURE FORMAT: Keep all boxes same size (single digit size) - 10 fits in square box
        if (this.shouldUsePictureFormat()) {
            leftBoxWidth = baseBoxSize;
            totalBoxWidth = baseBoxSize; // Keep same size even for 10
        } else {
            // NUMBER FORMAT: Size boxes based on digit count for readability
            // Size left box based on its digit count
            if (leftDigits === 1) {
                leftBoxWidth = baseBoxSize;
            } else if (leftDigits === 2) {
                leftBoxWidth = `calc(${baseBoxSize} * 1.4)`; // 40% wider for 2 digits
            } else {
                leftBoxWidth = `calc(${baseBoxSize} * 1.8)`; // 80% wider for 3+ digits
            }
            
            // Size total box based on its digit count
            if (totalDigits === 1) {
                totalBoxWidth = baseBoxSize;
            } else if (totalDigits === 2) {
                totalBoxWidth = `calc(${baseBoxSize} * 1.4)`; // 40% wider for 2 digits
            } else {
                totalBoxWidth = `calc(${baseBoxSize} * 1.8)`; // 80% wider for 3+ digits
            }
        }
        
        // Update box widths
        this.leftInputBox.style.width = leftBoxWidth;
        this.rightInputBox.style.width = baseBoxSize; // Right box always single digit
        this.totalInputBox.style.width = totalBoxWidth;
        
        // Update sum row width: (width of 3 boxes after adjustment) + 3.5 * box height
        const boxHeight = baseBoxSize;
        const combinedBoxWidth = `calc(${leftBoxWidth} + ${baseBoxSize} + ${totalBoxWidth})`; // left + right + total
        const sumRowWidth = `calc(${combinedBoxWidth} + ${boxHeight} * 3.5)`; // boxes + spacing
        
        this.sumRow.style.width = sumRowWidth;
        
        console.log(`Sum row updated: left=${leftBoxWidth}, right=${baseBoxSize}, total=${totalBoxWidth}, row=${sumRowWidth}`);
    }

    giveStartingInstruction() {
        if (!window.AudioSystem || !this.isTabVisible || !this.initializationComplete) return;
        
        setTimeout(() => {
            if (this.shouldUsePictureFormat()) {
                // Picture format levels: Basic instructions for icon levels  
                if (this.questionsCompleted === 0) {
                    this.speakText(CONFIG.AUDIO.FIRST_QUESTION);
                } else if (this.questionsCompleted === 1) {
                    this.speakText(CONFIG.AUDIO.SECOND_QUESTION);
                } else {
                    this.speakText(CONFIG.AUDIO.LATER_QUESTIONS);
                }
            } else {
                // Number format levels: Ask the plus one question immediately
                this.speakText(CONFIG.AUDIO.NUMBER_FORMAT_QUESTION(this.currentNumber));
            }
        }, 500);
    }

    showInputBoxes() {
        // Flash the first box that needs to be filled (left → right → total)
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
        
        // Check which box should be filled based on what's needed
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
            this.checkQuestionCompletion();
        } else {
            this.handleIncorrectAnswer(buttonElement, selectedNumber);
        }
    }

    fillBox(boxType, selectedNumber, buttonElement) {
        // Find button element if not provided (for keyboard input)
        if (!buttonElement && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        // Flash green on correct answer
        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.animateButton(buttonElement, 'correct');
        }

        // Play completion sound
        this.playCompletionSound();

        // Create celebration stars around the button
        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.createCelebrationStars(buttonElement);
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

        // Check if this was the final box
        const boxesFilledBefore = [this.leftFilled, this.rightFilled, this.totalFilled].filter(Boolean).length - 1;
        const wasLastBox = boxesFilledBefore === 2;
        
        if (wasLastBox) {
            // Final box - disable buttons to prevent duplicate input
            this.buttonsDisabled = true;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(false);
            }
        }

        // Update flashing to show next priority box (only if not the final box)
        if (!wasLastBox) {
            this.updateFlashingBoxes();
        }
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
        // Question is complete when both left and total are filled (right may be pre-filled)
        const questionComplete = this.leftFilled && this.totalFilled;
        
        if (questionComplete) {
            this.clearInactivityTimer();
            this.stopFlashing();
            
            this.checkMark.classList.add('visible');
            
            // Check if this was first attempt (no incorrect answers on this question)
            const wasFirstAttempt = !this.hasAttemptedAnyAnswer;
            
            this.handleLevelProgression(wasFirstAttempt);
            
            const pieces = this.rainbow.addPiece();
            console.log(`Rainbow pieces: ${pieces}, wasFirstAttempt: ${wasFirstAttempt}, new level: ${this.currentLevel}`);
            
            // Give appropriate audio feedback - ALWAYS for picture format, only first attempt for number format
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

            // Different delays for different levels due to audio feedback
            const delay = this.shouldUsePictureFormat() ? 4000 : 2000;
            setTimeout(() => {
                this.fadeOutQuestion();
            }, delay);
        }
    }

    giveCompletionFeedback(wasFirstAttempt = true) {
        if (this.shouldUsePictureFormat()) {
            // Picture format levels: Say encouraging word first, then ALWAYS repeat the sum
            const encouragements = CONFIG.AUDIO.ENCOURAGEMENTS;
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            
            this.speakText(randomEncouragement);
            
            // ALWAYS repeat the sum for picture format levels (educational value)
            setTimeout(() => {
                const sumMessage = CONFIG.AUDIO.SUM_REPETITION(this.currentNumber, this.currentAnswer);
                this.speakText(sumMessage);
            }, 1500);
        } else {
            // Number format levels: Just encouragement
            const encouragements = CONFIG.AUDIO.ENCOURAGEMENTS;
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            this.speakText(randomEncouragement);
        }
    }

    handleLevelProgression(wasFirstAttempt) {
        const oldLevel = this.currentLevel;
        const oldFormat = this.shouldUsePictureFormat();
        
        if (wasFirstAttempt) {
            // Success - advance to next level
            if (this.currentLevel < 10) {
                this.currentLevel++;
                console.log(`Advanced to level ${this.currentLevel}`);
            }
            this.failedAtCurrentLevel = false;
        } else {
            // Failure - implement redemption system
            if (this.failedAtCurrentLevel) {
                // This is the second failure at this level - go back one level
                if (this.currentLevel > 1) {
                    this.currentLevel--;
                    console.log(`Second failure at level, dropping to level ${this.currentLevel}`);
                }
                this.failedAtCurrentLevel = false;
            } else {
                // This is the first failure - stay at same level for redemption
                this.failedAtCurrentLevel = true;
                console.log(`First failure at level ${this.currentLevel}, staying for redemption question`);
            }
        }
        
        // Check if format changed and schedule button recreation
        const newFormat = this.shouldUsePictureFormat();
        if (oldFormat !== newFormat || Math.abs(this.currentLevel - oldLevel) > 0) {
            console.log(`Level progression: ${oldLevel} → ${this.currentLevel}, Format change: ${oldFormat ? 'Picture' : 'Number'} → ${newFormat ? 'Picture' : 'Number'}`);
            
            // Mark that buttons need recreation
            this.needsButtonRecreation = true;
        }
    }

    handleIncorrectAnswer(buttonElement, selectedNumber) {
        // Find button element if not provided (for keyboard input)
        if (!buttonElement && selectedNumber && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        // Mark that user has attempted an answer on this question
        this.hasAttemptedAnyAnswer = true;
        
        this.clearInactivityTimer();
        this.playFailureSound();
        
        // Give specific audio feedback
        if (this.isTabVisible) {
            setTimeout(() => {
                if (this.shouldUseNumberFormat()) {
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
        
        // Use ButtonBar's feedback system
        if (window.ButtonBar) {
            window.ButtonBar.showIncorrectFeedback(selectedNumber, buttonElement);
        }

        // Mark that an attempt was made on the button (for visual feedback)
        if (buttonElement) {
            buttonElement.dataset.attempted = 'true';
        }
        
        // Re-enable buttons after feedback completes
        setTimeout(() => {
            this.buttonsDisabled = false;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(true);
            }
            this.startFlashing();
            this.startInactivityTimer();
        }, 2100); // Match ButtonBar's feedback timing
    }

    fadeOutQuestion() {
        // Add fade out class to content only
        const gameElements = [...this.contentRenderer.currentContent];
        
        gameElements.forEach(element => {
            if (element) {
                element.classList.add('fade-out');
            }
        });
        
        setTimeout(() => {
            // Check if buttons need recreation before starting new question
            if (this.needsButtonRecreation) {
                console.log('🔄 Recreating buttons due to format change');
                this.needsButtonRecreation = false;
                this.createButtons();
                
                // Wait for button recreation to complete
                setTimeout(() => {
                    this.startNewQuestion();
                    this.fadeInNewContent();
                }, CONFIG.BUTTON_SETUP_DELAY);
            } else {
                this.startNewQuestion();
                this.fadeInNewContent();
            }
        }, 1000);
    }
    
    fadeInNewContent() {
        setTimeout(() => {
            const newElements = [...this.contentRenderer.currentContent];
            
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
                
                // Remove any existing cross overlays
                window.ButtonBar.removeCrossOverlay(btn);
            });
        }
    }

    completeGame() {
        this.gameComplete = true;
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
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
        this.clearKeyboardTimer();
        
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        // Clean up keyboard handler
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
    console.log('🎮 DOM loaded, creating PlusOneGameController');
    window.plusOneGame = new PlusOneGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.plusOneGame) {
        window.plusOneGame.destroy();
    }
});
