class SliderRandomGameController {
    constructor() {
        this.sliderRenderer = new SliderRandomRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        this.guineaPigWave = new SimplifiedGuineaPigWave('../../assets/raisin/');
        
        // Game state
        this.currentQuestion = 1;
        this.currentLevel = 1;
        this.targetNumber = 2;
        this.questionStartTime = null;
        this.gameComplete = false;
        this.sliderDisabled = false;
        this.awaitingCompletion = false;
        this.lastArrangementHash = null; // Track when arrangement actually changes
        
        // Level management
        this.usedNumbers = new Set(); // Track used numbers in current level
        this.availableNumbers = [...CONFIG.LEVELS[1]]; // Copy of current level numbers
        
        // Multi-touch drag state
        this.dragState = {
            activeTouches: new Map()
        };
        
        // Velocity tracking for momentum
        this.velocityTracking = new Map(); // touchId -> {positions: [], times: []}
        
        // Audio
        this.audioEnabled = CONFIG.AUDIO_ENABLED;
        this.audioContext = null;
        
        // Timing for delayed messages
        this.invalidArrangementTimer = null;
        this.invalidArrangementStartTime = null;
        this.completionCheckTimer = null;
        this.lastActivityTime = null;
        
        // UI elements
        this.arrowElement = null;
        this.muteButton = null;
        this.muteContainer = null;
        this.largeNumberElement = document.getElementById('largeNumber');
        this.numberTextElement = document.getElementById('numberText');
        
        // DOM elements
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.initializeAudio();
        this.createMuteButton();
        this.createArrowElement();
        this.initializeEventListeners();
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
            outline: none;
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
    
    createArrowElement() {
        this.arrowElement = document.createElement('img');
        this.arrowElement.className = 'slider-arrow';
        this.arrowElement.src = '../../assets/slider/leftarrow.png';
        this.arrowElement.alt = 'Left Arrow';
        
        this.arrowElement.style.cssText = `
            position: absolute;
            opacity: 0;
            pointer-events: none;
            z-index: 10;
            transition: opacity 0.5s ease;
        `;
        
        this.positionArrow();
        document.body.appendChild(this.arrowElement);
        
        // Add error handling for missing image
        this.arrowElement.addEventListener('error', () => {
            console.error('Arrow image failed to load:', this.arrowElement.src);
            // Fallback to text arrow if image fails
            this.arrowElement.style.display = 'none';
            const textArrow = document.createElement('div');
            textArrow.innerHTML = '←';
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
            this.positionArrow();
        });
        
        window.addEventListener('resize', () => this.positionArrow());
    }
    
    positionArrow() {
        if (!this.arrowElement) return;
        
        const gameArea = document.querySelector('.game-area');
        const gameAreaRect = gameArea.getBoundingClientRect();
        
        // Use approximate positioning relative to game area
        const arrowHeight = gameAreaRect.height * 0.2; // Slightly larger (was 0.15)
        this.arrowElement.style.height = `${arrowHeight}px`;
        this.arrowElement.style.width = 'auto'; // Maintain aspect ratio
        
        // Position at 92% through the game area from left, 61% down from top
        const arrowX = gameAreaRect.left + (gameAreaRect.width * 0.92);
        const arrowY = gameAreaRect.top + (gameAreaRect.height * 0.61);
        
        console.log('Arrow positioning (approximate):', {
            gameAreaRect,
            arrowX,
            arrowY,
            arrowHeight
        });
        
        // Center the arrow on the calculated position
        if (this.arrowElement.complete || this.arrowElement.tagName === 'DIV') {
            const arrowWidth = this.arrowElement.offsetWidth || (arrowHeight * 0.6);
            this.arrowElement.style.left = `${arrowX - (arrowWidth / 2)}px`; // Center horizontally
            this.arrowElement.style.top = `${arrowY - (arrowHeight / 2)}px`; // Center vertically
        } else {
            // Fallback positioning if image not loaded yet
            this.arrowElement.style.left = `${arrowX - (arrowHeight * 0.3)}px`;
            this.arrowElement.style.top = `${arrowY - (arrowHeight / 2)}px`;
        }
    }
    
    showArrow() {
        if (!this.arrowElement) return;
        
        this.positionArrow();
        this.arrowElement.style.opacity = '1';
        
        // Pulse continuously when correct answer is achieved
        this.arrowElement.style.animation = 'arrowPulse 1s ease-in-out infinite';
        
        setTimeout(() => {
            if (this.arrowElement) {
                this.arrowElement.style.animation = '';
                this.arrowElement.style.opacity = '0';
            }
        }, 4000);
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
    
    initializeEventListeners() {
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
            // Only prevent default for touches that are part of active drag operations
            if (this.dragState.activeTouches.size > 0) {
                e.preventDefault();
                Array.from(e.changedTouches).forEach(touch => {
                    this.handleDragMove(touch.clientX, touch.clientY, touch.identifier);
                });
            }
        });
        
        document.addEventListener('touchend', (e) => {
            // Only prevent default for touches that are part of active drag operations
            if (this.dragState.activeTouches.size > 0) {
                e.preventDefault();
                Array.from(e.changedTouches).forEach(touch => {
                    this.handleDragEnd(touch.clientX, touch.clientY, touch.identifier);
                });
            }
        });
    }
    
    handleDragStart(x, y, touchId = 'mouse') {
        if (this.sliderDisabled) {
            console.log('Slider disabled - ignoring drag start');
            return;
        }
        
        // Record activity
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
        
        // Initialize velocity tracking
        this.velocityTracking.set(touchId, {
            positions: [x],
            times: [Date.now()]
        });
    }
    
    handleDragMove(x, y, touchId = 'mouse') {
        if (this.sliderDisabled) return;
        
        // Record activity
        this.lastActivityTime = Date.now();
        
        const dragState = this.dragState.activeTouches.get(touchId);
        if (!dragState || !dragState.isDragging || !dragState.draggedBead) return;
        
        // Update velocity tracking
        const velocityData = this.velocityTracking.get(touchId);
        if (velocityData) {
            const now = Date.now();
            velocityData.positions.push(x);
            velocityData.times.push(now);
            
            // Keep only recent history (last 100ms)
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
        
        // Record activity
        this.lastActivityTime = Date.now();
        
        const bead = dragState.draggedBead;
        
        this.sliderRenderer.setBeadTouchState(bead, false);
        bead.isDragging = false;
        bead.element.classList.remove('dragging');
        
        // Calculate velocity for momentum
        const velocityData = this.velocityTracking.get(touchId);
        let velocity = 0;
        
        if (velocityData && velocityData.positions.length >= 2) {
            const recentPositions = velocityData.positions.slice(-5); // Use last 5 samples
            const recentTimes = velocityData.times.slice(-5);
            
            if (recentPositions.length >= 2) {
                const deltaX = recentPositions[recentPositions.length - 1] - recentPositions[0];
                const deltaTime = (recentTimes[recentTimes.length - 1] - recentTimes[0]) / 1000; // Convert to seconds
                
                if (deltaTime > 0) {
                    velocity = (deltaX / this.sliderRenderer.beadDiameter) / deltaTime; // Velocity in bead diameters per second
                    
                    // Apply velocity threshold - only start momentum if moving fast enough
                    if (Math.abs(velocity) > 2) { // Minimum 2 diameters per second
                        this.sliderRenderer.startMomentum(bead, velocity);
                    } else {
                        // Snap immediately if velocity is too low
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
            // No velocity data - just snap
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
        
        // Force a comprehensive final state update to ensure consistency
        this.sliderRenderer.beads.forEach(bead => {
            this.sliderRenderer.positionBead(bead);
        });
        this.sliderRenderer.updateBarState();
        
        this.dragState.activeTouches.delete(touchId);
        this.velocityTracking.delete(touchId);
        
        // Force immediate state check, then backup checks
        this.checkGameState();
        
        // Reduced frequency fallback checks
        setTimeout(() => this.checkGameState(), 300);
    }
    
    checkGameState() {
        const currentTime = Date.now();
        const hasMiddleBeads = this.sliderRenderer.hasBeadsInMiddle();
        
        console.log(`\n=== GAME STATE CHECK ===`);
        console.log(`Target number: ${this.targetNumber}`);
        console.log(`Has middle beads: ${hasMiddleBeads}`);
        console.log(`Slider disabled: ${this.sliderDisabled}`);
        
        if (hasMiddleBeads) {
            // Invalid arrangement - clear completion timer
            if (this.completionCheckTimer) {
                clearTimeout(this.completionCheckTimer);
                this.completionCheckTimer = null;
                console.log(`🔄 Completion timer cleared - invalid arrangement`);
            }
            
            // Start inactivity timer
            if (!this.invalidArrangementStartTime) {
                this.invalidArrangementStartTime = currentTime;
                this.lastActivityTime = currentTime;
                this.scheduleInactivityCheck();
            }
            
            this.awaitingCompletion = false;
            this.sliderDisabled = false;
            this.lastArrangementHash = null; // Reset arrangement tracking
            console.log(`❌ Invalid arrangement - waiting for valid arrangement`);
            console.log(`=== END GAME STATE CHECK ===\n`);
            return;
        }
        
        // Clear invalid arrangement timer
        if (this.invalidArrangementTimer) {
            clearTimeout(this.invalidArrangementTimer);
            this.invalidArrangementTimer = null;
            this.invalidArrangementStartTime = null;
        }
        
        // Force comprehensive state update - the issue isn't counting, it's state sync
        this.sliderRenderer.updateBarState();
        
        // Force all beads to update their positions - touching a bead fixes it, so we simulate that
        this.sliderRenderer.beads.forEach(bead => {
            this.sliderRenderer.positionBead(bead);
        });
        this.sliderRenderer.updateBarState();
        
        // Create hash to track changes
        const currentHash = this.createLightweightHash();
        const arrangementChanged = this.lastArrangementHash !== currentHash;
        
        if (arrangementChanged) {
            console.log(`🔄 Arrangement changed - hash: ${this.lastArrangementHash} → ${currentHash}`);
            this.lastArrangementHash = currentHash;
        }
        
        // Count with both methods
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        const manualCount = this.countBeadsOnRightSideManual();
        
        console.log(`Counts - Renderer: ${rightSideCount}, Manual: ${manualCount}, Target: ${this.targetNumber}`);
        console.log(`Timer state - Active: ${!!this.completionCheckTimer}, Awaiting: ${this.awaitingCompletion}`);
        
        // Force timer state consistency check
        if (rightSideCount === this.targetNumber && manualCount === this.targetNumber) {
            console.log(`✅ Both counts correct (${rightSideCount})`);
            
            // Force clear and restart timer if arrangement changed OR if timer should be running but isn't
            if ((arrangementChanged && this.completionCheckTimer) || (rightSideCount === this.targetNumber && !this.completionCheckTimer)) {
                if (this.completionCheckTimer) {
                    clearTimeout(this.completionCheckTimer);
                    console.log(`🔄 Timer restarted due to arrangement change`);
                } else {
                    console.log(`🔄 Timer missing - creating new one`);
                }
                
                this.awaitingCompletion = true;
                this.completionCheckTimer = setTimeout(() => {
                    const completionTime = Date.now();
                    console.log(`⏰ 2-second pause completed!`);
                    
                    const encouragements = ['Well done!', 'Perfect!', 'Good job!', 'Correct!'];
                    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                    this.speakText(randomEncouragement);
                    this.guineaPigWave.startAnimation(88);
                    
                    this.handleCorrectAnswer(completionTime);
                }, CONFIG.COMPLETION_DELAY);
            } else {
                console.log(`⏳ Timer already running correctly`);
            }
            
            console.log(`✅ Correct count - completion timer active`);
        } else {
            // Wrong count - clear timer
            console.log(`❌ Wrong count - Renderer: ${rightSideCount}, Manual: ${manualCount}, need: ${this.targetNumber}`);
            if (this.completionCheckTimer) {
                clearTimeout(this.completionCheckTimer);
                this.completionCheckTimer = null;
                console.log(`🔄 Timer cleared - wrong count`);
            }
            
            this.awaitingCompletion = false;
            this.sliderDisabled = false;
        }
        
        console.log(`Final state: awaiting=${this.awaitingCompletion}, disabled=${this.sliderDisabled}`);
        console.log(`=== END GAME STATE CHECK ===\n`);
    }
    
    // Lightweight hash generation for better performance
    createLightweightHash() {
        let hash = 0;
        for (let bead of this.sliderRenderer.beads) {
            // Simple hash based on position, not string concatenation
            hash += bead.position * (bead.barIndex + 1) * 100;
            hash = hash % 999999; // Keep number manageable
        }
        return hash;
    }
    
    // Keep original method for debugging when needed
    createArrangementHash() {
        const positions = this.sliderRenderer.beads
            .map(bead => `${bead.id}:${bead.position.toFixed(3)}`)
            .sort()
            .join('|');
        return positions;
    }
    
    // Manual verification method to double-check bead counting
    countBeadsOnRightSideManual() {
        const tolerance = 0.35; // Same tolerance as renderer
        let totalRightSideBeads = 0;
        
        // Calculate bar bounds (same as renderer)
        const barStartX = this.sliderRenderer.frameImageRect.width * 0.07;
        const barEndX = this.sliderRenderer.frameImageRect.width * 0.92;
        const barLength = barEndX - barStartX;
        const playableLength = barLength - (2 * this.sliderRenderer.beadRadius);
        const maxPosition = playableLength / this.sliderRenderer.beadDiameter;
        
        console.log(`Manual count - maxPosition: ${maxPosition.toFixed(3)}`);
        
        // Check each bar separately
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            const barBeads = this.sliderRenderer.beads.filter(bead => bead.barIndex === barIndex);
            const sortedBeads = barBeads.sort((a, b) => b.position - a.position); // Sort right to left
            
            let rightSideBeadsOnThisBar = 0;
            
            console.log(`Bar ${barIndex} beads (right to left):`, 
                       sortedBeads.map(b => `${b.id}(${b.position.toFixed(3)})`));
            
            // Count continuous beads from the right end
            for (let i = 0; i < sortedBeads.length; i++) {
                const bead = sortedBeads[i];
                const expectedPosition = maxPosition - i; // Expected position for i-th bead from right
                const difference = Math.abs(bead.position - expectedPosition);
                
                console.log(`  Bead ${bead.id}: pos=${bead.position.toFixed(3)}, expected=${expectedPosition.toFixed(3)}, diff=${difference.toFixed(3)}`);
                
                // Check if this bead is in the correct position (within tolerance)
                if (difference <= tolerance) {
                    rightSideBeadsOnThisBar++;
                    console.log(`    ✅ Counted (within tolerance ${tolerance})`);
                } else {
                    console.log(`    ❌ Gap found - stopping count`);
                    break;
                }
            }
            
            console.log(`Bar ${barIndex} contributes ${rightSideBeadsOnThisBar} beads`);
            totalRightSideBeads += rightSideBeadsOnThisBar;
        }
        
        return totalRightSideBeads;
    }
    
    scheduleInactivityCheck() {
        // Clear existing timer
        if (this.invalidArrangementTimer) {
            clearTimeout(this.invalidArrangementTimer);
        }
        
        this.invalidArrangementTimer = setTimeout(() => {
            const now = Date.now();
            const timeSinceActivity = now - (this.lastActivityTime || now);
            
            // Check if 10 seconds have passed since last activity AND beads are still in middle
            if (timeSinceActivity >= 10000 && this.sliderRenderer.hasBeadsInMiddle()) {
                this.speakText(`Don't leave any beads in the middle. Arrange ${this.targetNumber} beads on the right side.`);
                
                // Reset activity time and schedule next check
                this.lastActivityTime = now;
                this.scheduleInactivityCheck();
            } else if (this.sliderRenderer.hasBeadsInMiddle()) {
                // Still has middle beads but activity was recent - check again later
                const remainingTime = Math.max(100, 10000 - timeSinceActivity);
                this.invalidArrangementTimer = setTimeout(() => this.scheduleInactivityCheck(), remainingTime);
            }
            // If no middle beads, timer will be cleared by checkGameState
        }, 10000);
    }
    
    handleCorrectAnswer(completionTime) {
        this.clearTimers();
        
        // Calculate effective completion time (total time minus the 2-second waiting period)
        const totalTime = (completionTime - this.questionStartTime) / 1000;
        const effectiveTime = totalTime - (CONFIG.COMPLETION_DELAY / 1000);
        
        console.log(`Question completed:`);
        console.log(`  Total time: ${totalTime.toFixed(2)} seconds`);
        console.log(`  Effective time: ${effectiveTime.toFixed(2)} seconds`);
        console.log(`  Level threshold: ${CONFIG.LEVEL_UP_TIME_LIMIT} seconds`);
        
        // Level progression logic based on effective time
        if (effectiveTime < CONFIG.LEVEL_UP_TIME_LIMIT) {
            // Move up a level (max level 5)
            if (this.currentLevel < 5) {
                this.currentLevel++;
                console.log(`⬆️ Level up! Now at level ${this.currentLevel}`);
            } else {
                console.log(`Already at max level (${this.currentLevel})`);
            }
        } else {
            // Move down a level (min level 1)
            if (this.currentLevel > 1) {
                this.currentLevel--;
                console.log(`⬇️ Level down! Now at level ${this.currentLevel}`);
            } else {
                console.log(`Already at min level (${this.currentLevel})`);
            }
        }
        
        // Update available numbers for new level
        this.updateAvailableNumbers();
        
        // Add rainbow piece and play sound
        this.rainbow.addPiece();
        this.playCompletionSound();
        
        // Check if game is complete
        if (this.currentQuestion >= CONFIG.MAX_QUESTIONS) {
            setTimeout(() => this.completeGame(), 2000); // 2-second delay before completion
            return;
        }
        
        // Move to next question with 2-second delay
        this.currentQuestion++;
        setTimeout(() => this.startNewQuestion(), 2000); // 2-second delay before next question
    }
    
    updateAvailableNumbers() {
        const levelNumbers = [...CONFIG.LEVELS[this.currentLevel]];
        
        // Remove used numbers from current level
        this.availableNumbers = levelNumbers.filter(num => !this.usedNumbers.has(num));
        
        // If all numbers in level have been used, reset the used set for this level
        if (this.availableNumbers.length === 0) {
            this.usedNumbers.clear();
            this.availableNumbers = [...levelNumbers];
        }
        
        console.log(`Level ${this.currentLevel} available numbers:`, this.availableNumbers);
    }
    
    selectRandomNumber() {
        if (this.availableNumbers.length === 0) {
            this.updateAvailableNumbers();
        }
        
        const randomIndex = Math.floor(Math.random() * this.availableNumbers.length);
        const selectedNumber = this.availableNumbers[randomIndex];
        
        // Mark this number as used
        this.usedNumbers.add(selectedNumber);
        
        // Remove from available numbers
        this.availableNumbers.splice(randomIndex, 1);
        
        return selectedNumber;
    }
    
    updateTargetDisplay(number) {
        this.largeNumberElement.textContent = number;
        this.numberTextElement.textContent = CONFIG.NUMBER_WORDS[number];
    }
    
    startNewQuestion() {
        if (this.gameComplete) return;
        
        this.clearTimers();
        
        // Reset slider to all beads on left
        this.sliderRenderer.reset();
        
        // Select new target number
        this.targetNumber = this.selectRandomNumber();
        this.updateTargetDisplay(this.targetNumber);
        
        // Record question start time
        this.questionStartTime = Date.now();
        
        // Give audio instruction
        this.speakText(`Put ${this.targetNumber} beads on the right side`);
        
        // Show arrow during instruction (1-4 seconds in)
        setTimeout(() => {
            this.showArrowBriefly();
        }, 1000);
        
        console.log(`Question ${this.currentQuestion}: Put ${this.targetNumber} beads on the right (Level ${this.currentLevel})`);
    }
    
    showArrowBriefly() {
        if (!this.arrowElement) return;
        
        this.positionArrow();
        this.arrowElement.style.opacity = '1';
        
        // Pulse for 3 seconds (1-4 seconds into instruction) with 1-second intervals
        this.arrowElement.style.animation = 'arrowPulse 1s ease-in-out infinite';
        
        setTimeout(() => {
            if (this.arrowElement) {
                this.arrowElement.style.animation = '';
                this.arrowElement.style.opacity = '0';
            }
        }, 3000); // Show for 3 seconds (1-4 seconds into question)
    }
    
    startNewGame() {
        this.currentQuestion = 1;
        this.currentLevel = 1;
        this.targetNumber = 2;
        this.gameComplete = false;
        this.sliderDisabled = false;
        this.awaitingCompletion = false;
        this.questionStartTime = null;
        this.lastActivityTime = null;
        
        // Reset level management
        this.usedNumbers.clear();
        this.availableNumbers = [...CONFIG.LEVELS[1]];
        
        this.clearTimers();
        
        this.dragState = {
            activeTouches: new Map()
        };
        
        this.velocityTracking.clear();
        
        this.rainbow.reset();
        this.bear.reset();
        this.sliderRenderer.reset();
        this.modal.classList.add('hidden');
        
        setTimeout(() => this.startNewQuestion(), 500);
    }
    
    completeGame() {
        this.gameComplete = true;
        this.clearTimers();
        
        this.bear.startCelebration();
        this.modal.classList.remove('hidden');
        
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Well done! Play again or return to the home page.');
            }, 1000);
        }
    }
    
    clearTimers() {
        if (this.invalidArrangementTimer) {
            clearTimeout(this.invalidArrangementTimer);
            this.invalidArrangementTimer = null;
        }
        if (this.completionCheckTimer) {
            clearTimeout(this.completionCheckTimer);
            this.completionCheckTimer = null;
        }
        this.invalidArrangementStartTime = null;
        
        this.sliderDisabled = false;
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
        this.clearTimers();
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        if (this.muteContainer && this.muteContainer.parentNode) {
            this.muteContainer.parentNode.removeChild(this.muteContainer);
        }
        
        if (this.arrowElement && this.arrowElement.parentNode) {
            this.arrowElement.parentNode.removeChild(this.arrowElement);
        }
        
        if (this.guineaPigWave) {
            this.guineaPigWave.destroy();
        }
        
        this.rainbow.reset();
        this.bear.reset();
        this.sliderRenderer.reset();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sliderRandomGame = new SliderRandomGameController();
});

// Clean up resources when page unloads
window.addEventListener('beforeunload', () => {
    if (window.sliderRandomGame) {
        window.sliderRandomGame.destroy();
    }
});
