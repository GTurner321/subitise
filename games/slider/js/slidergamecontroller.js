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
        
        // Simple drag state - only one bead at a time
        this.dragState = {
            isDragging: false,
            draggedBead: null,
            startX: 0,
            startY: 0,
            startPosition: 0,
            hasStartedMoving: false,
            connectedBlock: []
        };
        
        // Audio
        this.audioEnabled = CONFIG.AUDIO_ENABLED;
        this.audioContext = null;
        
        // DOM elements
        this.numberButtons = document.querySelectorAll('.number-btn');
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
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
        
        this.muteButton.addEventListener('click', () => this.toggleAudio());
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
            setTimeout(() => this.speakText('Audio enabled'), 100);
        }
    }
    
    speakText(text) {
        if (!this.audioEnabled || !('speechSynthesis' in window)) return;
        
        try {
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.3;
            utterance.volume = 0.8;
            
            speechSynthesis.speak(utterance);
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
        
        // Mouse events for dragging
        this.sliderRenderer.sliderContainer.addEventListener('mousedown', (e) => {
            this.handleDragStart(e.clientX, e.clientY);
        });
        
        document.addEventListener('mousemove', (e) => {
            this.handleDragMove(e.clientX, e.clientY);
        });
        
        document.addEventListener('mouseup', (e) => {
            this.handleDragEnd(e.clientX, e.clientY);
        });
        
        // Touch events
        this.sliderRenderer.sliderContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleDragStart(touch.clientX, touch.clientY);
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches[0]) {
                this.handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        });
        
        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleDragEnd(0, 0); // Position doesn't matter for end
        });
    }
    
    handleDragStart(x, y) {
        const bead = this.sliderRenderer.getBeadAtPosition(x, y);
        if (!bead) return;
        
        console.log(`Drag started on ${bead.id} at position ${bead.position.toFixed(3)}`);
        
        this.dragState = {
            isDragging: true,
            draggedBead: bead,
            startX: x,
            startY: y,
            startPosition: bead.position,
            hasStartedMoving: false,
            connectedBlock: this.sliderRenderer.getConnectedBeads(bead)
        };
        
        bead.isDragging = true;
        bead.element.classList.add('dragging');
    }
    
    handleDragMove(x, y) {
        if (!this.dragState.isDragging || !this.dragState.draggedBead) return;
        
        const deltaX = x - this.dragState.startX;
        const dragThreshold = this.sliderRenderer.beadRadius; // Must drag one radius to start
        
        // Check if we've moved enough to start dragging
        if (!this.dragState.hasStartedMoving && Math.abs(deltaX) < dragThreshold) {
            return;
        }
        
        if (!this.dragState.hasStartedMoving) {
            this.dragState.hasStartedMoving = true;
            console.log(`Started moving ${this.dragState.draggedBead.id}`);
        }
        
        // Calculate movement direction and distance
        const direction = deltaX > 0 ? 1 : -1;
        const movementFromThreshold = deltaX - (dragThreshold * Math.sign(deltaX));
        const positionDelta = movementFromThreshold / this.sliderRenderer.beadDiameter;
        
        // Calculate target position
        const targetPosition = this.dragState.startPosition + positionDelta;
        
        console.log(`Target position: ${targetPosition.toFixed(3)}, delta: ${positionDelta.toFixed(3)}`);
        
        // Check how far the block can actually move
        const block = this.dragState.connectedBlock;
        const maxMovement = this.sliderRenderer.canMoveBlock(block, direction, Math.abs(positionDelta));
        
        // Apply the movement
        if (maxMovement > 0) {
            const actualDelta = direction > 0 ? maxMovement : -maxMovement;
            const newPosition = this.dragState.startPosition + actualDelta;
            
            // Move the entire connected block
            const currentPosition = this.dragState.draggedBead.position;
            const movementNeeded = newPosition - currentPosition;
            
            if (Math.abs(movementNeeded) > 0.001) { // Only move if there's a meaningful difference
                this.sliderRenderer.moveBlock(block, movementNeeded);
            }
        }
    }
    
    handleDragEnd(x, y) {
        if (!this.dragState.isDragging) return;
        
        const bead = this.dragState.draggedBead;
        console.log(`Drag ended for ${bead.id}`);
        
        // Clean up dragging state
        bead.isDragging = false;
        bead.element.classList.remove('dragging');
        
        // Snap to integer positions if we moved
        if (this.dragState.hasStartedMoving) {
            const snappedPosition = Math.round(bead.position);
            const snapDelta = snappedPosition - bead.position;
            
            if (Math.abs(snapDelta) > 0.001) {
                this.sliderRenderer.moveBlock(this.dragState.connectedBlock, snapDelta);
            }
            
            // Check for magnetic snapping to nearby beads
            this.sliderRenderer.snapToNearbyBeads(bead);
        }
        
        // Reset drag state
        this.dragState = {
            isDragging: false,
            draggedBead: null,
            startX: 0,
            startY: 0,
            startPosition: 0,
            hasStartedMoving: false,
            connectedBlock: []
        };
        
        // Check game state after a delay
        setTimeout(() => this.checkGameState(), 300);
    }
    
    checkGameState() {
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        const hasMiddleBeads = this.sliderRenderer.hasBeadsInMiddle();
        
        if (hasMiddleBeads) {
            this.speakText('Arrange beads onto one side or the other, don\'t leave any in the middle');
            this.awaitingButtonPress = false;
            return;
        }
        
        if (rightSideCount === this.expectedBeadsOnRight && !this.awaitingButtonPress) {
            this.awaitingButtonPress = true;
            this.speakText(`How many beads do you have on the right side? Select the button below.`);
        }
    }
    
    handleNumberClick(selectedNumber, buttonElement) {
        if (!this.awaitingButtonPress) return;
        
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        
        if (selectedNumber === rightSideCount && selectedNumber === this.expectedBeadsOnRight) {
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
        
        this.currentQuestion++;
        this.expectedBeadsOnRight += 2;
        this.awaitingButtonPress = false;
        
        // Check if game complete
        if (this.rainbow.isComplete()) {
            setTimeout(() => this.completeGame(), CONFIG.NEXT_QUESTION_DELAY);
            return;
        }
        
        // Start next question
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
        
        if (this.currentQuestion === 1) {
            this.speakText('Slide 2 beads to the right side, then choose the number button for 2');
        } else {
            this.speakText('Slide two more beads to the right side, then choose the button for the new total on the right');
        }
    }
    
    startNewGame() {
        this.currentQuestion = 1;
        this.expectedBeadsOnRight = 2;
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.awaitingButtonPress = false;
        
        this.dragState = {
            isDragging: false,
            draggedBead: null,
            startX: 0,
            startY: 0,
            startPosition: 0,
            hasStartedMoving: false,
            connectedBlock: []
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
        this.modal.classList.remove('hidden');
        
        // Start bear celebration
        this.bear.startCelebration();
        
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
