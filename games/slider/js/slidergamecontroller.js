class SliderGameController {
    constructor() {
        this.sliderRenderer = new SliderRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentQuestion = 1;
        this.expectedBeadsOnRight = 2; // Start with 2 beads
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.awaitingButtonPress = false;
        
        // Drag state
        this.dragState = {
            isDragging: false,
            draggedBeads: [],
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0,
            activeTouches: []
        };
        
        // Audio functionality
        this.audioEnabled = CONFIG.AUDIO_ENABLED || true;
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
        muteContainer.style.position = 'fixed';
        muteContainer.style.top = '20px';
        muteContainer.style.right = '20px';
        muteContainer.style.zIndex = '1000';
        muteContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        muteContainer.style.borderRadius = '50%';
        muteContainer.style.width = '60px';
        muteContainer.style.height = '60px';
        muteContainer.style.display = 'flex';
        muteContainer.style.alignItems = 'center';
        muteContainer.style.justifyContent = 'center';
        muteContainer.style.cursor = 'pointer';
        muteContainer.style.transition = 'all 0.3s ease';
        muteContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        
        this.muteButton = document.createElement('button');
        this.muteButton.style.background = 'none';
        this.muteButton.style.border = 'none';
        this.muteButton.style.color = 'white';
        this.muteButton.style.fontSize = '24px';
        this.muteButton.style.cursor = 'pointer';
        this.muteButton.style.width = '100%';
        this.muteButton.style.height = '100%';
        this.muteButton.style.display = 'flex';
        this.muteButton.style.alignItems = 'center';
        this.muteButton.style.justifyContent = 'center';
        
        this.updateMuteButtonIcon();
        
        this.muteButton.addEventListener('click', () => this.toggleAudio());
        this.muteButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleAudio();
        });
        
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
        this.updateMuteButtonIcon();
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Audio enabled');
            }, 100);
        }
    }
    
    speakText(text) {
        if (!this.audioEnabled) return;
        
        try {
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1.3;
                utterance.volume = 0.8;
                
                const voices = speechSynthesis.getVoices();
                let selectedVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes('male') ||
                    voice.name.toLowerCase().includes('boy') ||
                    voice.name.toLowerCase().includes('man') ||
                    (!voice.name.toLowerCase().includes('female') && 
                     !voice.name.toLowerCase().includes('woman') &&
                     !voice.name.toLowerCase().includes('girl'))
                );
                
                if (selectedVoice) utterance.voice = selectedVoice;
                utterance.pitch = 1.3;
                
                speechSynthesis.speak(utterance);
            }
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
        
        // Apply shuffled numbers to buttons
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
        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });
        
        // Mouse events
        this.sliderRenderer.sliderContainer.addEventListener('mousedown', (e) => {
            this.handlePointerDown(e.clientX, e.clientY, 'mouse');
        });
        
        document.addEventListener('mousemove', (e) => {
            this.handlePointerMove(e.clientX, e.clientY, 'mouse');
        });
        
        document.addEventListener('mouseup', (e) => {
            this.handlePointerUp(e.clientX, e.clientY, 'mouse');
        });
        
        // Touch events
        this.sliderRenderer.sliderContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                this.handlePointerDown(touch.clientX, touch.clientY, touch.identifier);
            });
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                this.handlePointerMove(touch.clientX, touch.clientY, touch.identifier);
            });
        });
        
        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                this.handlePointerUp(touch.clientX, touch.clientY, touch.identifier);
            });
        });
    }
    
    handlePointerDown(x, y, pointerId) {
        console.log('handlePointerDown called:', x, y, pointerId);
        
        const bead = this.sliderRenderer.getBeadAtPosition(x, y);
        if (!bead) {
            console.log('No bead found at position');
            return;
        }
        
        console.log('Bead found:', bead.id, 'at position:', bead.position.toFixed(3));
        
        // Start new drag or add to existing multi-touch
        const touchData = {
            id: pointerId,
            startX: x,
            startY: y,
            lastX: x,
            lastY: y,
            bead: bead,
            startPosition: bead.position,
            hasStartedMoving: false,
            dragThreshold: this.sliderRenderer.beadRadius, // Must drag a full radius to start moving
            connectedBlock: null // Will store the connected block when movement starts
        };
        
        bead.isDragging = true;
        bead.element.classList.add('dragging');
        
        this.dragState.activeTouches.push(touchData);
        this.dragState.isDragging = true;
        
        console.log('Drag started for bead:', bead.id, 'threshold:', touchData.dragThreshold.toFixed(2));
    }
    
    handlePointerMove(x, y, pointerId) {
        if (!this.dragState.isDragging) return;
        
        const touch = this.dragState.activeTouches.find(t => t.id === pointerId);
        if (!touch) return;
        
        const deltaX = x - touch.startX;
        const totalDistance = Math.abs(deltaX);
        
        console.log('handlePointerMove - deltaX:', deltaX, 'totalDistance:', totalDistance);
        
        // Check if we've moved enough to start dragging (full bead radius)
        if (!touch.hasStartedMoving && totalDistance < touch.dragThreshold) {
            console.log('Below drag threshold:', touch.dragThreshold);
            return;
        }
        
        if (!touch.hasStartedMoving) {
            touch.hasStartedMoving = true;
            console.log('Started moving bead:', touch.bead.id);
            
            // Store the initial position and movement direction
            touch.initialPosition = touch.bead.position;
            
            // Update position tracking to ensure we have current state
            this.sliderRenderer.updateBeadPositionTracking();
        }
        
        // Determine movement direction based on current drag
        const direction = deltaX > 0 ? 1 : -1;
        
        // Get the moving block based on current direction
        touch.movingBlock = this.sliderRenderer.getMovingBlock(touch.bead, direction);
        console.log('Moving block size:', touch.movingBlock.length, 'direction:', direction > 0 ? 'right' : 'left');
        
        // Calculate new position based on ACTUAL drag distance from start of movement
        const beadDiameter = this.sliderRenderer.beadDiameter;
        const movementFromThreshold = deltaX - (touch.dragThreshold * Math.sign(deltaX));
        const positionDelta = movementFromThreshold / beadDiameter; // Direct 1:1 conversion
        
        console.log('Position delta (continuous):', positionDelta.toFixed(3));
        
        // Calculate target position based on initial position + drag delta
        const targetPosition = touch.initialPosition + positionDelta;
        console.log('Target position:', targetPosition.toFixed(3), 'from initial:', touch.initialPosition.toFixed(3));
        
        // Move the moving block with proper space calculation
        this.sliderRenderer.moveBlockWithCollisions(touch.movingBlock, targetPosition);
        
        touch.lastX = x;
        touch.lastY = y;
    }
    
    handlePointerUp(x, y, pointerId) {
        const touchIndex = this.dragState.activeTouches.findIndex(t => t.id === pointerId);
        if (touchIndex === -1) return;
        
        const touch = this.dragState.activeTouches[touchIndex];
        
        // Clean up dragging state
        touch.bead.isDragging = false;
        touch.bead.element.classList.remove('dragging');
        
        // Snap to integer positions
        if (touch.hasStartedMoving) {
            const direction = touch.lastX > touch.startX ? 1 : -1;
            const movingBlock = this.sliderRenderer.getBeadBlockInDirection(touch.bead, direction);
            
            // Snap all beads to integer positions
            movingBlock.forEach((bead, index) => {
                const snappedPosition = Math.round(bead.position);
                this.sliderRenderer.moveBeadToPosition(bead, snappedPosition, true);
            });
        }
        
        // Remove this touch
        this.dragState.activeTouches.splice(touchIndex, 1);
        
        // If no more active touches, end dragging
        if (this.dragState.activeTouches.length === 0) {
            this.dragState.isDragging = false;
            
            // Check if game state has changed
            setTimeout(() => {
                this.checkGameState();
            }, 300);
        }
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
        setTimeout(() => {
            buttonElement.classList.remove('correct');
        }, CONFIG.FLASH_DURATION);
        
        // Add rainbow piece
        this.rainbow.addPiece();
        
        // Play completion sound
        this.playCompletionSound();
        
        // Encouragement
        if (this.audioEnabled) {
            const encouragements = ['Well done!', 'Excellent!', 'Perfect!'];
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            setTimeout(() => {
                this.speakText(randomEncouragement);
            }, 400);
        }
        
        this.currentQuestion++;
        this.expectedBeadsOnRight += 2;
        this.awaitingButtonPress = false;
        
        // Check if game is complete
        if (this.rainbow.isComplete()) {
            setTimeout(() => {
                this.completeGame();
            }, CONFIG.NEXT_QUESTION_DELAY);
            return;
        }
        
        // Start next question
        setTimeout(() => {
            this.startNewQuestion();
        }, CONFIG.NEXT_QUESTION_DELAY);
    }
    
    handleIncorrectAnswer(buttonElement) {
        // Flash red
        buttonElement.classList.add('incorrect');
        setTimeout(() => {
            buttonElement.classList.remove('incorrect');
        }, CONFIG.FLASH_DURATION);
        
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
            draggedBeads: [],
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0,
            activeTouches: []
        };
        
        this.rainbow.reset();
        this.bear.reset();
        this.sliderRenderer.reset();
        this.shuffleButtons();
        this.modal.classList.add('hidden');
        
        setTimeout(() => {
            this.startNewQuestion();
        }, 500);
    }
    
    completeGame() {
        this.gameComplete = true;
        this.modal.classList.remove('hidden');
        
        // Start bear celebration
        this.bear.startCelebration();
        
        // Give completion audio message
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

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.sliderGame) {
        window.sliderGame.destroy();
    }
});
