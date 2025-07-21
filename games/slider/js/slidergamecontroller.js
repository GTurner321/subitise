class SliderGameController {
    constructor() {
        this.sliderRenderer = new SliderRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        this.guineaPigWave = new GuineaPigWave('../../assets/raisin/');
        
        // Game state
        this.currentQuestion = 1;
        this.expectedBeadsOnRight = 2;
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.awaitingButtonPress = false;
        
        // Multi-touch drag state
        this.dragState = {
            activeTouches: new Map()
        };
        
        // Audio
        this.audioEnabled = CONFIG.AUDIO_ENABLED;
        this.audioContext = null;
        
        // Timing for delayed messages
        this.invalidArrangementTimer = null;
        this.invalidArrangementStartTime = null;
        this.readyForAnswerTimer = null;
        this.readyForAnswerStartTime = null;
        this.lastValidArrangement = false;
        this.sliderDisabled = false; // Track if slider is paused
        
        // Arrow element
        this.arrowElement = null;
        
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
        this.createArrowElement();
        this.shuffleButtons();
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
    
    createArrowElement() {
        this.arrowElement = document.createElement('div');
        this.arrowElement.className = 'slider-arrow';
        this.arrowElement.innerHTML = '↑';
        this.arrowElement.style.cssText = `
            position: absolute;
            font-size: 3rem;
            color: #1a237e;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            opacity: 0;
            pointer-events: none;
            z-index: 100;
            transition: opacity 0.5s ease;
        `;
        
        // Position arrow at 75% horizontally through the frame image, below slider
        this.positionArrow();
        
        document.body.appendChild(this.arrowElement);
        
        // Update arrow position on window resize
        window.addEventListener('resize', () => this.positionArrow());
    }
    
    positionArrow() {
        if (!this.arrowElement || !this.sliderRenderer.frameImageRect) return;
        
        const frameRect = this.sliderRenderer.frameImageRect;
        const containerRect = this.sliderRenderer.containerRect;
        
        // Position at 75% through the frame width, below the slider
        const arrowX = frameRect.x + (frameRect.width * 0.75);
        const arrowY = frameRect.y + (frameRect.height * 0.75); // Below the bottom bar
        
        this.arrowElement.style.left = `${arrowX - 24}px`; // Center the arrow (3rem ≈ 48px, so offset by 24px)
        this.arrowElement.style.top = `${arrowY}px`;
    }
    
    showArrow() {
        if (!this.arrowElement) return;
        
        this.positionArrow();
        this.arrowElement.style.opacity = '1';
        
        // Pulse animation for 4 seconds
        this.arrowElement.style.animation = 'arrowPulse 1s ease-in-out infinite';
        
        // Stop pulsing and fade out after 4 seconds
        setTimeout(() => {
            if (this.arrowElement) {
                this.arrowElement.style.animation = '';
                this.arrowElement.style.opacity = '0';
            }
        }, 4000);
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
        
        // Also stop guinea pig animation if running
        if (this.guineaPigWave) {
            this.guineaPigWave.stopAnimation();
        }
        
        // Unpause slider when clearing timers
        this.sliderDisabled = false;
    }
        const muteContainer = document.createElement('div');
        muteContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        this.muteButton = document.createElement('button');
        this.muteButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        this.updateMuteButtonIcon();
        
        const toggleAudio = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleAudio();
        };
        
        this.muteButton.addEventListener('click', toggleAudio);
        this.muteButton.addEventListener('touchstart', toggleAudio);
        muteContainer.addEventListener('click', toggleAudio);
        muteContainer.addEventListener('touchstart', toggleAudio);
        
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
        CONFIG.AUDIO_ENABLED = this.audioEnabled;
        this.updateMuteButtonIcon();
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        if (this.audioEnabled) {
            setTimeout(() => this.speakText('Audio enabled'), 100);
        }
    }
    
    speakText(text) {
        if (!this.audioEnabled || !('speechSynthesis' in window)) return;
        
        try {
            speechSynthesis.cancel();
            
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1.3;
                utterance.volume = 0.8;
                
                speechSynthesis.speak(utterance);
            }, 50);
        } catch (error) {
            // Silent failure
        }
    }
    
    shuffleButtons() {
        const buttonNumbers = [...CONFIG.BUTTON_NUMBERS];
        
        // Fisher-Yates shuffle
        for (let i = buttonNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [buttonNumbers[i], buttonNumbers[j]] = [buttonNumbers[j], buttonNumbers[i]];
        }
        
        // Apply to buttons
        this.numberButtons.forEach((button, index) => {
            button.dataset.number = buttonNumbers[index];
            button.textContent = buttonNumbers[index];
        });
    }
    
    initializeEventListeners() {
        // Number button clicks with enhanced feedback
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
        
        // Enhanced drag events with no threshold and touch feedback
        this.sliderRenderer.sliderContainer.addEventListener('mousedown', (e) => {
            this.handleDragStart(e.clientX, e.clientY, 'mouse');
        });
        
        document.addEventListener('mousemove', (e) => {
            this.handleDragMove(e.clientX, e.clientY, 'mouse');
        });
        
        document.addEventListener('mouseup', (e) => {
            this.handleDragEnd(e.clientX, e.clientY, 'mouse');
        });
        
        // Touch events with immediate response
        this.sliderRenderer.sliderContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                this.handleDragStart(touch.clientX, touch.clientY, touch.identifier);
            });
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                this.handleDragMove(touch.clientX, touch.clientY, touch.identifier);
            });
        });
        
        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                this.handleDragEnd(touch.clientX, touch.clientY, touch.identifier);
            });
        });
    }
    
    handleDragStart(x, y, touchId = 'mouse') {
        // Ignore drag attempts if slider is disabled
        if (this.sliderDisabled) {
            console.log('Slider disabled - ignoring drag start');
            return;
        }
        
        const bead = this.sliderRenderer.getBeadAtPosition(x, y);
        if (!bead) return;
        
        console.log(`Drag started on ${bead.id} (touch: ${touchId})`);
        
        // Set visual feedback immediately
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
    }
    
    handleDragMove(x, y, touchId = 'mouse') {
        // Ignore drag movements if slider is disabled
        if (this.sliderDisabled) {
            return;
        }
        
        const dragState = this.dragState.activeTouches.get(touchId);
        if (!dragState || !dragState.isDragging || !dragState.draggedBead) return;
        
        const deltaX = x - dragState.startX;
        // Remove drag threshold - start moving immediately
        
        if (!dragState.hasStartedMoving) {
            dragState.hasStartedMoving = true;
            dragState.lastProcessedX = dragState.startX;
            console.log(`Started moving ${dragState.draggedBead.id} (touch: ${touchId})`);
        }
        
        // Calculate movement based on change since last processed position
        const currentDeltaX = x - (dragState.lastProcessedX || dragState.startX);
        
        // Process any movement, no minimum threshold
        if (Math.abs(currentDeltaX) >= 1) {
            const direction = currentDeltaX > 0 ? 1 : -1;
            const movementDistance = Math.abs(currentDeltaX) / this.sliderRenderer.beadDiameter;
            
            // Get connected beads and calculate max movement
            const connectedBeads = this.sliderRenderer.getConnectedBeads(dragState.draggedBead, direction);
            const maxMovement = this.sliderRenderer.calculateBlockMaxMovement(connectedBeads, direction);
            const actualMovement = Math.min(movementDistance, maxMovement);
            
            if (actualMovement > 0.001) {
                const actualDelta = direction > 0 ? actualMovement : -actualMovement;
                this.sliderRenderer.moveBeads(connectedBeads, actualDelta);
                dragState.lastProcessedX = x;
                console.log(`Moved ${actualDelta.toFixed(3)}`);
            } else {
                dragState.lastProcessedX = x;
            }
        }
    }
    
    handleDragEnd(x, y, touchId = 'mouse') {
        const dragState = this.dragState.activeTouches.get(touchId);
        if (!dragState || !dragState.isDragging) return;
        
        const bead = dragState.draggedBead;
        console.log(`Drag ended for ${bead.id} (touch: ${touchId})`);
        
        // Clean up visual feedback
        this.sliderRenderer.setBeadTouchState(bead, false);
        bead.isDragging = false;
        bead.element.classList.remove('dragging');
        
        // Snap to integer positions and check for magnetic snapping
        if (dragState.hasStartedMoving) {
            const snappedPosition = Math.round(bead.position);
            const snapDelta = snappedPosition - bead.position;
            
            if (Math.abs(snapDelta) > 0.001) {
                bead.position = snappedPosition;
                this.sliderRenderer.positionBead(bead);
                this.sliderRenderer.updateBarState();
            }
            
            // Check for magnetic snapping
            this.sliderRenderer.snapToNearbyBeads(bead);
        }
        
        // Remove this touch from active touches
        this.dragState.activeTouches.delete(touchId);
        
        // Check game state after movement
        setTimeout(() => {
            this.checkGameState();
        }, 300);
    }
    
    checkGameState() {
        console.log(`\n=== GAME STATE CHECK ===`);
        console.log(`Expected beads on right: ${this.expectedBeadsOnRight}`);
        console.log(`Currently awaiting button press: ${this.awaitingButtonPress}`);
        console.log(`Buttons disabled: ${this.buttonsDisabled}`);
        
        // FIRST: Check if arrangement is valid (10 out of 11 gaps are zero on each bar)
        console.log(`\n--- CALLING hasBeadsInMiddle() ---`);
        const hasMiddleBeads = this.sliderRenderer.hasBeadsInMiddle();
        console.log(`--- hasBeadsInMiddle() returned: ${hasMiddleBeads} ---\n`);
        
        const currentTime = Date.now();
        const isValidArrangement = !hasMiddleBeads;
        
        if (hasMiddleBeads) {
            console.log(`❌ Invalid arrangement - beads not properly grouped`);
            
            // Start timer for invalid arrangement message (10 seconds)
            if (!this.invalidArrangementStartTime) {
                this.invalidArrangementStartTime = currentTime;
                this.invalidArrangementTimer = setTimeout(() => {
                    console.log(`⏰ 10 seconds of invalid arrangement - giving message`);
                    this.speakText('Arrange beads onto one side or the other, don\'t leave any in the middle');
                }, 10000);
            }
            
            // Clear ready-for-answer timer since arrangement is invalid
            if (this.readyForAnswerTimer) {
                clearTimeout(this.readyForAnswerTimer);
                this.readyForAnswerTimer = null;
                this.readyForAnswerStartTime = null;
            }
            
            this.awaitingButtonPress = false;
            this.lastValidArrangement = false;
            console.log(`Set awaitingButtonPress = false due to invalid arrangement`);
            console.log(`=== END GAME STATE CHECK ===\n`);
            return;
        }
        
        // Valid arrangement - clear invalid arrangement timer
        if (this.invalidArrangementTimer) {
            clearTimeout(this.invalidArrangementTimer);
            this.invalidArrangementTimer = null;
            this.invalidArrangementStartTime = null;
        }
        
        // ONLY if arrangement is valid: Count beads on right side
        console.log(`✅ Valid arrangement - now counting right side beads`);
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        console.log(`Right side count: ${rightSideCount}`);
        
        if (rightSideCount === this.expectedBeadsOnRight) {
            // Correct number of beads - start 3-second timer
            if (!this.readyForAnswerStartTime) {
                this.readyForAnswerStartTime = currentTime;
                this.readyForAnswerTimer = setTimeout(() => {
                    console.log(`⏰ 3 seconds of correct arrangement - pausing slider and showing guinea pig`);
                    
                    // Pause slider
                    this.sliderDisabled = true;
                    
                    // Give audio instruction
                    if (this.currentQuestion === 1) {
                        this.speakText('Now select the button underneath for the number of beads on the right side');
                    } else {
                        this.speakText('Select the matching button underneath');
                    }
                    
                    // Show visual cues
                    this.showArrow();
                    this.guineaPigWave.startAnimation();
                    
                    // Enable button clicking
                    this.awaitingButtonPress = true;
                }, 3000);
                
                console.log(`✅ Correct count (${rightSideCount}) - started 3-second timer`);
            } else {
                console.log(`✅ Correct count (${rightSideCount}) - 3-second timer already running`);
            }
        } else {
            // Wrong number of beads - clear ready timer and unpause slider
            if (this.readyForAnswerTimer) {
                clearTimeout(this.readyForAnswerTimer);
                this.readyForAnswerTimer = null;
                this.readyForAnswerStartTime = null;
                console.log('Cleared 3-second timer due to incorrect count');
            }
            
            this.awaitingButtonPress = false;
            this.sliderDisabled = false; // Unpause slider when arrangement changes
            
            if (rightSideCount > this.expectedBeadsOnRight) {
                console.log(`⏳ WAITING: Have ${rightSideCount} beads, but expecting ${this.expectedBeadsOnRight} - too many`);
            } else {
                console.log(`⏳ WAITING: Have ${rightSideCount} beads, but expecting ${this.expectedBeadsOnRight} - need more`);
            }
        }
        
        this.lastValidArrangement = isValidArrangement;
        console.log(`FINAL STATE: awaitingButtonPress = ${this.awaitingButtonPress}`);
        console.log(`FINAL STATE: buttonsDisabled = ${this.buttonsDisabled}`);
        console.log(`=== END GAME STATE CHECK ===\n`);
    }
    
    handleNumberClick(selectedNumber, buttonElement) {
        console.log(`Button clicked: ${selectedNumber}, awaiting: ${this.awaitingButtonPress}`);
        
        if (!this.awaitingButtonPress) {
            console.log(`Ignored: Not awaiting button press`);
            return;
        }
        
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        
        if (selectedNumber === rightSideCount) {
            this.handleCorrectAnswer(buttonElement);
        } else {
            this.handleIncorrectAnswer(buttonElement);
        }
    }
    
    handleCorrectAnswer(buttonElement) {
        // Enhanced correct answer feedback like subitise game
        this.buttonsDisabled = true;
        
        // Clear any active timers and re-enable slider
        this.clearTimers();
        
        // Flash green and create star celebration
        buttonElement.classList.add('correct');
        setTimeout(() => buttonElement.classList.remove('correct'), CONFIG.FLASH_DURATION);
        
        this.createStarCelebration(buttonElement);
        
        // Add rainbow piece
        this.rainbow.addPiece();
        
        // Play completion sound
        this.playCompletionSound();
        
        // Enhanced encouragement options
        if (this.audioEnabled) {
            const encouragements = ['Well done!', 'Excellent!', 'Perfect!', 'Great job!'];
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            setTimeout(() => this.speakText(randomEncouragement), 400);
        }
        
        // Check if game complete
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        if (rightSideCount === 20 && parseInt(buttonElement.dataset.number) === 20) {
            setTimeout(() => this.completeGame(), CONFIG.NEXT_QUESTION_DELAY);
            return;
        }
        
        // Progress to next question
        this.currentQuestion++;
        this.expectedBeadsOnRight += 2;
        this.awaitingButtonPress = false;
        this.buttonsDisabled = false;
        this.sliderDisabled = false; // Unpause slider for new question
        
        setTimeout(() => this.startNewQuestion(), CONFIG.NEXT_QUESTION_DELAY);
    }
    
    handleIncorrectAnswer(buttonElement) {
        // Enhanced incorrect answer feedback like subitise game
        this.buttonsDisabled = true;
        
        // Play failure sound
        this.playFailureSound();
        
        // Flash red and add cross overlay
        buttonElement.classList.add('incorrect');
        setTimeout(() => buttonElement.classList.remove('incorrect'), CONFIG.FLASH_DURATION);
        
        const crossOverlay = document.createElement('div');
        crossOverlay.className = 'cross-overlay';
        buttonElement.appendChild(crossOverlay);
        
        // Fade out other buttons
        this.numberButtons.forEach(btn => {
            if (btn !== buttonElement) {
                btn.style.transition = 'opacity 700ms ease-in-out';
                btn.style.opacity = '0.1';
            }
        });
        
        // After fade completes, fade back in
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
                
                // Clean up after fade completes
                setTimeout(() => {
                    if (crossOverlay && crossOverlay.parentNode) {
                        crossOverlay.parentNode.removeChild(crossOverlay);
                    }
                    
                    this.numberButtons.forEach(btn => {
                        btn.style.transition = '';
                    });
                    
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
        
        // Star positions around button
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
        
        // Clear any existing timers
        this.clearTimers();
        
        console.log(`Starting question ${this.currentQuestion}, expecting ${this.expectedBeadsOnRight} beads on right`);
        
        if (this.currentQuestion === 1) {
            this.speakText('We\'re going to count in twos, so start by sliding 2 beads to the right side');
            this.showArrow();
        } else {
            this.speakText('Now slide 2 more beads to the right side');
            this.showArrow();
        }
    }
    
    startNewGame() {
        this.currentQuestion = 1;
        this.expectedBeadsOnRight = 2;
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.awaitingButtonPress = false;
        
        this.dragState = {
            activeTouches: new Map()
        };
        
        this.rainbow.reset();
        this.bear.reset();
        this.sliderRenderer.reset();
        this.shuffleButtons();
        this.modal.classList.add('hidden');
        
        setTimeout(() => this.startNewQuestion(), 500);
    }
    
    completeGame() {
        this.gameComplete = true;
        this.bear.startCelebration();
        this.modal.classList.remove('hidden');
        
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Well done! You have correctly counted all the beads. Play again or return to the home page.');
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
