/**
 * Raisin Game Controller - Universal Systems Version
 * Manages game flow, tutorial mode, difficulty progression, and user interactions.
 * Coordinates between RaisinPositionRenderer and RaisinAnimationRenderer.
 * Handles 5-raisin tutorial mode for first 3 questions, then 10-raisin normal mode.
 */
class RaisinGameController {
    constructor() {
        console.log('🐹 Raisin Game Controller - Universal Systems Version');
        
        // Initialize universal components
        this.positionRenderer = new RaisinPositionRenderer();
        this.animationRenderer = new RaisinAnimationRenderer(this.positionRenderer);
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentQuestion = 0;
        this.currentAnswer = 0;
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.questionsCompleted = 0;
        this.raisinsEatenThisQuestion = []; // Track which raisins were eaten for markers
        this.hasShownMarkersThisQuestion = false; // Track if markers have been shown for current question
        
        // FIXED: Track first attempt per question
        this.isFirstAttemptForQuestion = true; // Track if this is first attempt for current question
        
        // Simplified level system tracking
        this.currentLevel = 1; // Start at level 1
        this.consecutiveCorrect = 0; // Track consecutive first-attempt correct answers in level 1
        this.recentAnswers = []; // Track last 2 answers for avoiding repeats
        this.questionCount = 0; // Total questions asked (for first question detection)
        this.completedLevel1 = false; // Track if level 1 is completed
        this.totalQuestionsAsked = 0; // Track total questions across all modes for 10-question limit
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.inactivityDuration = 20000; // 20 seconds
        this.hintGiven = false;
        this.isTabVisible = true;
        
        // DOM elements
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.choiceModal = null; // Will be created dynamically
        
        // System readiness tracking
        this.systemsReady = false;
        this.readyCheckCount = 0;
        
        this.initializeEventListeners();
        this.setupVisibilityHandling();
        this.createChoiceModal();
        this.waitForSystemsAndInitialize();
    }
    
    createChoiceModal() {
        // Create choice modal HTML
        this.choiceModal = document.createElement('div');
        this.choiceModal.className = 'modal hidden';
        this.choiceModal.id = 'choiceModal';
        this.choiceModal.innerHTML = `
            <div class="modal-content choice-modal-content">
                <h2>${CONFIG.AUDIO.CHOICE_MODAL.TITLE}</h2>
                <div class="choice-buttons">
                    <button class="choice-btn continue-5-btn" id="continue5Btn">
                        <i class="fas fa-redo-alt"></i>
                        ${CONFIG.AUDIO.CHOICE_MODAL.CONTINUE_5_BUTTON}
                    </button>
                    <button class="choice-btn try-10-btn" id="try10Btn">
                        <i class="fas fa-arrow-up"></i>
                        ${CONFIG.AUDIO.CHOICE_MODAL.TRY_10_BUTTON}
                    </button>
                </div>
            </div>
        `;
        
        // Add modal styles
        this.addChoiceModalStyles();
        
        // Add to DOM
        document.body.appendChild(this.choiceModal);
        
        // Add event listeners
        const continue5Btn = this.choiceModal.querySelector('#continue5Btn');
        const try10Btn = this.choiceModal.querySelector('#try10Btn');
        
        continue5Btn.addEventListener('click', () => {
            this.chooseLevel1Continue();
        });
        
        try10Btn.addEventListener('click', () => {
            this.chooseLevel2();
        });
    }
    
    addChoiceModalStyles() {
        if (!document.querySelector('#choice-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'choice-modal-styles';
            style.textContent = `
                .choice-modal-content {
                    text-align: center;
                    max-width: 500px;
                    padding: 40px;
                }
                
                .choice-modal-content h2 {
                    color: white;
                    font-size: 2.5rem;
                    margin-bottom: 30px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                
                .choice-modal-content p {
                    color: white;
                    font-size: 1.3rem;
                    margin-bottom: 30px;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                    line-height: 1.4;
                }
                
                .choice-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    align-items: center;
                }
                
                .choice-btn {
                    border: none;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: bold;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                    touch-action: manipulation;
                    pointer-events: auto;
                    outline: none;
                    min-width: 250px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    color: white;
                }
                
                .continue-5-btn {
                    background: #4caf50;
                }
                
                .try-10-btn {
                    background: #2196F3;
                }
                
                .choice-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
                }
                
                .continue-5-btn:hover {
                    background: #45a049;
                }
                
                .try-10-btn:hover {
                    background: #1976D2;
                }
                
                .choice-btn:focus {
                    outline: none;
                }
                
                @media (max-width: 768px) {
                    .choice-modal-content {
                        padding: 30px 20px;
                    }
                    
                    .choice-modal-content h2 {
                        font-size: 2rem;
                    }
                    
                    .choice-modal-content p {
                        font-size: 1.1rem;
                    }
                    
                    .choice-btn {
                        font-size: 1.1rem;
                        padding: 12px 24px;
                        min-width: 220px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    chooseLevel1Continue() {
        console.log('🐹 Player chose to continue with 5 raisins');
        this.choiceModal.classList.add('hidden');
        
        // Reset consecutive counter to start a new set of 3 questions
        this.consecutiveCorrect = 0;
        this.recentAnswers = [];
        this.completedLevel1 = false; // Allow modal to appear again after next 3 correct
        
        // Continue the game
        this.startNewQuestion();
    }
    
    chooseLevel2() {
        console.log('🐹 Player chose to try 10 raisins');
        this.choiceModal.classList.add('hidden');
        
        // Advance to level 2 permanently (no more choice modals)
        this.currentLevel = 2;
        this.consecutiveCorrect = 0;
        this.recentAnswers = [];
        this.completedLevel1 = true; // Permanently completed, no more modals
        
        // Recreate buttons for level 2
        this.createButtons();
        
        setTimeout(() => {
            this.startNewQuestion();
        }, 200);
    }
    
    waitForSystemsAndInitialize() {
        console.log('🐹 Checking system readiness...');
        
        const checkSystemsReady = () => {
            this.readyCheckCount++;
            
            const buttonBarReady = window.ButtonBar && typeof window.ButtonBar.create === 'function';
            const audioSystemReady = window.AudioSystem && typeof window.AudioSystem.speakText === 'function';
            const gameAreaReady = document.querySelector('.game-area');
            
            if (buttonBarReady && audioSystemReady && gameAreaReady) {
                console.log(`🐹 Systems ready after ${this.readyCheckCount} checks`);
                this.systemsReady = true;
                this.createButtons();
                
                setTimeout(() => {
                    this.initializeGame();
                }, 100);
                
                return;
            }
            
            if (this.readyCheckCount >= 40) {
                console.warn('⚠️ Systems not ready, forcing initialization');
                this.systemsReady = true;
                this.forceInitialization();
                return;
            }
            
            setTimeout(checkSystemsReady, 50);
        };
        
        checkSystemsReady();
    }
    
    forceInitialization() {
        console.log('🚨 Force initializing raisin game systems');
        this.systemsReady = true;
        
        if (window.ButtonBar && typeof window.ButtonBar.create === 'function') {
            try {
                this.createButtons();
            } catch (error) {
                console.warn('Button creation failed:', error);
            }
        }
        
        setTimeout(() => {
            this.initializeGame();
        }, 100);
    }
    
    createButtons() {
        // Create buttons based on current level - FIX: Use CONFIG.getButtonCount()
        const buttonCount = CONFIG.getButtonCount(this.currentLevel);
        
        const colors = CONFIG.COLORS.slice(0, buttonCount);
        const numbers = Array.from({length: buttonCount}, (_, i) => i + 1);
        
        console.log(`Creating raisin game buttons: ${buttonCount} buttons for level ${this.currentLevel}`);
        
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
        
        setTimeout(() => {
            if (window.ButtonBar) {
                window.ButtonBar.create(
                    buttonCount,
                    8,      // 8% width of button panel
                    8,      // 8% height of button panel  
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
    
    initializeGame() {
        console.log('🐹 Starting raisin game initialization');
        this.startNewQuestion();
    }
    
    initializeEventListeners() {
        // Play again button
        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });
        
        // Keyboard input support
        document.addEventListener('keydown', (e) => {
            if (this.buttonsDisabled || this.gameComplete) return;
            
            if (e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const selectedNumber = parseInt(e.key);
                
                // Check if this number is available on current buttons
                const maxButton = CONFIG.getButtonCount(this.currentLevel);
                
                if (selectedNumber <= maxButton) {
                    console.log('⌨️ Keyboard input:', selectedNumber);
                    
                    this.clearInactivityTimer();
                    this.startInactivityTimer();
                    this.handleNumberClick(selectedNumber, null); // null for buttonElement since it's keyboard
                }
            }
        });
    }
    
    setupVisibilityHandling() {
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            
            if (!this.isTabVisible) {
                // Tab is hidden - stop all audio and clear timers
                this.clearInactivityTimer();
                this.animationRenderer.stopGuineaPigSounds();
                if (window.AudioSystem) {
                    window.AudioSystem.stopAllAudio();
                }
            } else {
                // Tab is visible again - restart inactivity timer if game is active
                if (!this.gameComplete && !this.buttonsDisabled && this.systemsReady) {
                    this.startInactivityTimer();
                }
            }
        });
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
        if (this.buttonsDisabled || this.gameComplete || !this.isTabVisible) return;
        
        // Mark that hint has been given for this question
        this.hintGiven = true;
        
        const hintMessage = CONFIG.getHintMessage(this.currentLevel);
        this.speakText(hintMessage);
    }
    
    async startNewQuestion() {
        // Check if we've reached the 10-question limit
        if (this.totalQuestionsAsked >= CONFIG.TOTAL_QUESTIONS) {
            this.completeGame();
            return;
        }
        
        // FIXED: Reset first attempt tracking for new question
        this.isFirstAttemptForQuestion = true;
        
        // Reset hint tracking for new question
        this.hintGiven = false;
        this.buttonsDisabled = false;
        this.raisinsEatenThisQuestion = []; // Reset eaten raisins tracking
        this.hasShownMarkersThisQuestion = false; // Reset marker tracking for new question
        
        // Clear any existing missing markers from previous question
        this.positionRenderer.clearMissingMarkers();
        
        // Generate question based on simplified level system
        this.currentAnswer = this.generateAnswerForCurrentMode();
        
        console.log(`Question ${this.totalQuestionsAsked + 1}: Level ${this.currentLevel}, Answer: ${this.currentAnswer}, Consecutive Correct: ${this.consecutiveCorrect}`);
        
        // Start rendering raisins immediately (no delay)
        const renderPromise = this.positionRenderer.renderRaisinsStaggered(this.currentLevel);
        
        // Give starting instruction immediately while raisins are rendering
        this.giveStartingInstruction();
        
        // Wait for raisins to finish rendering
        await renderPromise;
        
        // Select exactly currentAnswer raisins to eat
        const raisinsToEat = this.selectRaisinsToEat();
        this.raisinsEatenThisQuestion = [...raisinsToEat]; // Store for marker display
        
        // Start the guinea pig sequence
        await this.runGuineaPigSequence(raisinsToEat);
        
        // Start inactivity timer after guinea pigs finish
        this.startInactivityTimer();
    }
    
    showChoiceModal() {
        console.log('🐹 Showing choice modal after completing level 1');
        this.completedLevel1 = true;
        this.clearInactivityTimer();
        
        // Show the choice modal
        this.choiceModal.classList.remove('hidden');
        
        // Give audio instruction
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText(CONFIG.AUDIO.CHOICE_MODAL.AUDIO_MESSAGE);
            }, 500);
        }
    }
    
    generateAnswerForCurrentMode() {
        let possibleAnswers;
        
        if (CONFIG.isLevel1(this.currentLevel)) {
            possibleAnswers = CONFIG.LEVEL_SYSTEM.LEVEL_1.POSSIBLE_MISSING;
        } else {
            possibleAnswers = CONFIG.LEVEL_SYSTEM.LEVEL_2.POSSIBLE_MISSING;
        }
        
        // Remove last 2 answers from possible choices to avoid repeats in rolling group of 3
        const availableAnswers = possibleAnswers.filter(answer => 
            !this.recentAnswers.includes(answer)
        );
        
        // If no answers available (shouldn't happen with sets of 4+ items), use all
        const finalAnswers = availableAnswers.length > 0 ? availableAnswers : possibleAnswers;
        
        // Select random answer from available set
        const selectedAnswer = finalAnswers[Math.floor(Math.random() * finalAnswers.length)];
        
        // Update recent answers (keep only last 2)
        this.recentAnswers.push(selectedAnswer);
        if (this.recentAnswers.length > 2) {
            this.recentAnswers.shift(); // Remove oldest
        }
        
        console.log(`🎯 Level ${this.currentLevel} - Selected: ${selectedAnswer}, Recent: [${this.recentAnswers.join(', ')}], Available was: [${finalAnswers.join(', ')}]`);
        
        return selectedAnswer;
    }
    
    selectRaisinsToEat() {
        const totalRaisins = CONFIG.getTotalRaisins(this.currentLevel);
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
        if (!this.isTabVisible) return;
        
        const audioMessages = CONFIG.getAudioMessages(this.currentLevel);
        
        // Only give starting instruction for subsequent questions (not first question)
        if (this.questionCount > 0) {
            setTimeout(() => {
                this.speakText(audioMessages.SUBSEQUENT_QUESTION);
            }, 300); // Reduced delay for faster response
        }
        // First question has no starting instruction now
    }
    
    async runGuineaPigSequence(raisinsToEat) {
        this.buttonsDisabled = true;
        
        // Show guinea pig 3 and raisins - reduced initial display time
        this.animationRenderer.showGuineaPig3();
        
        // Reduced wait for initial display period (was 4 seconds, now 2 seconds)
        await this.sleep(2000);
        
        // For first question only, give extended instruction
        if (this.questionCount === 0) {
            // Different delays based on level (faster for 5 raisins)
            const instructionDelay = this.currentLevel === 1 ? 0 : 500; // No delay for level 1, 500ms for level 2
            
            await this.sleep(instructionDelay);
            
            if (this.isTabVisible) {
                const audioMessages = CONFIG.getAudioMessages(this.currentLevel);
                this.speakText(audioMessages.FIRST_INSTRUCTION);
            }
            
            // Reduced wait time - level-specific (was 1.5s/3s, now 1s/2s)
            const waitTime = this.currentLevel === 1 ? 1000 : 2000;
            await this.sleep(waitTime);
        }
        
        // Fade out guinea pig 3 completely before moving guinea pigs appear
        await this.animationRenderer.fadeOutGuineaPig3();
        
        // Start guinea pig sounds
        this.animationRenderer.startGuineaPigSounds();
        
        // NEW: Add 1 second delay before first traversal
        await this.sleep(1000);
        
        // NEW: Use block-based timing system
        const gp2StartTime = performance.now();
        
        // Guinea pig 2 moves left to right (only after GP3 is completely gone)
        const gp2Promise = this.animationRenderer.moveGuineaPig2(raisinsToEat);
        
        // Schedule raisin eating based on block system for GP2 (top half raisins)
        this.scheduleBlockBasedEating(raisinsToEat, 'gp2', gp2StartTime);
        
        await gp2Promise;
        
        // Short pause
        await this.sleep(CONFIG.GUINEA_PIG_PAUSE_DURATION);
        
        const gp1StartTime = performance.now();
        
        // Guinea pig 1 moves right to left (only after GP2 is completely gone)
        const gp1Promise = this.animationRenderer.moveGuineaPig1(raisinsToEat);
        
        // Schedule raisin eating based on block system for GP1 (bottom half raisins)
        this.scheduleBlockBasedEating(raisinsToEat, 'gp1', gp1StartTime);
        
        await gp1Promise;
        
        // Stop guinea pig sounds
        this.animationRenderer.stopGuineaPigSounds();
        
        // Fade in guinea pig 3 again (only after GP1 is completely gone)
        await this.animationRenderer.fadeInGuineaPig3();
        
        // Give question instruction with 1 second delay after movement completes
        setTimeout(() => {
            if (this.isTabVisible) {
                const audioMessages = CONFIG.getAudioMessages(this.currentLevel);
                this.speakText(audioMessages.QUESTION);
            }
        }, 1000);
        
        this.buttonsDisabled = false;
    }
    
    scheduleBlockBasedEating(raisinsToEat, guineaPigType, startTime) {
        // Block timing definitions (in milliseconds from guinea pig start) - reduced by 30%
        const blockTimings = {
            // GP2 timings (top row, left-to-right)
            0: 431,   // Block (0,0) - was 616ms
            1: 566,   // Block (20,0) - was 808ms
            2: 700,   // Block (40,0) - was 1000ms
            3: 834,   // Block (60,0) - was 1192ms
            4: 969,   // Block (80,0) - was 1384ms
            
            // GP1 timings (bottom row, right-to-left)
            5: 431,   // Block (80,50) - was 616ms
            6: 566,   // Block (60,50) - was 808ms
            7: 700,   // Block (40,50) - was 1000ms
            8: 834,   // Block (20,50) - was 1192ms
            9: 969    // Block (0,50) - was 1384ms
        };
        
        const gameAreaRect = this.positionRenderer.gameArea.getBoundingClientRect();
        const raisinElements = this.positionRenderer.getRaisinElements();
        
        raisinsToEat.forEach(raisinIndex => {
            const raisinElement = raisinElements[raisinIndex];
            if (!raisinElement) return;
            
            const raisinRect = raisinElement.getBoundingClientRect();
            const gameAreaTop = gameAreaRect.top;
            const gameAreaLeft = gameAreaRect.left;
            
            // Convert to game area coordinates (percentages)
            const raisinGameX = ((raisinRect.left + raisinRect.width/2) - gameAreaLeft) / gameAreaRect.width * 100;
            const raisinGameY = ((raisinRect.top + raisinRect.height/2) - gameAreaTop) / gameAreaRect.height * 100;
            
            // Determine which block this raisin is in
            const blockNumber = this.getRaisinBlock(raisinGameX, raisinGameY);
            
            if (blockNumber === -1) return; // Raisin not in any eating path
            
            // Check if this guinea pig should eat this raisin
            const shouldEat = (guineaPigType === 'gp2' && blockNumber <= 4) || 
                            (guineaPigType === 'gp1' && blockNumber >= 5);
            
            if (shouldEat) {
                const eatingTime = blockTimings[blockNumber];
                
                console.log(`🍽️ ${guineaPigType} - Raisin ${raisinIndex} in block ${blockNumber} at (${Math.round(raisinGameX)}%, ${Math.round(raisinGameY)}%) will be eaten at ${eatingTime}ms`);
                
                setTimeout(() => {
                    this.positionRenderer.eatRaisin(raisinIndex);
                }, eatingTime);
            }
        });
    }
    
    getRaisinBlock(raisinX, raisinY) {
        // Define 10 blocks: 5 top row (0-4), 5 bottom row (5-9)
        // Block boundaries: Block (n,m) includes n≤x<n+20 and m≤y<m+50
        
        // Determine which column (0-4)
        let column = -1;
        if (raisinX >= 0 && raisinX < 20) column = 0;
        else if (raisinX >= 20 && raisinX < 40) column = 1;
        else if (raisinX >= 40 && raisinX < 60) column = 2;
        else if (raisinX >= 60 && raisinX < 80) column = 3;
        else if (raisinX >= 80 && raisinX < 100) column = 4;
        
        if (column === -1) return -1; // Not in any column
        
        // Determine which row (top=0, bottom=1)
        let row = -1;
        if (raisinY >= 0 && raisinY < 50) row = 0; // Top half
        else if (raisinY >= 50 && raisinY < 100) row = 1; // Bottom half
        
        if (row === -1) return -1; // Not in eating path
        
        // Calculate block number
        if (row === 0) {
            return column; // Blocks 0-4 (top row)
        } else {
            return 5 + (4 - column); // Blocks 5-9 (bottom row, reversed)
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    handleNumberClick(selectedNumber, buttonElement) {
        // FIXED: Use our own tracking instead of ButtonBar's attempted state
        const wasFirstAttempt = this.isFirstAttemptForQuestion;
        console.log(`🎯 Question answer: ${selectedNumber}, Correct: ${this.currentAnswer}, First attempt: ${wasFirstAttempt}`);
        
        // Mark that an attempt has been made for this question
        this.isFirstAttemptForQuestion = false;
        
        const isCorrect = selectedNumber === this.currentAnswer;
        
        if (isCorrect) {
            this.handleCorrectAnswer(buttonElement, wasFirstAttempt);
        } else {
            this.handleIncorrectAnswer(buttonElement, selectedNumber);
        }
    }
    
    handleCorrectAnswer(buttonElement, wasFirstAttempt) {
        // For keyboard input, find the button element
        if (!buttonElement && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(this.currentAnswer);
        }
        
        // Use ButtonBar for correct feedback
        if (window.ButtonBar) {
            window.ButtonBar.showCorrectFeedback(this.currentAnswer, buttonElement);
        }

        // Play completion sound using AudioSystem
        if (window.AudioSystem) {
            window.AudioSystem.playCompletionSound();
        }

        // Add rainbow piece
        this.rainbow.addPiece();
        
        // Give encouragement for correct answer
        if (this.isTabVisible) {
            const encouragements = CONFIG.AUDIO.ENCOURAGEMENTS;
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            setTimeout(() => {
                this.speakText(randomEncouragement);
            }, 400);
        }
        
        // FIXED: Update level progression based on simplified system
        if (wasFirstAttempt) {
            // Only track consecutive correct for level 1 (5-raisin mode)
            if (this.currentLevel === 1) {
                this.consecutiveCorrect++;
                console.log(`✅ Level 1 - First attempt correct! Consecutive correct: ${this.consecutiveCorrect}`);
                
                // Check if we should show choice modal after this question completes
                if (this.consecutiveCorrect >= 3 && !this.completedLevel1) {
                    console.log(`🎉 Ready to show choice modal after 3 consecutive correct!`);
                }
            }
        } else {
            // Wrong on first attempt - reset consecutive counter only for level 1
            if (this.currentLevel === 1) {
                this.consecutiveCorrect = 0;
                console.log(`❌ Level 1 - Not first attempt, reset consecutive correct count to 0`);
            }
        }
        
        this.currentQuestion++;
        this.questionsCompleted++;
        this.questionCount++; // Track total questions for first question detection
        this.totalQuestionsAsked++; // Track total questions for 10-question limit
        
        // Stop timers
        this.clearInactivityTimer();
        
        // Check if game is complete (10 questions total)
        if (this.totalQuestionsAsked >= CONFIG.TOTAL_QUESTIONS) {
            setTimeout(() => {
                this.completeGame();
            }, CONFIG.NEXT_QUESTION_DELAY + 1000);
            return;
        }

        // Start next question after delay
        setTimeout(() => {
            // Check if we should show choice modal before starting next question
            if (this.currentLevel === 1 && this.consecutiveCorrect >= 3 && !this.completedLevel1) {
                this.showChoiceModal();
            } else {
                this.startNewQuestion();
            }
        }, CONFIG.NEXT_QUESTION_DELAY);
    }
    
    handleIncorrectAnswer(buttonElement, selectedNumber) {
        // Clear inactivity timer and give immediate hint
        this.clearInactivityTimer();
        
        // For keyboard input, find the button element
        if (!buttonElement && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        // Play failure sound using AudioSystem
        if (window.AudioSystem) {
            window.AudioSystem.playFailureSound();
        }
        
        // Disable buttons during error handling
        this.buttonsDisabled = true;
        
        // Use ButtonBar for incorrect feedback
        if (window.ButtonBar) {
            window.ButtonBar.showIncorrectFeedback(selectedNumber, buttonElement);
        }
        
        // Show missing raisin markers if not already shown for this question
        if (!this.hasShownMarkersThisQuestion && this.raisinsEatenThisQuestion.length > 0) {
            console.log('🔴 First wrong attempt for this question - showing missing raisin markers for:', this.raisinsEatenThisQuestion);
            this.hasShownMarkersThisQuestion = true; // Mark that we've shown markers for this question
            
            // Show markers immediately after button feedback starts
            setTimeout(() => {
                this.positionRenderer.showMissingRaisinMarkers(this.raisinsEatenThisQuestion);
            }, 300);
        }
        
        // Give specific wrong answer hint after button animation
        if (this.isTabVisible) {
            setTimeout(() => {
                const audioMessages = CONFIG.getAudioMessages(this.currentLevel);
                this.speakText(audioMessages.WRONG_ANSWER_HINT);
            }, 800);
        }
        
        // Re-enable buttons and restart inactivity timer after ButtonBar animation
        setTimeout(() => {
            this.buttonsDisabled = false;
            this.startInactivityTimer();
        }, 2100);
    }
    
    resetButtonStates() {
        this.buttonsDisabled = false;
        
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(true);
            if (window.ButtonBar.buttons) {
                window.ButtonBar.buttons.forEach(btn => {
                    btn.dataset.attempted = 'false';
                    btn.classList.remove('correct', 'incorrect');
                    btn.style.opacity = '1';
                    btn.style.transition = '';
                    
                    // Remove any existing cross overlays using ButtonBar method
                    window.ButtonBar.removeCrossOverlay(btn);
                });
            }
        }
    }
    
    completeGame() {
        this.gameComplete = true;
        this.clearInactivityTimer();
        this.animationRenderer.stopGuineaPigSounds();
        this.modal.classList.remove('hidden');
        
        // Start bear celebration when modal opens
        this.bear.startCelebration();
        
        // Give completion audio message
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText(CONFIG.AUDIO.COMPLETION_MESSAGE);
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
        this.consecutiveCorrect = 0; // Reset consecutive counter
        this.recentAnswers = []; // Clear recent answers
        this.questionCount = 0; // Reset question count
        this.completedLevel1 = false; // Reset level 1 completion
        this.raisinsEatenThisQuestion = []; // Reset eaten raisins tracking
        this.totalQuestionsAsked = 0; // Reset total question counter
        this.hasShownMarkersThisQuestion = false; // Reset marker tracking
        
        // FIXED: Reset first attempt tracking
        this.isFirstAttemptForQuestion = true;
        
        this.clearInactivityTimer();
        this.animationRenderer.stopGuineaPigSounds();
        
        this.rainbow.reset();
        this.bear.reset();
        this.positionRenderer.reset();
        this.animationRenderer.reset();
        this.modal.classList.add('hidden');
        this.choiceModal.classList.add('hidden');
        
        // Reset button states and recreate for level 1
        this.resetButtonStates();
        this.createButtons();
        
        setTimeout(() => {
            this.startNewQuestion();
        }, 200);
    }
    
    speakText(text, options = {}) {
        if (window.AudioSystem) {
            window.AudioSystem.speakText(text, options);
        }
    }
    
    destroy() {
        // Clean up timers
        this.clearInactivityTimer();
        this.animationRenderer.stopGuineaPigSounds();
        
        // Stop all audio using AudioSystem
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        // Clean up other resources
        this.rainbow.reset();
        this.bear.reset();
        this.positionRenderer.destroy();
        this.animationRenderer.destroy();
        
        // Remove choice modal and styles
        if (this.choiceModal && this.choiceModal.parentNode) {
            this.choiceModal.parentNode.removeChild(this.choiceModal);
        }
        
        const choiceModalStyles = document.querySelector('#choice-modal-styles');
        if (choiceModalStyles) {
            choiceModalStyles.remove();
        }
        
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🐹 DOM loaded, creating RaisinGameController (Universal Systems Version)');
    window.raisinGame = new RaisinGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.raisinGame) {
        window.raisinGame.destroy();
    }
});
