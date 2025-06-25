class TraceGameController {
    constructor() {
        // Core components
        this.renderer = null;
        this.pathManager = null;
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // MAIN GAME STATE - All controlled by this controller
        this.currentNumberIndex = 0;
        this.currentNumber = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        this.playingBalloonGame = false;
        
        // BALLOON GAME STATE - Integrated into main controller
        this.balloons = [];
        this.fallingNumbers = [];
        this.correctBalloonsFound = 0;
        this.totalCorrectBalloons = 3;
        this.balloonAnimationId = null;
        this.balloonLastTime = 0;
        
        // MAIN GAME PROGRESSION LOGIC
        this.numbersSequence = [...CONFIG.NUMBERS_SEQUENCE];
        this.currentVoiceGender = 'boy'; // Start with boy voice
        
        // Audio management
        this.audioContext = null;
        this.audioEnabled = CONFIG.AUDIO_ENABLED;
        
        // DOM elements
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.numberWordDisplay = document.getElementById('numberWord');
        this.traceContainer = document.getElementById('traceContainer');
        
        // Event handlers
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        this.initializeGame();
    }

    async initializeGame() {
        console.log('Initializing main game controller...');
        
        // Find DOM elements
        this.findDOMElements();
        
        // Add window resize listener
        window.addEventListener('resize', this.handleResize);
        
        // Initialize audio system
        await this.initializeAudio();
        
        // Create main renderer
        this.renderer = new TraceNumberRenderer();
        if (!this.renderer.initialize('traceContainer')) {
            console.error('Failed to initialize renderer');
            return;
        }
        
        // Create path manager
        this.pathManager = new TracePathManager(this.renderer.svg, this.renderer);
        
        // Wait for dependencies to be ready
        await this.waitForDependencies();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start the first number
        this.startNewNumber();
        
        console.log('Main game controller initialized successfully');
    }

    async waitForDependencies() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkDependencies = () => {
                attempts++;
                
                if (typeof CONFIG === 'undefined') {
                    console.warn('CONFIG not yet available, waiting...');
                    if (attempts < maxAttempts) {
                        requestAnimationFrame(checkDependencies);
                        return;
                    }
                }
                
                if (!this.renderer || !this.renderer.svg) {
                    console.warn('Renderer SVG not yet ready, waiting...');
                    if (attempts < maxAttempts) {
                        requestAnimationFrame(checkDependencies);
                        return;
                    }
                }
                
                console.log('All dependencies ready');
                resolve();
            };
            
            setTimeout(checkDependencies, 100);
        });
    }

    findDOMElements() {
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.numberWordDisplay = document.getElementById('numberWord');
        this.traceContainer = document.getElementById('traceContainer');
        
        if (!this.traceContainer) {
            console.error('Trace container not found');
        }
    }

    async initializeAudio() {
        if (!this.audioEnabled) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.audioEnabled = false;
        }
    }

    setupEventListeners() {
        // Play again button
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => {
                this.startNewGame();
            });
        }
        
        // Renderer callbacks
        this.setupRendererCallbacks();
        
        // Page visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Debug keyboard controls
        document.addEventListener('keydown', (e) => {
            if (CONFIG.DEBUG_MODE) {
                if (e.key === ' ') {
                    e.preventDefault();
                    this.completeCurrentNumber();
                }
                if (e.key === 'r' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    e.preventDefault();
                    this.startCurrentNumberOver();
                }
                if (e.key >= '0' && e.key <= '9' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    e.preventDefault();
                    const targetNumber = parseInt(e.key);
                    this.skipToNumber(targetNumber);
                }
                if (e.key === 'd') {
                    e.preventDefault();
                    this.pathManager.showCoordinatePoints();
                }
            }
        });
    }

    setupRendererCallbacks() {
        const originalCompleteNumber = this.renderer.completeNumber.bind(this.renderer);
        this.renderer.completeNumber = () => {
            originalCompleteNumber();
            this.handleNumberCompletion();
        };
        
        const originalCompleteStroke = this.renderer.completeStroke.bind(this.renderer);
        this.renderer.completeStroke = (strokeIndex) => {
            originalCompleteStroke(strokeIndex);
            this.handleStrokeCompletion(strokeIndex);
        };
    }

    handleResize() {
        console.log('Window resized, updating game dimensions');
        
        if (this.renderer && this.renderer.svg) {
            this.renderer.updateSVGDimensions();
        }
        
        if (this.renderer && this.currentNumber !== null) {
            this.renderer.renderNumber(this.currentNumber);
            
            if (this.pathManager && !this.playingBalloonGame) {
                this.pathManager.startNewStroke(this.renderer.currentStroke);
            }
        }
    }

    // MAIN GAME FLOW CONTROL
    startNewGame() {
        console.log('Starting new game');
        
        // Reset ALL game state
        this.currentNumberIndex = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        this.playingBalloonGame = false;
        this.currentVoiceGender = 'boy';
        
        // Reset balloon game state
        this.balloons = [];
        this.fallingNumbers = [];
        this.correctBalloonsFound = 0;
        if (this.balloonAnimationId) {
            cancelAnimationFrame(this.balloonAnimationId);
            this.balloonAnimationId = null;
        }
        
        // Reset components
        this.rainbow.reset();
        this.bear.reset();
        this.renderer.reset();
        this.pathManager.reset();
        
        // Hide modal
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
        
        this.updateNumberWordDisplay('');
        
        // Start first number
        this.startNewNumber();
    }

    startNewNumber() {
        if (this.currentNumberIndex >= this.numbersSequence.length) {
            this.completeGame();
            return;
        }
        
        this.currentNumber = this.numbersSequence[this.currentNumberIndex];
        console.log(`Starting number: ${this.currentNumber} (${this.currentNumberIndex + 1}/${this.numbersSequence.length})`);
        console.log(`Using ${this.currentVoiceGender} voice`);
        
        this.updateNumberWordDisplay('');
        
        // Render the number
        if (!this.renderer.renderNumber(this.currentNumber)) {
            console.error('Failed to render number:', this.currentNumber);
            return;
        }
        
        // Start tracing for first stroke
        this.pathManager.startNewStroke(0);
        
        // Announce the number
        if (this.audioEnabled) {
            this.speakText(`Trace the number ${this.currentNumber}`, this.currentVoiceGender);
        }
    }

    startCurrentNumberOver() {
        console.log('Restarting current number:', this.currentNumber);
        
        this.renderer.renderNumber(this.currentNumber);
        this.pathManager.startNewStroke(0);
        this.updateNumberWordDisplay('');
    }

    handleStrokeCompletion(strokeIndex) {
        console.log(`Stroke ${strokeIndex} completed for number ${this.currentNumber}`);
        
        const totalStrokes = this.renderer.getStrokeCount();
        
        if (strokeIndex + 1 < totalStrokes) {
            // Move to next stroke
            this.pathManager.moveToNextStroke();
        }
        // If no more strokes, handleNumberCompletion will be called by renderer
    }

    handleNumberCompletion() {
        if (this.isProcessingCompletion) return;
        this.isProcessingCompletion = true;
        
        console.log(`Number ${this.currentNumber} completed!`);
        
        // Clean up path manager
        this.pathManager.cleanup();
        
        // Add rainbow piece - this is the key reward system
        const pieces = this.rainbow.addPiece();
        console.log(`Rainbow pieces: ${pieces}/${CONFIG.RAINBOW_PIECES}`);
        
        // Start the balloon mini-game
        this.startBalloonMiniGame();
    }

    // =============================================================================
    // INTEGRATED BALLOON GAME LOGIC
    // =============================================================================

    startBalloonMiniGame() {
        console.log('Starting balloon mini-game for number:', this.currentNumber);
        
        this.playingBalloonGame = true;
        this.correctBalloonsFound = 0;
        this.balloons = [];
        this.fallingNumbers = [];
        
        // Clear number word display during balloon game
        this.updateNumberWordDisplay('');
        
        // Create ground element
        this.createBalloonGround();
        
        // Create 12 balloons with random positions and speeds
        this.createBalloons();
        
        // Start animation loop
        this.balloonLastTime = performance.now();
        this.animateBalloons();
        
        // Speak instruction
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText(`Pop the balloons with the number ${this.currentNumber}!`, this.currentVoiceGender);
            }, 500);
        }
    }

    createBalloonGround() {
        // Remove existing ground
        const existingGround = this.renderer.svg.querySelector('.balloon-ground');
        if (existingGround) {
            existingGround.remove();
        }
        
        const groundLevel = CONFIG.SVG_HEIGHT - 80;
        const ground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        ground.setAttribute('x', 0);
        ground.setAttribute('y', groundLevel);
        ground.setAttribute('width', CONFIG.SVG_WIDTH);
        ground.setAttribute('height', 80);
        ground.setAttribute('fill', '#90EE90'); // Light green ground
        ground.setAttribute('class', 'balloon-ground');
        
        this.renderer.svg.appendChild(ground);
    }

    createBalloons() {
        const balloonCount = 12;
        const balloonWidth = 100; // Increased for larger balloons
        
        // Generate non-overlapping positions
        const positions = this.generateNonOverlappingPositions(balloonCount, balloonWidth);
        
        // Create array of numbers: 3 correct + 9 random different
        const numbers = [];
        
        // Add 3 correct numbers
        for (let i = 0; i < this.totalCorrectBalloons; i++) {
            numbers.push(this.currentNumber);
        }
        
        // Add 9 different random numbers (0-9, excluding current number)
        const availableNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => n !== this.currentNumber);
        for (let i = 0; i < 9; i++) {
            const randomNum = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
            numbers.push(randomNum);
        }
        
        // Shuffle the numbers array
        this.shuffleArray(numbers);
        
        // Create balloons
        for (let i = 0; i < balloonCount; i++) {
            const balloon = this.createBalloon(positions[i], numbers[i]);
            this.balloons.push(balloon);
        }
        
        console.log(`Created ${balloonCount} balloons with ${this.totalCorrectBalloons} correct numbers`);
    }

    createBalloonString(balloon) {
        const balloonRadius = 35;
        const stringLength = 60;
        
        // Create curved string path
        const string = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // String starts at bottom of balloon
        const startX = balloon.x + balloonRadius;
        const startY = balloon.y + balloonRadius * 2; // Bottom of balloon
        
        // String ends below balloon with slight curve
        const endX = startX + (Math.random() - 0.5) * 20; // Slight horizontal offset
        const endY = startY + stringLength;
        
        // Control points for curved string
        const controlX1 = startX + (Math.random() - 0.5) * 15;
        const controlY1 = startY + stringLength * 0.3;
        const controlX2 = endX + (Math.random() - 0.5) * 15;
        const controlY2 = startY + stringLength * 0.7;
        
        // Create curved path
        const pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
        
        string.setAttribute('d', pathData);
        string.setAttribute('stroke', '#8B4513'); // Brown string
        string.setAttribute('stroke-width', 2);
        string.setAttribute('fill', 'none');
        string.setAttribute('class', 'balloon-string');
        
        // Store string properties for animation
        balloon.stringEndX = endX;
        balloon.stringEndY = endY;
        balloon.stringControlX1 = controlX1;
        balloon.stringControlY1 = controlY1;
        balloon.stringControlX2 = controlX2;
        balloon.stringControlY2 = controlY2;
        balloon.initialY = balloon.y; // Store initial position for relative calculations
        
        return string;
    }
        const positions = [];
        const margin = 20;
        const totalWidth = width + margin;
        const availableWidth = CONFIG.SVG_WIDTH - width;
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let position;
            
            do {
                position = Math.random() * availableWidth;
                attempts++;
            } while (this.hasOverlap(position, positions, totalWidth) && attempts < 50);
            
            positions.push(position);
        }
        
        return positions.sort((a, b) => a - b);
    }

    hasOverlap(newPos, existingPositions, minDistance) {
        return existingPositions.some(pos => Math.abs(newPos - pos) < minDistance);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    createBalloon(x, number) {
        const isCorrectNumber = number === this.currentNumber;
        const riseSpeed = 40 + Math.random() * 20; // 40-60 pixels per second
        const groundLevel = CONFIG.SVG_HEIGHT - 80;
        
        // Rainbow colors for balloons
        const balloonColors = [
            '#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00',
            '#00FF80', '#00FFFF', '#0080FF', '#0000FF', '#8000FF'
        ];
        const balloonColor = balloonColors[Math.floor(Math.random() * balloonColors.length)];
        
        // Number words
        const numberWords = {
            0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four',
            5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine'
        };
        
        const balloon = {
            x: x,
            y: groundLevel - 80, // Start just above ground (not below screen)
            number: number,
            isCorrect: isCorrectNumber,
            riseSpeed: riseSpeed,
            popped: false,
            color: balloonColor,
            group: null
        };
        
        // Create balloon group
        const balloonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        balloonGroup.setAttribute('class', 'balloon-group');
        balloonGroup.style.cursor = 'pointer';
        
        // Create balloon string FIRST (curved and properly connected)
        const string = this.createBalloonString(balloon);
        balloonGroup.appendChild(string);
        
        // Create larger balloon circle
        const balloonRadius = 35; // Increased from 25 to 35
        const balloonCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        balloonCircle.setAttribute('cx', balloon.x + balloonRadius);
        balloonCircle.setAttribute('cy', balloon.y + balloonRadius);
        balloonCircle.setAttribute('r', balloonRadius);
        balloonCircle.setAttribute('fill', balloonColor);
        balloonCircle.setAttribute('stroke', '#333');
        balloonCircle.setAttribute('stroke-width', 2);
        balloonCircle.setAttribute('class', 'balloon-circle');
        
        // Add balloon highlight for 3D effect
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.setAttribute('cx', balloon.x + balloonRadius - 10);
        highlight.setAttribute('cy', balloon.y + balloonRadius - 10);
        highlight.setAttribute('r', 8);
        highlight.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
        highlight.setAttribute('class', 'balloon-highlight');
        
        balloonGroup.appendChild(balloonCircle);
        balloonGroup.appendChild(highlight);
        
        // Create number text with word version
        const numberWord = numberWords[number];
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', balloon.x + balloonRadius);
        numberText.setAttribute('y', balloon.y + balloonRadius - 5);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '14'); // Smaller font for word
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.setAttribute('stroke', '#333');
        numberText.setAttribute('stroke-width', '0.5');
        numberText.setAttribute('class', 'balloon-number-word');
        numberText.textContent = numberWord;
        
        // Create numeric digit below the word
        const numberDigit = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberDigit.setAttribute('x', balloon.x + balloonRadius);
        numberDigit.setAttribute('y', balloon.y + balloonRadius + 12);
        numberDigit.setAttribute('text-anchor', 'middle');
        numberDigit.setAttribute('dominant-baseline', 'middle');
        numberDigit.setAttribute('font-size', '20'); // Larger font for digit
        numberDigit.setAttribute('font-weight', 'bold');
        numberDigit.setAttribute('fill', 'white');
        numberDigit.setAttribute('stroke', '#333');
        numberDigit.setAttribute('stroke-width', '1');
        numberDigit.setAttribute('class', 'balloon-number-digit');
        numberDigit.textContent = number;
        
        balloonGroup.appendChild(numberText);
        balloonGroup.appendChild(numberDigit);
        
        // Add click handler
        balloonGroup.addEventListener('click', () => this.popBalloon(balloon));
        balloonGroup.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.popBalloon(balloon);
        });
        
        balloon.group = balloonGroup;
        balloon.string = string;
        balloon.circle = balloonCircle;
        balloon.highlight = highlight;
        balloon.textWord = numberText;
        balloon.textDigit = numberDigit;
        balloon.radius = balloonRadius;
        
        this.renderer.svg.appendChild(balloonGroup);
        
        return balloon;
    }

    popBalloon(balloon) {
        if (balloon.popped || !this.playingBalloonGame) return;
        
        balloon.popped = true;
        
        console.log(`Balloon popped with number: ${balloon.number}, correct: ${balloon.isCorrect}`);
        
        // Play pop sound effect
        if (this.audioEnabled) {
            this.playCompletionSound();
        }
        
        if (balloon.isCorrect) {
            // Correct balloon popped!
            this.correctBalloonsFound++;
            
            // Create falling number at balloon position
            this.createFallingNumber(balloon.x + 25, balloon.y + 25, balloon.number);
            
            // Speak encouragement
            if (this.audioEnabled) {
                const encouragements = ['Great job!', 'Well done!', 'Excellent!', 'Perfect!'];
                const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                setTimeout(() => {
                    this.speakText(randomEncouragement, this.currentVoiceGender);
                }, 200);
            }
        }
        
        // Remove balloon with pop animation
        if (balloon.group) {
            this.createPopEffect(balloon.x + 25, balloon.y + 25);
            balloon.group.remove();
        }
        
        // Check if game is complete
        this.checkBalloonGameCompletion();
    }

    createPopEffect(x, y) {
        const popGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        popGroup.setAttribute('class', 'pop-effect');
        
        // Create multiple small circles radiating outward
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const distance = 30;
            const particleX = x + Math.cos(angle) * distance;
            const particleY = y + Math.sin(angle) * distance;
            
            const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            particle.setAttribute('cx', particleX);
            particle.setAttribute('cy', particleY);
            particle.setAttribute('r', 3);
            particle.setAttribute('fill', '#FFD700');
            particle.setAttribute('opacity', 1);
            
            // Animate particle
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'opacity');
            animate.setAttribute('values', '1;0');
            animate.setAttribute('dur', '0.5s');
            animate.setAttribute('fill', 'freeze');
            
            particle.appendChild(animate);
            popGroup.appendChild(particle);
        }
        
        this.renderer.svg.appendChild(popGroup);
        
        // Remove effect after animation
        setTimeout(() => {
            if (popGroup.parentNode) {
                popGroup.parentNode.removeChild(popGroup);
            }
        }, 500);
    }

    createFallingNumber(x, y, number) {
        const groundLevel = CONFIG.SVG_HEIGHT - 80;
        
        const fallingNumber = {
            x: x,
            y: y,
            targetY: groundLevel - 40,
            number: number,
            speed: 100, // pixels per second
            element: null,
            landed: false
        };
        
        // Create large number element
        const numberElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberElement.setAttribute('x', fallingNumber.x);
        numberElement.setAttribute('y', fallingNumber.y);
        numberElement.setAttribute('text-anchor', 'middle');
        numberElement.setAttribute('dominant-baseline', 'middle');
        numberElement.setAttribute('font-size', '60');
        numberElement.setAttribute('font-weight', 'bold');
        numberElement.setAttribute('fill', CONFIG.FILL_COLOR);
        numberElement.setAttribute('stroke', 'white');
        numberElement.setAttribute('stroke-width', 2);
        numberElement.setAttribute('class', 'falling-number');
        numberElement.textContent = number;
        
        fallingNumber.element = numberElement;
        this.fallingNumbers.push(fallingNumber);
        this.renderer.svg.appendChild(numberElement);
        
        console.log(`Created falling number ${number} at (${x}, ${y})`);
        
        return fallingNumber;
    }

    animateBalloons(currentTime = performance.now()) {
        if (!this.playingBalloonGame) return;
        
        const deltaTime = (currentTime - this.balloonLastTime) / 1000;
        this.balloonLastTime = currentTime;
        
        // Update balloons (rise upward)
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                // Move balloon up at its individual speed
                balloon.y -= balloon.riseSpeed * deltaTime;
                
                // Update balloon position
                if (balloon.circle) {
                    balloon.circle.setAttribute('cy', balloon.y + balloon.radius);
                }
                if (balloon.highlight) {
                    balloon.highlight.setAttribute('cy', balloon.y + balloon.radius - 10);
                }
                if (balloon.textWord) {
                    balloon.textWord.setAttribute('y', balloon.y + balloon.radius - 5);
                }
                if (balloon.textDigit) {
                    balloon.textDigit.setAttribute('y', balloon.y + balloon.radius + 12);
                }
                
                // Update string - FIXED: String stays connected to bottom of balloon
                if (balloon.string) {
                    const startX = balloon.x + balloon.radius;
                    const startY = balloon.y + balloon.radius * 2; // Bottom of balloon
                    
                    // Calculate how much the balloon has moved from initial position
                    const deltaY = balloon.y - balloon.initialY;
                    
                    // String end and control points move with balloon
                    const endX = balloon.stringEndX;
                    const endY = balloon.stringEndY + deltaY;
                    const controlX1 = balloon.stringControlX1;
                    const controlY1 = balloon.stringControlY1 + deltaY;
                    const controlX2 = balloon.stringControlX2;
                    const controlY2 = balloon.stringControlY2 + deltaY;
                    
                    const pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
                    balloon.string.setAttribute('d', pathData);
                }
                
                // Check if balloon reached top of screen
                if (balloon.y < -100) {
                    balloon.popped = true;
                    if (balloon.group) {
                        balloon.group.remove();
                    }
                }
            }
        });
        
        // Update falling numbers
        this.fallingNumbers.forEach(fallingNumber => {
            if (!fallingNumber.landed) {
                // Move number down
                fallingNumber.y += fallingNumber.speed * deltaTime;
                
                // Check if reached ground
                if (fallingNumber.y >= fallingNumber.targetY) {
                    fallingNumber.y = fallingNumber.targetY;
                    fallingNumber.landed = true;
                }
                
                // Update element position
                if (fallingNumber.element) {
                    fallingNumber.element.setAttribute('y', fallingNumber.y);
                }
            }
        });
        
        // Check if all balloons are gone
        const activeBalloonsCount = this.balloons.filter(b => !b.popped).length;
        if (activeBalloonsCount === 0) {
            this.checkBalloonGameCompletion();
            return;
        }
        
        // Continue animation
        this.balloonAnimationId = requestAnimationFrame((time) => this.animateBalloons(time));
    }

    checkBalloonGameCompletion() {
        const activeBalloonsCount = this.balloons.filter(b => !b.popped).length;
        
        if (this.correctBalloonsFound >= this.totalCorrectBalloons || activeBalloonsCount === 0) {
            console.log(`Balloon game completing: found ${this.correctBalloonsFound}/${this.totalCorrectBalloons} correct balloons`);
            
            // Wait 1 second after last number lands, then complete
            setTimeout(() => {
                this.onBalloonGameComplete();
            }, 1000);
        }
    }

    onBalloonGameComplete() {
        console.log('Balloon mini-game completed for number:', this.currentNumber);
        
        this.playingBalloonGame = false;
        
        // Cancel animation
        if (this.balloonAnimationId) {
            cancelAnimationFrame(this.balloonAnimationId);
            this.balloonAnimationId = null;
        }
        
        // Clear balloon game elements
        this.clearBalloonGameElements();
        
        // Update game progress
        this.numbersCompleted++;
        
        // Check if rainbow is complete (game finished)
        if (this.rainbow.isComplete()) {
            console.log('Rainbow completed! Starting end game sequence...');
            setTimeout(() => {
                this.completeGame();
            }, 1000);
            return;
        }
        
        // Switch voice gender for NEXT number
        this.switchVoiceGender();
        
        // Move to next number after delay
        setTimeout(() => {
            this.moveToNextNumber();
        }, 1000);
    }

    clearBalloonGameElements() {
        // Clear all balloon game elements from SVG
        const elementsToRemove = this.renderer.svg.querySelectorAll(
            '.balloon-group, .falling-number, .pop-effect, .balloon-ground'
        );
        elementsToRemove.forEach(element => element.remove());
        
        // Reset balloon game state
        this.balloons = [];
        this.fallingNumbers = [];
        this.correctBalloonsFound = 0;
    }

    // =============================================================================
    // CONTINUED MAIN GAME LOGIC
    // =============================================================================

    switchVoiceGender() {
        this.currentVoiceGender = this.currentVoiceGender === 'boy' ? 'girl' : 'boy';
        console.log(`Switched to ${this.currentVoiceGender} voice for next number`);
    }

    moveToNextNumber() {
        this.currentNumberIndex++;
        this.isProcessingCompletion = false;
        this.startNewNumber();
    }

    showNumberWord() {
        const numberWord = CONFIG.NUMBER_WORDS[this.currentNumber];
        if (numberWord) {
            this.updateNumberWordDisplay(numberWord);
            
            // Speak the number word using SAME voice gender as the initial instruction
            if (this.audioEnabled) {
                setTimeout(() => {
                    this.speakText(numberWord, this.currentVoiceGender);
                }, 500);
            }
        }
    }

    updateNumberWordDisplay(text) {
        if (this.numberWordDisplay) {
            this.numberWordDisplay.textContent = text;
            
            if (text) {
                this.numberWordDisplay.classList.add('visible');
            } else {
                this.numberWordDisplay.classList.remove('visible');
            }
        }
    }

    completeGame() {
        if (this.gameComplete) return;
        
        this.gameComplete = true;
        console.log('Game completed! All numbers traced and rainbow complete.');
        
        // Clean up current tracing
        this.pathManager.cleanup();
        
        // Show the completion modal
        if (this.modal) {
            this.modal.classList.remove('hidden');
        }
        
        // Start bear celebration when modal opens
        this.bear.startCelebration();
        
        // Speak completion message using current voice gender
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Excellent work! You traced all the numbers!', this.currentVoiceGender);
            }, 1000);
        }
    }

    // Enhanced audio methods with voice gender support
    speakText(text, preferredGender = null) {
        if (!this.audioEnabled) return;
        
        try {
            // Use Web Speech API for text-to-speech
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9; // Slightly slower for children
                utterance.pitch = 1.3; // Higher pitch for child-like voices
                utterance.volume = 0.8;
                
                // Get available voices
                const voices = speechSynthesis.getVoices();
                let selectedVoice = null;
                
                // Try to find child-like voices based on preferred gender
                if (preferredGender === 'boy') {
                    // Look for boy/male child voices first
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('boy') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('young') ||
                        voice.name.toLowerCase().includes('junior') ||
                        (voice.name.toLowerCase().includes('male') && voice.name.toLowerCase().includes('child')) ||
                        voice.name.toLowerCase().includes('daniel') ||
                        voice.name.toLowerCase().includes('alex') ||
                        voice.name.toLowerCase().includes('david')
                    );
                    
                    // Fallback to higher-pitched male voices
                    if (!selectedVoice) {
                        selectedVoice = voices.find(voice => 
                            voice.name.toLowerCase().includes('male') ||
                            (voice.gender && voice.gender.toLowerCase() === 'male')
                        );
                    }
                } else if (preferredGender === 'girl') {
                    // Look for girl/female child voices first
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('girl') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('young') ||
                        voice.name.toLowerCase().includes('junior') ||
                        (voice.name.toLowerCase().includes('female') && voice.name.toLowerCase().includes('child')) ||
                        voice.name.toLowerCase().includes('samantha') ||
                        voice.name.toLowerCase().includes('victoria') ||
                        voice.name.toLowerCase().includes('karen') ||
                        voice.name.toLowerCase().includes('emma')
                    );
                    
                    // Fallback to higher-pitched female voices
                    if (!selectedVoice) {
                        selectedVoice = voices.find(voice => 
                            voice.name.toLowerCase().includes('female') ||
                            (voice.gender && voice.gender.toLowerCase() === 'female')
                        );
                    }
                }
                
                // Final fallback to any child-friendly voice
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('young') ||
                        voice.name.toLowerCase().includes('female') ||
                        voice.gender === 'female'
                    );
                }
                
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                    console.log(`Using voice: ${selectedVoice.name} for ${preferredGender || 'default'} speech`);
                }
                
                // Adjust pitch and rate for more child-like sound
                if (preferredGender === 'boy') {
                    utterance.pitch = 1.2; // Higher than adult male but not as high as girl
                    utterance.rate = 0.9;
                } else if (preferredGender === 'girl') {
                    utterance.pitch = 1.4; // Higher pitch for girl voice
                    utterance.rate = 0.9;
                }
                
                speechSynthesis.speak(utterance);
                console.log(`Speaking (${preferredGender || 'default'}):`, text);
            }
        } catch (error) {
            console.warn('Speech synthesis failed:', error);
        }
    }

    playCompletionSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            // Create a simple success tone
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Completion sound failed:', error);
        }
    }

    // Handle page visibility changes
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause any ongoing speech when page becomes hidden
            if ('speechSynthesis' in window) {
                speechSynthesis.pause();
            }
            
            // Pause balloon game animation if active
            if (this.playingBalloonGame) {
                console.log('Page hidden, pausing balloon game');
            }
        } else {
            // Resume speech when page becomes visible
            if ('speechSynthesis' in window) {
                speechSynthesis.resume();
            }
            
            // Resume balloon game if needed
            if (this.playingBalloonGame) {
                console.log('Page visible, resuming balloon game');
            }
        }
    }

    // Utility methods
    getCurrentNumber() {
        return this.currentNumber;
    }

    getCurrentProgress() {
        return {
            currentNumber: this.currentNumber,
            currentIndex: this.currentNumberIndex,
            totalNumbers: this.numbersSequence.length,
            completed: this.numbersCompleted,
            progress: this.numbersCompleted / CONFIG.NUMBERS_TO_COMPLETE
        };
    }

    isGameComplete() {
        return this.gameComplete;
    }

    // Debug methods
    skipToNumber(number) {
        if (!CONFIG.DEBUG_MODE) return;
        
        const index = this.numbersSequence.indexOf(number);
        if (index !== -1) {
            this.currentNumberIndex = index;
            this.startNewNumber();
        }
    }

    completeCurrentNumber() {
        if (!CONFIG.DEBUG_MODE) return;
        
        // Force complete current number for testing
        this.renderer.completeNumber();
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        console.log('Audio', this.audioEnabled ? 'enabled' : 'disabled');
    }

    // Cleanup
    destroy() {
        console.log('Destroying game controller');
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Clean up components
        if (this.pathManager) {
            this.pathManager.cleanup();
        }
        
        // Clean up balloon game
        if (this.balloonAnimationId) {
            cancelAnimationFrame(this.balloonAnimationId);
            this.balloonAnimationId = null;
        }
        this.clearBalloonGameElements();
        
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer.reset();
        }
        
        this.rainbow.reset();
        this.bear.reset();
        
        // Cancel any ongoing speech
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        console.log('Game controller destroyed');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Handle page visibility for audio management
    document.addEventListener('visibilitychange', () => {
        if (window.traceGame) {
            window.traceGame.handleVisibilityChange();
        }
    });
    
    // Initialize the game
    window.traceGame = new TraceGameController();
    
    console.log('Trace game loaded and ready!');
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.traceGame) {
        window.traceGame.destroy();
    }
});
