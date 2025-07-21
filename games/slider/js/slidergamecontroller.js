class SliderGameController {
    constructor() {
        this.sliderRenderer = new SliderRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
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
    
    createMuteButton() {
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
        
        if (hasMiddleBeads) {
            console.log(`❌ BLOCKED: Invalid arrangement - beads not properly grouped`);
            this.speakText('Arrange beads onto one side or the other, don\'t leave any in the middle');
            this.awaitingButtonPress = false;
            console.log(`Set awaitingButtonPress = false due to invalid arrangement`);
            console.log(`=== END GAME STATE CHECK ===\n`);
            return;
        }
        
        // ONLY if arrangement is valid: Count beads on right side
        console.log(`✅ Valid arrangement - now counting right side beads`);
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        console.log(`Right side count: ${rightSideCount}`);
        
        if (rightSideCount === this.expectedBeadsOnRight && !this.awaitingButtonPress) {
            console.log(`✅ READY: ${rightSideCount} beads on right matches expected ${this.expectedBeadsOnRight} - ENABLING BUTTON`);
            this.awaitingButtonPress = true;
            this.speakText(`Now select the button underneath for the number of beads on the right side.`);
        } else if (rightSideCount > this.expectedBeadsOnRight) {
            console.log(`⏳ WAITING: Have ${rightSideCount} beads, but expecting ${this.expectedBeadsOnRight} - too many`);
            this.awaitingButtonPress = false;
        } else if (rightSideCount < this.expectedBeadsOnRight) {
            console.log(`⏳ WAITING: Have ${rightSideCount} beads, but expecting ${this.expectedBeadsOnRight} - need more`);
            this.awaitingButtonPress = false;
        } else if (this.awaitingButtonPress) {
            console.log(`✅ STILL READY: Already awaiting button press for ${this.expectedBeadsOnRight} beads`);
        }
        
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
        
        // Flash green and create star celebration
        buttonElement.classList.add('correct');
        setTimeout(() => buttonElement.classList.remove('correct'), CONFIG.FLASH_DURATION);
        
        this.createStarCelebration(buttonElement);
        
        // Add rainbow piece
        this.rainbow.addPiece();
        
        // Play completion sound
        this.playCompletionSound();
        
        // Encouragement
        if (this.audioEnabled) {
            const encouragements = ['Well done!', 'Excellent!', 'Perfect!'];
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
        
        console.log(`Starting question ${this.currentQuestion}, expecting ${this.expectedBeadsOnRight} beads on right`);
        
        if (this.currentQuestion === 1) {
            this.speakText('Slide 2 beads to the right side of the slider');
        } else {
            this.speakText('Now slide 2 more beads to the right side of the slider');
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
