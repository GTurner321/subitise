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
        
        // Audio
        this.audioEnabled = CONFIG.AUDIO_ENABLED;
        this.audioContext = null;
        
        // Timing for delayed messages
        this.invalidArrangementTimer = null;
        this.invalidArrangementStartTime = null;
        this.readyForAnswerTimer = null;
        this.readyForAnswerStartTime = null;
        this.lastActivityTime = null;
        
        // Keyboard input handling
        this.keyboardInput = {
            currentInput: '',
            lastKeyTime: 0,
            inputTimeout: null
        };
        
        // UI elements
        this.arrowElement = null;
        this.muteButton = null;
        this.muteContainer = null;
        
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
            '../../assets/slider/rightarrow.png', // Changed from leftarrow.png
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
                    resolve(null); // Don't fail the entire loading process
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
                    resolve(null); // Don't fail the entire loading process
                };
                audio.preload = 'auto';
                audio.src = src;
            });
            assetsToLoad.push(promise);
        });
        
        // Wait for all assets to load (or fail gracefully)
        try {
            await Promise.all(assetsToLoad);
            console.log('✅ All assets preloaded successfully');
            
            // Small delay to ensure everything is ready
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
        
        this.initializeAudio();
        this.createMuteButton();
        this.createArrowElement();
        this.initializeEventListeners();
        this.createButtonsAsPercentages();
        
        // Fade in slider container after preloading is complete (like sliderrandom)
        setTimeout(() => {
            const sliderContainer = document.getElementById('sliderContainer');
            sliderContainer.classList.add('loaded');
        }, 200); // 200ms delay like sliderrandom
        
        this.startNewQuestion();
    }
    
    createButtonsAsPercentages() {
        // Clear the container
        const numberButtonsContainer = document.querySelector('.number-buttons');
        numberButtonsContainer.innerHTML = '';
        
        // Shuffle the button numbers at the start of each game
        const buttonNumbers = [...CONFIG.BUTTON_NUMBERS];
        for (let i = buttonNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [buttonNumbers[i], buttonNumbers[j]] = [buttonNumbers[j], buttonNumbers[i]];
        }
        
        // Button left positions: 15.5, 22.5, 29.5, 36.5, 43.5, 50.5, 57.5, 64.5, 71.5, 78.5
        const buttonLeftPositions = [15.5, 22.5, 29.5, 36.5, 43.5, 50.5, 57.5, 64.5, 71.5, 78.5];
        const buttonWidth = 6; // 6vw width
        const buttonHeight = 6; // 6vw height (square buttons)
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'];
        
        // Wait 0.5 seconds before creating buttons
        setTimeout(() => {
            console.log('Creating buttons...');
            
            // Debug the container
            const containerRect = numberButtonsContainer.getBoundingClientRect();
            console.log('Button container rect:', containerRect);
            console.log('Container height:', containerRect.height, 'Container bottom:', containerRect.bottom);
            
            // Create buttons
            for (let i = 0; i < 10; i++) {
                const button = document.createElement('button');
                button.className = 'number-btn';
                button.dataset.number = buttonNumbers[i];
                button.textContent = buttonNumbers[i];
                
                // Position buttons: left edge positions and bottom edge at 1.5vw
                const leftPosition = buttonLeftPositions[i];
                const bottomPosition = 1.5; // Bottom edge of buttons at 1.5vw from bottom
                
                button.style.cssText = `
                    position: absolute;
                    left: ${leftPosition}vw;
                    bottom: ${bottomPosition}vw;
                    width: ${buttonWidth}vw;
                    height: ${buttonHeight}vw;
                    font-size: calc(${buttonWidth / 2}vw);
                    border: none;
                    border-radius: 18px;
                    font-weight: bold;
                    color: white;
                    cursor: pointer;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    touch-action: manipulation;
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                    pointer-events: auto;
                    outline: none;
                    background-color: ${colors[i]};
                    opacity: 1;
                    transform: translateY(0px);
                    transition: all 0.3s ease;
                `;
                
                // Add event listeners
                button.addEventListener('click', (e) => {
                    if (this.buttonsDisabled) return;
                    const selectedNumber = parseInt(e.target.dataset.number);
                    this.handleNumberClick(selectedNumber, e.target);
                });
                
                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    if (this.buttonsDisabled) return;
                    const selectedNumber = parseInt(e.target.dataset.number);
                    this.handleNumberClick(selectedNumber, e.target);
                });
                
                numberButtonsContainer.appendChild(button);
                console.log(`Button ${i} created:`, button.dataset.number, 'at position', leftPosition, bottomPosition);
                
                // Debug the actual button position
                setTimeout(() => {
                    const buttonRect = button.getBoundingClientRect();
                    console.log(`Button ${i} actual position:`, buttonRect);
                }, 10);
                
                // Fade in each button with a slight delay
                setTimeout(() => {
                    button.classList.add('fade-in');
                    console.log(`Button ${i} fade-in applied`);
                }, i * 50); // 50ms delay between each button
            }
            
            // Update the buttons reference
            this.numberButtons = document.querySelectorAll('.number-btn');
            console.log(`Created ${this.numberButtons.length} buttons`);
            
            // Fade in the container
            numberButtonsContainer.classList.add('loaded');
            console.log('Button container loaded class added');
            
        }, 500); // 0.5 second initial delay
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
        console.log('🏹 Creating arrow element...');
        
        this.arrowElement = document.createElement('img');
        this.arrowElement.className = 'slider-arrow';
        this.arrowElement.src = '../../assets/slider/rightarrow.png'; // Changed to rightarrow.png
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
        
        console.log('🏹 Calling initial updateSliderArrowPosition...');
        console.log('🔍 Method type:', typeof this.updateSliderArrowPosition);
        if (typeof this.updateSliderArrowPosition === 'function') {
            this.updateSliderArrowPosition();
        } else {
            console.error('❌ updateSliderArrowPosition is not a function:', this.updateSliderArrowPosition);
        }
        
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
            this.updateSliderArrowPosition();
        });
        
        this.arrowElement.addEventListener('load', () => {
            console.log('✅ Arrow image loaded successfully');
        });
        
        window.addEventListener('resize', () => {
            console.log('🏹 Window resized, repositioning arrow...');
            this.updateSliderArrowPosition();
        });
        
        console.log('🏹 Arrow element setup complete');
    }
    
    positionArrow() {
        if (!this.arrowElement) return;
        
        // Use the same positioning logic as the slider frame (based on slider container)
        const sliderContainer = document.getElementById('sliderContainer');
        const sliderRect = sliderContainer.getBoundingClientRect();
        
        // Width = 12% of slider container width, maintain aspect ratio (448x517)
        const arrowWidth = sliderRect.width * 0.12;
        const aspectRatio = 517 / 448; // height / width
        const arrowHeight = arrowWidth * aspectRatio;
        
        this.arrowElement.style.width = `${arrowWidth}px`;
        this.arrowElement.style.height = `${arrowHeight}px`;
        
        // Position relative to slider container (like the frame)
        // 96% across slider width, 40% down slider height
        const arrowX = sliderRect.left + (sliderRect.width * 0.96);
        const arrowY = sliderRect.top + (sliderRect.height * 0.4);
        
        // Center the arrow horizontally and vertically on the calculated position
        this.arrowElement.style.left = `${arrowX - (arrowWidth / 2)}px`;
        this.arrowElement.style.top = `${arrowY - (arrowHeight / 2)}px`;
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
    
    speakText(text) {
        if (!this.audioEnabled || !('speechSynthesis' in window)) return;
        
        console.log('Speaking text:', text); // Debug what's being spoken
        
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
        
        for (let i = buttonNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [buttonNumbers[i], buttonNumbers[j]] = [buttonNumbers[j], buttonNumbers[i]];
        }
        
        // Update the dynamically created buttons
        this.numberButtons.forEach((button, index) => {
            button.dataset.number = buttonNumbers[index];
            button.textContent = buttonNumbers[index];
        });
    }
    
    initializeEventListeners() {
        // Keyboard input handling
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Number button clicks
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
    
    handleKeyPress(e) {
        // Only handle number keys and prevent if buttons are disabled
        if (this.buttonsDisabled || !this.awaitingButtonPress) return;
        
        const key = e.key;
        if (!/^[0-9]$/.test(key)) return;
        
        e.preventDefault();
        
        const now = Date.now();
        const digit = parseInt(key);
        
        // Clear existing timeout
        if (this.keyboardInput.inputTimeout) {
            clearTimeout(this.keyboardInput.inputTimeout);
            this.keyboardInput.inputTimeout = null;
        }
        
        // If more than 3 seconds since last key, start fresh
        if (now - this.keyboardInput.lastKeyTime > 3000) {
            this.keyboardInput.currentInput = '';
        }
        
        this.keyboardInput.currentInput += digit;
        this.keyboardInput.lastKeyTime = now;
        
        console.log(`Keyboard input: ${this.keyboardInput.currentInput}, expected: ${this.expectedBeadsOnRight}`);
        
        // Check for immediate matches (single digit answers)
        if (this.keyboardInput.currentInput.length === 1) {
            const singleDigit = parseInt(this.keyboardInput.currentInput);
            
            // For single digit answers (2, 4, 6, 8)
            if ([2, 4, 6, 8].includes(singleDigit) && singleDigit === this.expectedBeadsOnRight) {
                this.processKeyboardInput(singleDigit);
                return;
            }
            
            // For "2" when expecting "20" - wait to see if "0" follows
            if (digit === 2 && this.expectedBeadsOnRight === 20) {
                this.keyboardInput.inputTimeout = setTimeout(() => {
                    // If no second digit, treat as invalid
                    this.resetKeyboardInput();
                }, 3000);
                return;
            }
            
            // For "1" - always wait for second digit for 10, 12, 14, 16, 18
            if (digit === 1) {
                this.keyboardInput.inputTimeout = setTimeout(() => {
                    // If no second digit, reset
                    this.resetKeyboardInput();
                }, 3000);
                return;
            }
            
            // Invalid single digit input
            this.resetKeyboardInput();
            return;
        }
        
        // Handle two-digit input
        if (this.keyboardInput.currentInput.length === 2) {
            const twoDigit = parseInt(this.keyboardInput.currentInput);
            
            // Check if it matches expected answer
            if (twoDigit === this.expectedBeadsOnRight) {
                this.processKeyboardInput(twoDigit);
            } else {
                // Wrong answer - show feedback
                this.handleIncorrectKeyboardInput(twoDigit);
            }
            return;
        }
        
        // More than 2 digits - reset
        this.resetKeyboardInput();
    }
    
    processKeyboardInput(number) {
        // Find the button with this number
        const targetButton = Array.from(this.numberButtons).find(btn => 
            parseInt(btn.dataset.number) === number
        );
        
        if (targetButton) {
            this.resetKeyboardInput();
            this.handleNumberClick(number, targetButton);
        }
    }
    
    handleIncorrectKeyboardInput(number) {
        // Find the button with this number (if it exists)
        const targetButton = Array.from(this.numberButtons).find(btn => 
            parseInt(btn.dataset.number) === number
        );
        
        if (targetButton) {
            this.resetKeyboardInput();
            this.handleIncorrectAnswer(targetButton);
        } else {
            // Number not found in buttons - just reset
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
        
        this.dragState.activeTouches.delete(touchId);
        this.velocityTracking.delete(touchId);
        
        setTimeout(() => this.checkGameState(), 300);
    }
    
    checkGameState() {
        const currentTime = Date.now();
        const hasMiddleBeads = this.sliderRenderer.hasBeadsInMiddle();
        
        if (hasMiddleBeads) {
            // Invalid arrangement - clear ready timer but keep slider active
            if (this.readyForAnswerTimer) {
                clearTimeout(this.readyForAnswerTimer);
                this.readyForAnswerTimer = null;
                this.readyForAnswerStartTime = null;
            }
            
            // Invalid arrangement - start 10-second inactivity timer
            if (!this.invalidArrangementStartTime) {
                this.invalidArrangementStartTime = currentTime;
                this.lastActivityTime = currentTime; // Reset activity timer
                this.scheduleInactivityCheck();
            }
            
            this.awaitingButtonPress = false;
            // Slider stays active - user needs to fix the arrangement
            return;
        }
        
        // Clear invalid arrangement timer
        if (this.invalidArrangementTimer) {
            clearTimeout(this.invalidArrangementTimer);
            this.invalidArrangementTimer = null;
            this.invalidArrangementStartTime = null;
        }
        
        // Valid arrangement - count right side beads
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        
        if (rightSideCount === this.expectedBeadsOnRight) {
            // Correct count - start 2-second timer, slider stays active until button selection
            this.awaitingButtonPress = false; // Buttons not ready yet
            
            if (!this.readyForAnswerStartTime) {
                this.readyForAnswerStartTime = currentTime;
                this.readyForAnswerTimer = setTimeout(() => {
                    // ONLY NOW disable slider and enable buttons
                    this.sliderDisabled = true;
                    this.awaitingButtonPress = true;
                    
                    // Add rainbow piece
                    this.rainbow.addPiece();
                    
                    if (this.currentQuestion === 1) {
                        this.speakText('Select the button underneath for the number of beads on the right side');
                    } else {
                        this.speakText('Select the matching button underneath');
                    }
                    
                    this.guineaPigWave.startAnimation(70);
                }, 2000);
            }
        } else {
            // Wrong count - clear timer, slider stays active
            if (this.readyForAnswerTimer) {
                clearTimeout(this.readyForAnswerTimer);
                this.readyForAnswerTimer = null;
                this.readyForAnswerStartTime = null;
            }
            
            this.awaitingButtonPress = false;
            // Slider stays active - user needs to add/remove beads
        }
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
                // NEW ENHANCED INACTIVITY MESSAGES
                if (this.currentQuestion === 1) {
                    this.speakText('You need to put 2 beads on the right side in total, with no beads left in the middle');
                } else {
                    const previousTarget = this.expectedBeadsOnRight - 2;
                    this.speakText(`You had ${previousTarget} beads on the right side, now you need 2 more. Make sure no beads are left in the middle`);
                }
                
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
    
    handleNumberClick(selectedNumber, buttonElement) {
        if (!this.awaitingButtonPress) return;
        
        // Check if this button has already been used
        if (this.usedButtons.has(selectedNumber)) {
            this.handleUsedButtonClick(buttonElement);
            return;
        }
        
        const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
        
        if (selectedNumber === rightSideCount) {
            this.handleCorrectAnswer(buttonElement);
        } else {
            this.handleIncorrectAnswer(buttonElement);
        }
    }
    
    handleUsedButtonClick(buttonElement) {
        // Play failure sound and jiggle animation for used button
        this.playFailureSound();
        
        // Add jiggle animation
        buttonElement.style.animation = 'buttonJiggle 0.5s ease-in-out';
        setTimeout(() => {
            buttonElement.style.animation = '';
        }, 500);
    }
    
    handleCorrectAnswer(buttonElement) {
        this.buttonsDisabled = true;
        this.clearTimers();
        
        // Mark this button as used and darken it
        const selectedNumber = parseInt(buttonElement.dataset.number);
        this.usedButtons.add(selectedNumber);
        buttonElement.classList.add('used');
        
        buttonElement.classList.add('correct');
        setTimeout(() => buttonElement.classList.remove('correct'), CONFIG.FLASH_DURATION);
        
        this.createStarCelebration(buttonElement);
        // Rainbow piece already added in checkGameState when correct arrangement was achieved
        this.playCompletionSound();
        
        if (this.audioEnabled) {
            const encouragements = ['Well done!', 'Excellent!', 'Perfect!', 'Great job!'];
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            const rightSideCount = this.sliderRenderer.countBeadsOnRightSide();
            setTimeout(() => {
                // ENHANCED AUDIO: Include bead count in encouragement
                this.speakText(`${randomEncouragement} There are ${rightSideCount} beads on the right side.`);
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
        // Keep slider disabled - will be enabled in startNewQuestion at the right time
        this.sliderDisabled = true;
        
        setTimeout(() => this.startNewQuestion(), CONFIG.NEXT_QUESTION_DELAY + 2000); // Add 2 seconds delay
    }
    
    handleIncorrectAnswer(buttonElement) {
        this.buttonsDisabled = true;
        this.playFailureSound();
        
        buttonElement.classList.add('incorrect');
        setTimeout(() => buttonElement.classList.remove('incorrect'), CONFIG.FLASH_DURATION);
        
        const crossOverlay = document.createElement('div');
        crossOverlay.className = 'cross-overlay';
        buttonElement.appendChild(crossOverlay);
        
        this.numberButtons.forEach(btn => {
            if (btn !== buttonElement) {
                btn.style.transition = 'opacity 700ms ease-in-out';
                btn.style.opacity = '0.1';
            }
        });
        
        setTimeout(() => {
            setTimeout(() => {
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
        
        this.clearTimers();
        this.resetKeyboardInput();
        this.questionStartTime = Date.now();
        
        if (this.currentQuestion === 1) {
            // UPDATED TIMING: 1 second delay for first question
            setTimeout(() => {
                this.speakText('We\'re going to count in twos. Start by sliding 2 beads to the right side');
                // Enable slider 3 seconds AFTER this message starts
                setTimeout(() => {
                    this.sliderDisabled = false;
                }, 3000);
            }, 1000);
            // Show arrow from 1-6 seconds (5-second duration starting at 1 second)
            setTimeout(() => this.showArrowBriefly(5000), 1000);
        } else {
            // UPDATED TIMING: 1 second delay for subsequent questions
            setTimeout(() => {
                this.speakText('Slide 2 more beads to the right side');
                // Enable slider at the START of this message
                this.sliderDisabled = false;
            }, 1000);
            // Show arrow from 1-4 seconds (3-second duration starting at 1 second)
            setTimeout(() => this.showArrowBriefly(3000), 1000);
        }
        
        // Check game state after initialization
        setTimeout(() => this.checkGameState(), 100);
    }
    
    showArrowBriefly(duration = 3000) {
        console.log('🏹 showArrowBriefly called with duration:', duration);
        
        if (!this.arrowElement) {
            console.log('❌ No arrow element in showArrowBriefly');
            return;
        }
        
        console.log('🏹 Arrow element exists, calling positionArrow...');
        
        // Add debugging right before the call
        console.log('🔍 About to call this.updateSliderArrowPosition()');
        console.log('🔍 this.updateSliderArrowPosition type:', typeof this.updateSliderArrowPosition);
        
        // Force position update with current values
        try {
            this.updateSliderArrowPosition();
            console.log('✅ updateSliderArrowPosition() call completed');
        } catch (error) {
            console.error('💥 Error calling updateSliderArrowPosition():', error);
        }
        
        console.log('🏹 Setting arrow opacity to 1...');
        this.arrowElement.style.opacity = '1';
        
        // Pulse for the specified duration with 1-second intervals
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
        this.sliderDisabled = true; // Start with slider disabled
        this.lastActivityTime = null;
        this.usedButtons.clear(); // Reset used buttons for new game
        
        this.clearTimers();
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
        this.clearTimers();
        this.resetKeyboardInput();
        
        this.bear.startCelebration();
        this.modal.classList.remove('hidden');
        
        if (this.audioEnabled) {
            // UPDATED TIMING: 2 seconds instead of 1 second
            setTimeout(() => {
                this.speakText('Well done! Play again or return to the home page.');
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
        this.resetKeyboardInput();
        
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
    window.sliderGame = new SliderGameController();
});

// Clean up resources when page unloads
window.addEventListener('beforeunload', () => {
    if (window.sliderGame) {
        window.sliderGame.destroy();
    }
});
