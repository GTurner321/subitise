class SliderGameController {
    constructor() {
        // Game state
        this.currentQuestion = 1;
        this.expectedBeadsOnRight = 2;
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.awaitingButtonPress = false;
        this.sliderDisabled = false;
        this.questionStartTime = null;
        this.usedButtons = new Set(); // Track which button numbers have been used
        
        // Multi-touch drag state
        this.dragState = {
            activeTouches: new Map()
        };
        
        // Velocity tracking for momentum
        this.velocityTracking = new Map(); // touchId -> {positions: [], times: []}
        
        // Timing for delayed messages
        this.invalidArrangementTimer = null;
        this.invalidArrangementStartTime = null;
        this.readyForAnswerTimer = null;
        this.readyForAnswerStartTime = null;
        this.lastActivityTime = null;
        
        // Button help prompts
        this.buttonHelpTimer = null;
        this.buttonHelpStartTime = null;
        this.buttonHelpCount = 0;
        this.maxButtonHelpPrompts = 2;
        
        // Keyboard input handling
        this.keyboardInput = {
            currentInput: '',
            lastKeyTime: 0,
            inputTimeout: null
        };
        
        // UI elements
        this.arrowElement = null;
        
        // DOM elements
        this.numberButtons = document.querySelectorAll('.number-btn');
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // Preload assets before initializing game
        this.preloadAssets().then(() => {
            this.initializeGame();
        });
    }
    
    async preloadAssets() {
        console.log('🔄 Preloading game assets...');
        
        const assetsToLoad = [];
        
        // Preload images
        const imageAssets = [
            '../../assets/slider/sliderframe.png',
            '../../assets/slider/rightarrow.png',
            '../../assets/raisin/guineapig2.png',
            '../../assets/raisin/guineapig3.png'
        ];
        
        imageAssets.forEach(src => {
            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    console.log(`✅ Loaded image: ${src}`);
                    resolve(img);
                };
                img.onerror = () => {
                    console.warn(`⚠️ Failed to load image: ${src}`);
                    resolve(null);
                };
                img.src = src;
            });
            assetsToLoad.push(promise);
        });
        
        // Preload audio
        const audioAssets = [
            '../../assets/slider/click.mp3'
        ];
        
        audioAssets.forEach(src => {
            const promise = new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.oncanplaythrough = () => {
                    console.log(`✅ Loaded audio: ${src}`);
                    resolve(audio);
                };
                audio.onerror = () => {
                    console.warn(`⚠️ Failed to load audio: ${src}`);
                    resolve(null);
                };
                audio.preload = 'auto';
                audio.src = src;
            });
            assetsToLoad.push(promise);
        });
        
        try {
            await Promise.all(assetsToLoad);
            console.log('✅ All assets preloaded successfully');
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.warn('⚠️ Some assets failed to preload, continuing anyway:', error);
        }
    }
    
    initializeGame() {
        // Initialize components after preloading
        this.sliderRenderer = new SliderRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        this.guineaPigWave = new SimplifiedGuineaPigWave('../../assets/raisin/');
        
        this.createArrowElement();
        this.initializeEventListeners();
        this.createButtonsWithUniversalSystem();
        
        // Fade in slider container after preloading is complete and renderer is ready
        setTimeout(() => {
            const sliderContainer = document.getElementById('sliderContainer');
            if (sliderContainer) {
                sliderContainer.classList.add('loaded');
                console.log('✅ Slider container faded in');
                
                // Force a final positioning update after fade-in
                setTimeout(() => {
                    if (this.sliderRenderer) {
                        this.sliderRenderer.updateContainerRect();
                        this.sliderRenderer.repositionAllBeads();
                    }
                }, 100);
            }
        }, 500); // Increased delay to ensure renderer is fully ready
        
        this.startNewQuestion();
    }
    
    createButtonsWithUniversalSystem() {
        // Shuffle the button numbers at the start of each game
        const buttonNumbers = [...CONFIG.BUTTON_NUMBERS];
        for (let i = buttonNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [buttonNumbers[i], buttonNumbers[j]] = [buttonNumbers[j], buttonNumbers[i]];
        }
        
        // Button colors
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
            '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'
        ];
        
        // Create buttons using the universal ButtonBar system
        if (window.ButtonBar) {
            window.ButtonBar.create(
                10,                    // n: 10 buttons
                8,                     // x: 8% of button panel width per button
                8,                     // y: 8% of button panel width for height
                colors,                // button colors
                buttonNumbers,         // button numbers (shuffled)
                (selectedNumber, buttonElement) => {  // click handler
                    if (this.buttonsDisabled) return;
                    this.handleNumberClick(selectedNumber, buttonElement);
                }
            );
            
            // Update the buttons reference for backward compatibility
            this.numberButtons = document.querySelectorAll('.number-btn');
            console.log(`Universal ButtonBar created with ${this.numberButtons.length} buttons`);
        } else {
            console.warn('ButtonBar system not available, using fallback');
            // Fallback to manual button setup if needed
        }
    }
    
    createArrowElement() {
        console.log('🏹 Creating arrow element...');
        
        this.arrowElement = document.createElement('img');
        this.arrowElement.className = 'slider-arrow';
        this.arrowElement.src = '../../assets/slider/rightarrow.png';
        this.arrowElement.alt = 'Right Arrow';
        
        this.arrowElement.style.cssText = `
            position: absolute;
            opacity: 0;
            pointer-events: none;
            z-index: 10;
            transition: opacity 0.5s ease;
        `;
        
        console.log('🏹 Arrow element created, adding to DOM...');
        document.body.appendChild(this.arrowElement);
        
        // Define the positioning function
        const positionSliderArrow = () => {
            console.log('🏹 positionSliderArrow() called');
            
            try {
                if (!this.arrowElement) {
                    console.log('❌ Arrow element not found');
                    return;
                }
                
                const sliderContainer = document.getElementById('sliderContainer');
                if (!sliderContainer) {
                    console.log('❌ Slider container not found');
                    return;
                }
                
                const sliderRect = sliderContainer.getBoundingClientRect();
                console.log('📏 Slider container rect:', sliderRect);
                
                // Arrow size: 12% of container width
                const arrowWidth = sliderRect.width * 0.12;
                const aspectRatio = 517 / 448;
                const arrowHeight = arrowWidth * aspectRatio;
                
                // Center the arrow within the slider container
                const arrowX = sliderRect.left + (sliderRect.width * 0.5);
                const arrowY = sliderRect.top + (sliderRect.height * 0.5);
                
                const finalLeft = arrowX - (arrowWidth / 2);
                const finalTop = arrowY - (arrowHeight / 2);
                
                this.arrowElement.style.cssText = `
                    position: fixed !important;
                    left: ${finalLeft}px !important;
                    top: ${finalTop}px !important;
                    width: ${arrowWidth}px !important;
                    height: ${arrowHeight}px !important;
                    z-index: 1000 !important;
                    opacity: ${this.arrowElement.style.opacity || '0'};
                    pointer-events: none !important;
                    transition: opacity 0.5s ease;
                `;
                
                console.log('🏹 Arrow positioned');
                
            } catch (error) {
                console.error('💥 Error in positioning:', error);
            }
        };
        
        this.positionArrowInline = positionSliderArrow;
        positionSliderArrow();
        
        this.arrowElement.addEventListener('error', () => {
            console.error('❌ Arrow image failed to load:', this.arrowElement.src);
            // Fallback to text arrow if image fails
            this.arrowElement.style.display = 'none';
            const textArrow = document.createElement('div');
            textArrow.innerHTML = '→';
            textArrow.className = 'slider-arrow';
            textArrow.style.cssText = `
                position: absolute;
                font-size: 4rem;
                color: #1a237e;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                opacity: 0;
                pointer-events: none;
                z-index: 10;
                transition: opacity 0.5s ease;
            `;
            this.arrowElement.parentNode.replaceChild(textArrow, this.arrowElement);
            this.arrowElement = textArrow;
            console.log('🏹 Switched to text arrow fallback');
            if (this.positionArrowInline) {
                this.positionArrowInline();
            }
        });
        
        this.arrowElement.addEventListener('load', () => {
            console.log('✅ Arrow image loaded successfully');
        });
        
        window.addEventListener('resize', () => {
            console.log('🏹 Window resized, repositioning arrow...');
            if (this.positionArrowInline) {
                this.positionArrowInline();
            }
        });
        
        console.log('🏹 Arrow element setup complete');
    }
    
    showArrow() {
        if (!this.arrowElement) return;
        
        this.positionArrow();
        this.arrowElement.style.opacity = '1';
        
        // Pulse continuously throughout the entire 4-second duration
        this.arrowElement.style.animation = 'arrowPulse 1s ease-in-out infinite';
        
        setTimeout(() => {
            if (this.arrowElement) {
                this.arrowElement.style.animation = '';
                this.arrowElement.style.opacity = '0';
            }
        }, 4000);
    }
    
    positionArrow() {
        if (!this.arrowElement || !this.positionArrowInline) return;
        this.positionArrowInline();
    }
    
    shuffleButtons() {
        const buttonNumbers = [...CONFIG.BUTTON_NUMBERS];
        
        for (let i = buttonNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [buttonNumbers[i], buttonNumbers[j]] = [buttonNumbers[j], buttonNumbers[i]];
        }
        
        // Use the ButtonBar's shuffle method
        if (window.ButtonBar) {
            window.ButtonBar.shuffleNumbers(buttonNumbers);
        }
        
        // Update the reference for backward compatibility
        this.numberButtons = document.querySelectorAll('.number-btn');
    }
    
    initializeEventListeners() {
        // Keyboard input handling
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Number button clicks (handled by ButtonBar system)
        this.numberButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.buttonsDisabled) return;
                
                const selectedNumber = parseInt(e.target.dataset.number);
                this.handleNumberClick(selectedNumber, e.target);
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.buttonsDisabled) return;
                
                const selectedNumber = parseInt(e.target.dataset.number);
                this.handleNumberClick(selectedNumber, e.target);
            });
        });
        
        // Play again button
        this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        
        // Drag events
        this.sliderRenderer.sliderContainer.addEventListener('mousedown', (e) => {
            this.handleDragStart(e.clientX, e.clientY, 'mouse');
        });
        
        document.addEventListener('mousemove', (e) => {
            this.handleDragMove(e.clientX, e.clientY, 'mouse');
        });
        
        document.addEventListener('mouseup', (e) => {
            this.handleDragEnd(e.clientX, e.clientY, 'mouse');
        });
        
        // Touch events
        this.sliderRenderer.sliderContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                this.handleDragStart(touch.clientX, touch.clientY, touch.identifier);
            });
        });
        
        document.addEventListener('touchmove', (e) => {
            if (this.dragState.activeTouches.size > 0) {
                e.preventDefault();
                Array.from(e.changedTouches).forEach(touch => {
                    this.handleDragMove(touch.clientX, touch.clientY, touch.identifier);
                });
            }
        });
        
        document.addEventListener('touchend', (e) => {
            if (this.dragState.activeTouches.size > 0) {
                e.preventDefault();
                Array.from(e.changedTouches).forEach(touch => {
                    this.handleDragEnd(touch.clientX, touch.clientY, touch.identifier);
                });
            }
        });
    }
    
    handleKeyPress(e) {
        if (this.buttonsDisabled || !this.awaitingButtonPress) return;
        
        const key = e.key;
        if (!/^[0-9]$/.test(key)) return;
        
        e.preventDefault();
        
        const now = Date.now();
        const digit = parseInt(key);
        
        if (this.keyboardInput.inputTimeout) {
            clearTimeout(this.keyboardInput.inputTimeout);
            this.keyboardInput.inputTimeout = null;
        }
        
        if (now - this.keyboardInput.lastKeyTime > 3000) {
            this.keyboardInput.currentInput = '';
        }
        
        this.keyboardInput.currentInput += digit;
        this.keyboardInput.lastKeyTime = now;
        
        console.log(`Keyboard input: ${this.keyboardInput.currentInput}, expected: ${this.expectedBeadsOnRight}`);
        
        if (this.keyboardInput.currentInput.length === 1) {
            const singleDigit = parseInt(this.keyboardInput.currentInput);
            
            if ([2, 4, 6, 8].includes(singleDigit) && singleDigit === this.expectedBeadsOnRight) {
                this.processKeyboardInput(singleDigit);
                return;
            }
            
            if (digit === 2 && this.expectedBeadsOnRight === 20) {
                this.keyboardInput.inputTimeout = setTimeout(() => {
                    this.resetKeyboardInput();
                }, 3000);
                return;
            }
            
            if (digit === 1) {
                this.keyboardInput.inputTimeout = setTimeout(() => {
                    this.resetKeyboardInput();
                }, 3000);
                return;
            }
            
            this.resetKeyboardInput();
            return;
        }
        
        if (this.keyboardInput.currentInput.length === 2) {
            const twoDigit = parseInt(this.keyboardInput.currentInput);
            
            if (twoDigit === this.expectedBeadsOnRight) {
                this.processKeyboardInput(twoDigit);
            } else {
                this.handleIncorrectKeyboardInput(twoDigit);
            }
            return;
        }
        
        this.resetKeyboardInput();
    }
    
    processKeyboardInput(number) {
        const targetButton = Array.from(this.numberButtons).find(btn => 
            parseInt(btn.dataset.number) === number
        );
        
        if (targetButton) {
            this.resetKeyboardInput();
            this.handleNumberClick(number, targetButton);
        }
    }
    
    handleIncorrectKeyboardInput(number) {
        const targetButton = Array.from(this.numberButtons).find(btn => 
            parseInt(btn.dataset.number) === number
        );
        
        if (targetButton) {
            this.resetKeyboardInput();
            this.handleIncorrectAnswer(targetButton);
        } else {
            this.resetKeyboardInput();
        }
    }
    
    resetKeyboardInput() {
        this.keyboardInput.currentInput = '';
        this.keyboardInput.lastKeyTime = 0;
        if (this.keyboardInput.inputTimeout) {
            clearTimeout(this.keyboardInput.inputTimeout);
            this.keyboardInput.inputTimeout = null;
        }
    }
    
    handleDragStart(x, y, touchId = 'mouse') {
        if (this.sliderDisabled) return;
        
        this.lastActivityTime = Date.now();
        
        const bead = this.sliderRenderer.getBeadAtPosition(x, y);
        if (!bead) return;
        
        this.sliderRenderer.setBeadTouchState(bead, true);
        bead.element.classList.add('dragging');
        
        const dragState = {
            isDragging: true,
            draggedBead: bead,
            startX: x,
            startY: y,
            startPosition: bead.position,
            hasStartedMoving: false,
            lastProcessedX: x
        };
        
        this.dragState.activeTouches.set(touchId, dragState);
        bead.isDragging = true;
        
        this.velocityTracking.set(touchId, {
            positions: [x],
            times: [Date.now()]
        });
    }
    
    handleDragMove(x, y, touchId = 'mouse') {
        if (this.sliderDisabled) return;
        
        this.lastActivityTime = Date.now();
        
        const dragState = this.dragState.activeTouches.get(touchId);
        if (!dragState || !dragState.isDragging || !dragState.draggedBead) return;
        
        const velocityData = this.velocityTracking.get(touchId);
        if (velocityData) {
            const now = Date.now();
            velocityData.positions.push(x);
            velocityData.times.push(now);
            
            while (velocityData.times.length > 1 && now - velocityData.times[0] > 100) {
                velocityData.positions.shift();
                velocityData.times.shift();
            }
        }
        
        if (!dragState.hasStartedMoving) {
            dragState.hasStartedMoving = true;
            dragState.lastProcessedX = dragState.startX;
        }
        
        const currentDeltaX = x - (dragState.lastProcessedX || dragState.startX);
        
        if (Math.abs(currentDeltaX) >= 1) {
            const direction = currentDeltaX > 0 ? 1 : -1;
            const movementDistance = Math.abs(currentDeltaX) / this.sliderRenderer.beadDiameter;
            
            const connectedBeads = this.sliderRenderer.getConnectedBeads(dragState.draggedBead, direction);
            const maxMovement = this.sliderRenderer.calculateBlockMaxMovement(connectedBeads, direction);
            const actualMovement = Math.min(movementDistance, maxMovement);
            
            if (actualMovement > 0.001) {
                const actualDelta = direction > 0 ? actualMovement : -actualMovement;
                this.sliderRenderer.moveBeads(connectedBeads, actualDelta);
                dragState.lastProcessedX = x;
            } else {
                dragState.lastProcessedX = x;
            }
        }
    }
    
    handleDragEnd(x, y, touchId = 'mouse') {
        const dragState = this.dragState.activeTouches.get(touchId);
        if (!dragState || !dragState.isDragging) return;
        
        this.lastActivityTime = Date.now();
        
        const bead = dragState.draggedBead;
        
        this.sliderRenderer.setBeadTouchState(bead, false);
        bead.isDragging = false;
        bead.element.classList.remove('dragging');
        
        const velocityData = this.velocityTracking.get(touchId);
        let velocity = 0;
        
        if (velocityData && velocityData.positions.length >= 2) {
            const recentPositions = velocityData.positions.slice(-5);
            const recentTimes = velocityData.times.slice(-5);
            
            if (recentPositions.length >= 2) {
                const deltaX = recentPositions[recentPositions.length - 1] - recentPositions[0];
                const deltaTime = (recentTimes[recentTimes.length - 1] - recentTimes[0]) / 1000;
                
                if (deltaTime > 0) {
                    velocity = (deltaX / this.sliderRenderer.beadDiameter) / deltaTime;
                    
                    if (Math.abs(velocity) > 2) {
                        this.sliderRenderer.startMomentum(bead, velocity);
                    } else {
                        if (dragState.hasStartedMoving) {
                            const snappedPosition = Math.round(bead.position);
                            const snapDelta = snappedPosition - bead.position;
                            
                            if (Math.abs(snapDelta) > 0.001) {
                                bead.position = snappedPosition;
                                this.sliderRenderer.positionBead(bead);
                                this.sliderRenderer.updateBarState();
                            }
                            
                            this.sliderRenderer.snapToNearbyBeads(bead);
                        }
                    }
                }
            }
        } else {
            if (dragState.hasStartedMoving) {
                const snappedPosition = Math.round(bead.position);
                const snapDelta = snappedPosition - bead.position;
                
                if (Math.abs(snapDelta) > 0.001) {
                    bead.position = snappedPosition;
                    this.sliderRenderer.positionBead(bead);
                    this.sliderRenderer.updateBarState();
                }
                
                this.sliderRenderer.snapToNearbyBeads(bead);
            }
        }
        
        this.dragState.activeTouches.delete(touchId);
        this.velocityTracking.delete(touchId);
        
        setTimeout(() => this.checkGameState(), 300);
    }
    
    checkGameState() {
        const currentTime = Date.now();
        
        console.log('🎮 Game state check - reconciling bead states first...');
        this.sliderRenderer.reconcileAllBeadStates();
        
        const hasMiddleBeads = this.sliderRenderer.hasBeadsInMiddle();
        
        if (hasMiddleBeads) {
            if (this.readyForAnswerTimer) {
                clearTimeout(this.readyForAnswerTimer);
                this.readyForAnswerTimer = null;
                this.readyForAnswerStartTime = null;
            }
            
            if (!this.invalidArrangementStartTime) {
                this.invalidArrangementStartTime = currentTime;
                this.lastActivityTime = currentTime;
                this.scheduleInactivityCheck();
            }
            
            this.awaitingButtonPress = false;
            return;
        }
        
        if (this.invalidArrangementTimer) {
            clearTimeout(this.invalidArrangementTimer);
            this.invalidArrangementTimer = null;
            this.invalidArrangementStartTime = null;
        }
        
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        
        if (rightSideCount === this.expectedBeadsOnRight) {
            this.awaitingButtonPress = false;
            
            if (!this.readyForAnswerStartTime) {
                this.readyForAnswerStartTime = currentTime;
                this.readyForAnswerTimer = setTimeout(() => {
                    console.log('🎮 Final check before enabling buttons...');
                    this.sliderRenderer.reconcileAllBeadStates();
                    const finalRightSideCount = this.sliderRenderer.countBeadsOnRightSide();
                    
                    if (finalRightSideCount !== this.expectedBeadsOnRight) {
                        console.log('⚠️ Count changed during 2-second wait, resetting timer');
                        this.readyForAnswerStartTime = null;
                        return;
                    }
                    
                    this.sliderDisabled = true;
                    this.awaitingButtonPress = true;
                    
                    this.rainbow.addPiece();
                    
                    if (this.currentQuestion === 1) {
                        if (window.AudioSystem) {
                            window.AudioSystem.speakText('Select the button underneath for the number of beads on the right side');
                        }
                    } else {
                        if (window.AudioSystem) {
                            window.AudioSystem.speakText('Select the matching button underneath');
                        }
                    }
                    
                    this.guineaPigWave.startAnimation(70);
                    
                    // Start button help timer system
                    this.startButtonHelpTimer();
                }, 2000);
            }
        } else {
            if (this.readyForAnswerTimer) {
                clearTimeout(this.readyForAnswerTimer);
                this.readyForAnswerTimer = null;
                this.readyForAnswerStartTime = null;
            }
            
            this.awaitingButtonPress = false;
        }
    }
    
    startButtonHelpTimer() {
        // Clear any existing button help timer
        this.clearButtonHelpTimer();
        
        // Reset help count for this question
        this.buttonHelpCount = 0;
        this.buttonHelpStartTime = Date.now();
        
        console.log('🕐 Starting button help timer system');
        
        // First prompt after 10 seconds of inactivity
        this.scheduleButtonHelpPrompt(10000);
    }
    
    scheduleButtonHelpPrompt(delay) {
        this.buttonHelpTimer = setTimeout(() => {
            // Only show help if still awaiting button press and haven't exceeded max prompts
            if (this.awaitingButtonPress && this.buttonHelpCount < this.maxButtonHelpPrompts) {
                this.buttonHelpCount++;
                console.log(`🔔 Button help prompt ${this.buttonHelpCount}/${this.maxButtonHelpPrompts}`);
                
                if (window.AudioSystem) {
                    window.AudioSystem.speakText('Carefully count the total number of beads on both of the bars on the right side of the slider, then select the matching button');
                }
                
                // Schedule next prompt after 15 seconds if we haven't reached the limit
                if (this.buttonHelpCount < this.maxButtonHelpPrompts) {
                    this.scheduleButtonHelpPrompt(15000);
                }
            }
        }, delay);
    }
    
    clearButtonHelpTimer() {
        if (this.buttonHelpTimer) {
            clearTimeout(this.buttonHelpTimer);
            this.buttonHelpTimer = null;
        }
        this.buttonHelpStartTime = null;
    }
        if (this.invalidArrangementTimer) {
            clearTimeout(this.invalidArrangementTimer);
        }
        
        this.invalidArrangementTimer = setTimeout(() => {
            const now = Date.now();
            const timeSinceActivity = now - (this.lastActivityTime || now);
            
            if (timeSinceActivity >= 10000 && this.sliderRenderer.hasBeadsInMiddle()) {
                if (this.currentQuestion === 1) {
                    if (window.AudioSystem) {
                        window.AudioSystem.speakText('You need to put 2 beads on the right side in total, with no beads left in the middle');
                    }
                } else {
                    const previousTarget = this.expectedBeadsOnRight - 2;
                    if (window.AudioSystem) {
                        window.AudioSystem.speakText(`You had ${previousTarget} beads on the right side, now you need 2 more. Make sure no beads are left in the middle`);
                    }
                }
                
                this.lastActivityTime = now;
                this.scheduleInactivityCheck();
            } else if (this.sliderRenderer.hasBeadsInMiddle()) {
                const remainingTime = Math.max(100, 10000 - timeSinceActivity);
                this.invalidArrangementTimer = setTimeout(() => this.scheduleInactivityCheck(), remainingTime);
            }
        }, 10000);
    }
    
    handleNumberClick(selectedNumber, buttonElement) {
        if (!this.awaitingButtonPress) return;
        
        // Clear button help timer when any button is clicked
        this.clearButtonHelpTimer();
        
        if (this.usedButtons.has(selectedNumber)) {
            this.handleUsedButtonClick(buttonElement);
            // Restart button help timer for used button clicks (incorrect action)
            this.startButtonHelpTimer();
            return;
        }
        
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        
        if (selectedNumber === rightSideCount) {
            this.handleCorrectAnswer(buttonElement);
        } else {
            this.handleIncorrectAnswer(buttonElement);
            // Restart button help timer after incorrect answer
            // Wait a bit for the incorrect answer animation to complete
            setTimeout(() => {
                if (this.awaitingButtonPress) {
                    this.startButtonHelpTimer();
                }
            }, 2500); // After incorrect answer animations complete
        }
    }
    
    handleUsedButtonClick(buttonElement) {
        if (window.AudioSystem) {
            window.AudioSystem.playFailureSound();
        }
        
        buttonElement.style.animation = 'buttonJiggle 0.5s ease-in-out';
        setTimeout(() => {
            buttonElement.style.animation = '';
        }, 500);
    }
    
    handleCorrectAnswer(buttonElement) {
        this.buttonsDisabled = true;
        this.clearTimers(); // This will also clear button help timer
        
        const selectedNumber = parseInt(buttonElement.dataset.number);
        this.usedButtons.add(selectedNumber);
        
        if (window.ButtonBar) {
            window.ButtonBar.markButtonAsUsed(buttonElement);
            window.ButtonBar.animateButton(buttonElement, 'correct');
        }
        
        this.createStarCelebration(buttonElement);
        
        if (window.AudioSystem) {
            window.AudioSystem.playCompletionSound();
            
            const encouragements = ['Well done!', 'Excellent!', 'Perfect!', 'Great job!'];
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
            setTimeout(() => {
                window.AudioSystem.speakText(`${randomEncouragement} There are ${rightSideCount} beads on the right.`);
            }, 400);
        }
        
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        if (rightSideCount === 20 && parseInt(buttonElement.dataset.number) === 20) {
            setTimeout(() => this.completeGame(), CONFIG.NEXT_QUESTION_DELAY);
            return;
        }
        
        this.currentQuestion++;
        this.expectedBeadsOnRight += 2;
        this.awaitingButtonPress = false;
        this.buttonsDisabled = false;
        this.sliderDisabled = true;
        
        setTimeout(() => this.startNewQuestion(), CONFIG.NEXT_QUESTION_DELAY + 1500);
    }
    
    handleIncorrectAnswer(buttonElement) {
        this.buttonsDisabled = true;
        
        if (window.AudioSystem) {
            window.AudioSystem.playFailureSound();
        }
        
        if (window.ButtonBar) {
            window.ButtonBar.animateButton(buttonElement, 'incorrect');
        }
        
        const crossOverlay = document.createElement('div');
        crossOverlay.className = 'cross-overlay';
        buttonElement.appendChild(crossOverlay);
        
        // Disable other buttons temporarily
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(false);
        }
        
        // Fade out other buttons
        this.numberButtons.forEach(btn => {
            if (btn !== buttonElement) {
                btn.style.transition = 'opacity 700ms ease-in-out';
                btn.style.opacity = '0.1';
            }
        });
        
        setTimeout(() => {
            setTimeout(() => {
                // Restore other buttons
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
                    
                    // Re-enable buttons
                    if (window.ButtonBar) {
                        window.ButtonBar.setButtonsEnabled(true);
                    }
                    this.buttonsDisabled = false;
                }, 700);
            }, 700);
        }, 700);
    }
    
    createStarCelebration(buttonElement) {
        const buttonRect = buttonElement.getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;
        
        const starContainer = document.createElement('div');
        starContainer.className = 'star-celebration-container completion-effect';
        starContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        const starPositions = [
            { x: centerX - 60, y: centerY - 60 },
            { x: centerX + 60, y: centerY - 60 },
            { x: centerX + 72, y: centerY },
            { x: centerX + 60, y: centerY + 60 },
            { x: centerX - 60, y: centerY + 60 },
            { x: centerX - 72, y: centerY }
        ];
        
        starPositions.forEach((pos, index) => {
            const star = this.createStar(pos.x, pos.y);
            star.style.animationDelay = `${index * 0.1}s`;
            starContainer.appendChild(star);
        });
        
        document.body.appendChild(starContainer);
        
        setTimeout(() => {
            if (starContainer.parentNode) {
                starContainer.parentNode.removeChild(starContainer);
            }
        }, 2000);
    }
    
    createStar(x, y) {
        const star = document.createElement('div');
        star.className = 'completion-star';
        star.innerHTML = '✨';
        star.style.cssText = `
            position: fixed;
            left: ${x - 15}px;
            top: ${y - 15}px;
            font-size: 30px;
            color: #FFD700;
            text-align: center;
            pointer-events: none;
            z-index: 1000;
        `;
        
        return star;
    }
    
    startNewQuestion() {
        if (this.gameComplete) return;
        
        this.clearTimers(); // Clear all timers including button help
        this.resetKeyboardInput();
        this.questionStartTime = Date.now();
        
        if (this.currentQuestion === 1) {
            setTimeout(() => {
                if (window.AudioSystem) {
                    window.AudioSystem.speakText('We\'re going to count in twos. Start by sliding 2 beads to the right side');
                }
                setTimeout(() => {
                    this.sliderDisabled = false;
                }, 3000);
            }, 1000);
            setTimeout(() => this.showArrowBriefly(2500), 3500);
        } else {
            setTimeout(() => {
                if (window.AudioSystem) {
                    window.AudioSystem.speakText('Slide 2 more beads across');
                }
                this.sliderDisabled = false;
            }, 1000);
            setTimeout(() => this.showArrowBriefly(3000), 1000);
        }
        
        setTimeout(() => this.checkGameState(), 100);
    }
    
    showArrowBriefly(duration = 3000) {
        console.log('🏹 showArrowBriefly called with duration:', duration);
        
        if (!this.arrowElement) {
            console.log('❌ No arrow element in showArrowBriefly');
            return;
        }
        
        console.log('🏹 Arrow element exists, calling positioning...');
        
        try {
            if (this.positionArrowInline) {
                this.positionArrowInline();
                console.log('✅ inline positioning call completed');
            } else {
                console.log('❌ inline positioning function not available');
            }
        } catch (error) {
            console.error('💥 Error calling inline positioning:', error);
        }
        
        console.log('🏹 Setting arrow opacity to 1...');
        this.arrowElement.style.opacity = '1';
        
        this.arrowElement.style.animation = 'arrowPulse 1s ease-in-out infinite';
        console.log('🏹 Arrow animation started');
        
        setTimeout(() => {
            if (this.arrowElement) {
                console.log('🏹 Hiding arrow after', duration, 'ms');
                this.arrowElement.style.animation = '';
                this.arrowElement.style.opacity = '0';
            }
        }, duration);
    }
    
    startNewGame() {
        this.currentQuestion = 1;
        this.expectedBeadsOnRight = 2;
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.awaitingButtonPress = false;
        this.sliderDisabled = true;
        this.lastActivityTime = null;
        this.usedButtons.clear();
        
        this.clearTimers(); // Clear all timers including button help
        this.resetKeyboardInput();
        
        this.dragState = {
            activeTouches: new Map()
        };
        
        this.velocityTracking.clear();
        
        this.rainbow.reset();
        this.bear.reset();
        this.sliderRenderer.reset();
        this.shuffleButtons();
        this.modal.classList.add('hidden');
        
        setTimeout(() => this.startNewQuestion(), 500);
    }
    
    completeGame() {
        this.gameComplete = true;
        this.clearTimers(); // Clear all timers including button help
        this.resetKeyboardInput();
        
        this.bear.startCelebration();
        this.modal.classList.remove('hidden');
        
        if (window.AudioSystem) {
            setTimeout(() => {
                window.AudioSystem.speakText('2, 4, 6, 8, who do we appreciate? Well done! Play again or return to the home page.');
            }, 2000);
        }
    }
    
    clearTimers() {
        if (this.invalidArrangementTimer) {
            clearTimeout(this.invalidArrangementTimer);
            this.invalidArrangementTimer = null;
        }
        if (this.readyForAnswerTimer) {
            clearTimeout(this.readyForAnswerTimer);
            this.readyForAnswerTimer = null;
        }
        this.invalidArrangementStartTime = null;
        this.readyForAnswerStartTime = null;
        
        // Clear button help timer
        this.clearButtonHelpTimer();
        
        this.sliderDisabled = false;
    }
    
    destroy() {
        this.clearTimers(); // This now includes button help timer
        this.resetKeyboardInput();
        
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        if (this.arrowElement && this.arrowElement.parentNode) {
            this.arrowElement.parentNode.removeChild(this.arrowElement);
        }
        
        if (this.guineaPigWave) {
            this.guineaPigWave.destroy();
        }
        
        // Clean up ButtonBar
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
        
        this.rainbow.reset();
        this.bear.reset();
        this.sliderRenderer.reset();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sliderGame = new SliderGameController();
});

// Clean up resources when page unloads
window.addEventListener('beforeunload', () => {
    if (window.sliderGame) {
        window.sliderGame.destroy();
    }
});
