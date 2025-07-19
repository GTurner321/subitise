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
        
        // Multi-touch drag state - support for simultaneous bar interaction
        this.dragState = {
            activeTouches: new Map() // Map of touchId/mouseId to individual drag states
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
        
        // Add both click and touch event listeners
        const toggleAudio = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleAudio();
        };
        
        this.muteButton.addEventListener('click', toggleAudio);
        this.muteButton.addEventListener('touchstart', toggleAudio);
        muteContainer.addEventListener('click', toggleAudio);
        muteContainer.addEventListener('touchstart', toggleAudio);
        
        // Hover effects for mouse
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
        CONFIG.AUDIO_ENABLED = this.audioEnabled; // Update the global config too
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
            // Cancel any existing speech to prevent overlap
            speechSynthesis.cancel();
            
            // Wait a moment for cancellation to take effect
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
        // Number button clicks
        this.numberButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.buttonsDisabled) return;
                
                const selectedNumber = parseInt(e.target.dataset.number);
                this.handleNumberClick(selectedNumber, e.target);
            });
        });
        
        // Play again button
        this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        
        // Mouse events for dragging - use 'mouse' as the touchId
        this.sliderRenderer.sliderContainer.addEventListener('mousedown', (e) => {
            this.handleDragStart(e.clientX, e.clientY, 'mouse');
        });
        
        document.addEventListener('mousemove', (e) => {
            this.handleDragMove(e.clientX, e.clientY, 'mouse');
        });
        
        document.addEventListener('mouseup', (e) => {
            this.handleDragEnd(e.clientX, e.clientY, 'mouse');
        });
        
        // Touch events - support multi-touch
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
        
        console.log(`Drag started on ${bead.id} at position ${bead.position.toFixed(3)} (touch: ${touchId})`);
        
        // Create individual drag state for this touch
        const dragState = {
            isDragging: true,
            draggedBead: bead,
            startX: x,
            startY: y,
            startPosition: bead.position,
            hasStartedMoving: false,
            connectedBlock: [bead] // Start with just the single bead
        };
        
        this.dragState.activeTouches.set(touchId, dragState);
        
        bead.isDragging = true;
        bead.element.classList.add('dragging');
    }
    
    handleDragMove(x, y, touchId = 'mouse') {
        const dragState = this.dragState.activeTouches.get(touchId);
        if (!dragState || !dragState.isDragging || !dragState.draggedBead) return;
        
        const deltaX = x - dragState.startX;
        const dragThreshold = this.sliderRenderer.beadDiameter; // Must drag one diameter to start
        
        // Check if we've moved enough to start dragging
        if (!dragState.hasStartedMoving && Math.abs(deltaX) < dragThreshold) {
            return;
        }
        
        if (!dragState.hasStartedMoving) {
            dragState.hasStartedMoving = true;
            console.log(`Started moving ${dragState.draggedBead.id} (touch: ${touchId})`);
            // Update connected beads at the moment movement starts
            dragState.connectedBlock = this.sliderRenderer.getConnectedBeads(dragState.draggedBead);
        }
        
        // Calculate movement direction and distance from the threshold point
        const direction = deltaX > 0 ? 1 : -1;
        const movementBeyondThreshold = Math.abs(deltaX) - dragThreshold;
        const positionDelta = (movementBeyondThreshold / this.sliderRenderer.beadDiameter) * direction;
        
        // Calculate target position based ONLY on horizontal drag component
        const targetPosition = dragState.startPosition + positionDelta;
        
        console.log(`Touch ${touchId} - Drag delta: ${deltaX.toFixed(1)}, position delta: ${positionDelta.toFixed(3)}, target: ${targetPosition.toFixed(3)}`);
        
        // Check how far the block can actually move
        const block = dragState.connectedBlock;
        const requestedDistance = Math.abs(targetPosition - dragState.draggedBead.position);
        const maxMovement = this.sliderRenderer.canMoveBlock(block, direction, requestedDistance);
        
        // Apply the movement if there's space - but limit to the actual drag amount
        if (maxMovement > 0.001) {
            const actualDelta = direction > 0 ? 
                Math.min(maxMovement, positionDelta) : 
                Math.max(-maxMovement, positionDelta);
            
            // Only move if the movement aligns with our drag
            if ((direction > 0 && actualDelta > 0) || (direction < 0 && actualDelta < 0)) {
                this.sliderRenderer.moveBlock(block, actualDelta);
            }
        }
    }
    
    handleDragEnd(x, y, touchId = 'mouse') {
        const dragState = this.dragState.activeTouches.get(touchId);
        if (!dragState || !dragState.isDragging) return;
        
        const bead = dragState.draggedBead;
        console.log(`Drag ended for ${bead.id} (touch: ${touchId})`);
        
        // Clean up dragging state
        bead.isDragging = false;
        bead.element.classList.remove('dragging');
        
        // Snap to integer positions if we moved
        if (dragState.hasStartedMoving) {
            const snappedPosition = Math.round(bead.position);
            const snapDelta = snappedPosition - bead.position;
            
            if (Math.abs(snapDelta) > 0.001) {
                this.sliderRenderer.moveBlock(dragState.connectedBlock, snapDelta);
            }
            
            // Check for magnetic snapping to nearby beads or bar ends
            this.sliderRenderer.snapToNearbyBeads(bead);
        }
        
        // Remove this touch from active touches
        this.dragState.activeTouches.delete(touchId);
        
        // Check game state after a delay if no more active drags
        if (this.dragState.activeTouches.size === 0) {
            setTimeout(() => this.checkGameState(), 300);
        }
    }
    
    checkGameState() {
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        const hasMiddleBeads = this.sliderRenderer.hasBeadsInMiddle();
        
        console.log(`Game state check: ${rightSideCount} beads on right, expected: ${this.expectedBeadsOnRight}, has middle beads: ${hasMiddleBeads}`);
        
        if (hasMiddleBeads) {
            this.speakText('Arrange beads onto one side or the other, don\'t leave any in the middle');
            this.awaitingButtonPress = false;
            return;
        }
        
        // Check if we have the expected number of beads on the right side
        if (rightSideCount === this.expectedBeadsOnRight && !this.awaitingButtonPress) {
            this.awaitingButtonPress = true;
            this.speakText(`Now select the button underneath for the number of beads on the right side.`);
        }
        // If we have more than expected, let them continue but don't prompt yet
        else if (rightSideCount > this.expectedBeadsOnRight) {
            this.awaitingButtonPress = false;
        }
        // If we have fewer than expected, they need to move more beads
        else if (rightSideCount < this.expectedBeadsOnRight) {
            this.awaitingButtonPress = false;
        }
    }
    
    handleNumberClick(selectedNumber, buttonElement) {
        if (!this.awaitingButtonPress) return;
        
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        
        console.log(`Button clicked: ${selectedNumber}, actual count: ${rightSideCount}, expected: ${this.expectedBeadsOnRight}`);
        
        // Check if the selected number matches the actual count on the right
        if (selectedNumber === rightSideCount) {
            this.handleCorrectAnswer(buttonElement);
        } else {
            this.handleIncorrectAnswer(buttonElement);
        }
    }
    
    handleCorrectAnswer(buttonElement) {
        // Flash green
        buttonElement.classList.add('correct');
        setTimeout(() => buttonElement.classList.remove('correct'), CONFIG.FLASH_DURATION);
        
        // Add rainbow piece
        this.rainbow.addPiece();
        
        // Play sound
        this.playCompletionSound();
        
        // Encouragement
        if (this.audioEnabled) {
            const encouragements = ['Well done!', 'Excellent!', 'Perfect!'];
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            setTimeout(() => this.speakText(randomEncouragement), 400);
        }
        
        // Check if this was the final answer (20 beads)
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        
        console.log(`Correct answer: selected button had ${buttonElement.dataset.number}, actual count: ${rightSideCount}, current question: ${this.currentQuestion}`);
        
        if (rightSideCount === 20 && parseInt(buttonElement.dataset.number) === 20) {
            // Game is complete - all 20 beads are on right and 20 button was pressed
            console.log('GAME COMPLETE - All 20 beads on right and 20 button pressed');
            setTimeout(() => this.completeGame(), CONFIG.NEXT_QUESTION_DELAY);
            return;
        }
        
        // Otherwise, continue to next question
        this.currentQuestion++;
        this.expectedBeadsOnRight += 2; // Always increment by 2
        this.awaitingButtonPress = false;
        
        console.log(`Question ${this.currentQuestion}, now expecting ${this.expectedBeadsOnRight} beads on right`);
        
        // Start next question - but don't reset bead positions
        setTimeout(() => this.startNewQuestion(), CONFIG.NEXT_QUESTION_DELAY);
    }
    
    handleIncorrectAnswer(buttonElement) {
        // Flash red
        buttonElement.classList.add('incorrect');
        setTimeout(() => buttonElement.classList.remove('incorrect'), CONFIG.FLASH_DURATION);
        
        // Play failure sound
        this.playFailureSound();
        
        // Don't progress - let them try again
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
        
        // Start bear celebration first
        this.bear.startCelebration();
        
        // Show modal with transparent background
        this.modal.classList.remove('hidden');
        
        // Give completion message
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
            
            // Pleasant ascending tones
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
            
            // Descending tone for incorrect answer
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
