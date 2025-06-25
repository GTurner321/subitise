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
        this.speechComplete = false;
        this.numbersLanded = false;
        
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
        
        // Initialize rainbow with proper size for full screen
        this.initializeRainbowSize();
        
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

    initializeRainbowSize() {
        // Override the rainbow size calculation to fit 75% of game width
        const gameWidth = CONFIG.SVG_WIDTH;
        const appropriateRainbowWidth = gameWidth * 0.75; // 75% of game width
        
        // Temporarily override the rainbow's width calculation
        const originalInitialize = this.rainbow.initializeArcs.bind(this.rainbow);
        this.rainbow.initializeArcs = function() {
            // Clear existing arcs
            this.container.innerHTML = '';
            
            // Use the controller's specified width instead of calculating from game area
            const rainbowWidth = appropriateRainbowWidth;
            
            // Create all 10 rainbow arcs (initially hidden)
            for (let i = 0; i < this.maxPieces; i++) {
                const arc = document.createElement('div');
                arc.className = 'rainbow-arc';
                arc.id = `arc-${i}`;
                
                // Calculate radius for this arc (outermost first)
                const baseRadius = rainbowWidth / 2;
                const radius = baseRadius - (i * this.arcWidth);
                
                // Set arc properties for semi-circle
                arc.style.width = radius * 2 + 'px';
                arc.style.height = radius + 'px';
                arc.style.borderTopWidth = this.arcWidth + 'px';
                arc.style.borderTopColor = this.colors[i];
                arc.style.borderRadius = radius + 'px ' + radius + 'px 0 0';
                arc.style.position = 'absolute';
                arc.style.bottom = '0';
                arc.style.left = '50%';
                arc.style.transform = 'translateX(-50%)';
                arc.style.opacity = '0'; // Start completely hidden
                arc.style.transition = 'opacity 0.5s ease-in-out';
                arc.style.pointerEvents = 'none';
                
                this.container.appendChild(arc);
            }
        };
        
        // Reinitialize the rainbow with the new size
        this.rainbow.initializeArcs();
        
        console.log(`Rainbow initialized with width: ${appropriateRainbowWidth}px (75% of game width)`);
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
        
        // Update rainbow size on resize
        this.initializeRainbowSize();
        
        if (this.renderer && this.currentNumber !== null) {
            this.renderer.renderNumber(this.currentNumber);
            
            if (this.pathManager && !this.playingBalloonGame) {
                this.pathManager.startNewStroke(this.renderer.currentStroke);
            }
        }
    }

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
        this.speechComplete = false;
        this.numbersLanded = false;
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

    startBalloonMiniGame() {
        console.log('Starting balloon mini-game for number:', this.currentNumber);
        
        this.playingBalloonGame = true;
        this.correctBalloonsFound = 0;
        this.balloons = [];
        this.fallingNumbers = [];
        this.speechComplete = false;
        this.numbersLanded = false;
        
        // Clear number word display during balloon game
        this.updateNumberWordDisplay('');
        
        // Create 12 balloons with random positions and speeds
        this.createBalloons();
        
        // Start animation loop
        this.balloonLastTime = performance.now();
        this.animateBalloons();
        
        // Speak instruction and track completion
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakTextWithCallback(
                    `Pop the balloons with the number ${this.currentNumber}!`, 
                    this.currentVoiceGender,
                    () => {
                        this.speechComplete = true;
                        console.log('Speech completed');
                        this.checkBalloonGameCompletion();
                    }
                );
            }, 500);
        } else {
            // If audio disabled, mark speech as complete immediately
            this.speechComplete = true;
        }
    }

    createBalloons() {
        const balloonCount = 12;
        const balloonWidth = 120; // Increased from 100 to 120 (20% larger)
        
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
        
        // Create balloons with random starting heights
        for (let i = 0; i < balloonCount; i++) {
            const balloon = this.createBalloon(positions[i], numbers[i]);
            this.balloons.push(balloon);
        }
        
        console.log(`Created ${balloonCount} balloons with ${this.totalCorrectBalloons} correct numbers`);
    }

    generateNonOverlappingPositions(count, width) {
        const positions = [];
        const margin = 20;
        const totalWidth = width + margin;
        
        // Keep balloons within 90% of game area width
        const gameAreaWidth = CONFIG.SVG_WIDTH;
        const constrainedWidth = gameAreaWidth * 0.9; // 90% of game area
        const availableWidth = constrainedWidth - width;
        const startOffset = (gameAreaWidth - constrainedWidth) / 2; // Center the 90% area
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let position;
            
            do {
                position = startOffset + (Math.random() * availableWidth);
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
        const riseSpeed = 20 + Math.random() * 20; // Slower: 20-40 pixels per second
        
        // Random starting height in lower half of game area
        const gameAreaHeight = CONFIG.SVG_HEIGHT - 80; // Total game area minus grass
        const lowerHalfStart = gameAreaHeight * 0.5; // Start of lower half
        const randomStartHeight = lowerHalfStart + Math.random() * (gameAreaHeight * 0.3); // Random within lower portion
        
        // Random sideways movement
        const sidewaysSpeed = (Math.random() - 0.5) * 30; // Random speed between -15 and +15 pixels/second
        
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
            y: randomStartHeight, // Random starting height in lower half
            number: number,
            isCorrect: isCorrectNumber,
            riseSpeed: riseSpeed,
            sidewaysSpeed: sidewaysSpeed, // Add sideways movement
            sidewaysDirection: Math.sign(sidewaysSpeed) || 1, // Track direction (1 or -1)
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
        
        // Create LARGER balloon circle (increased from 45 to 54)
        const balloonRadius = 54; // Increased by 20% from 45
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
        highlight.setAttribute('cx', balloon.x + balloonRadius - 17); // Adjusted for larger balloon
        highlight.setAttribute('cy', balloon.y + balloonRadius - 17);
        highlight.setAttribute('r', 14); // Larger highlight for bigger balloon
        highlight.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
        highlight.setAttribute('class', 'balloon-highlight');
        
        balloonGroup.appendChild(balloonCircle);
        balloonGroup.appendChild(highlight);
        
        // Create LARGER number text (increased from 22 to 26)
        const numberWord = numberWords[number];
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', balloon.x + balloonRadius);
        numberText.setAttribute('y', balloon.y + balloonRadius + 2); // Centered in balloon
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '26'); // Increased from 22 to 26 (about 18% larger)
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.setAttribute('stroke', '#333');
        numberText.setAttribute('stroke-width', '1.4'); // Slightly thicker stroke
        numberText.setAttribute('class', 'balloon-number-word');
        numberText.textContent = numberWord;
        
        balloonGroup.appendChild(numberText);
        
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
        balloon.radius = balloonRadius;
        
        this.renderer.svg.appendChild(balloonGroup);
        
        return balloon;
    }

    createBalloonString(balloon) {
        const balloonRadius = 54; // Updated for larger balloons
        const stringLength = 120; // Longer string for larger balloons
        
        // Create CURLY string like a stretched S
        const string = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // String starts at bottom of balloon
        const startX = balloon.x + balloonRadius;
        const startY = balloon.y + balloonRadius * 2; // Bottom of balloon
        
        // String ends below balloon
        const endX = startX; // Same X position - ends straight down
        const endY = startY + stringLength;
        
        // Create S-curve with multiple control points for stretched S effect
        const curve1X = startX + 18; // Curve right (adjusted for larger balloon)
        const curve1Y = startY + stringLength * 0.25;
        const curve2X = startX - 18; // Curve left
        const curve2Y = startY + stringLength * 0.5;
        const curve3X = startX + 12; // Curve right again
        const curve3Y = startY + stringLength * 0.75;
        
        // Create stretched S path with cubic bezier curves
        const pathData = `M ${startX} ${startY} 
                         C ${startX + 6} ${startY + 12}, ${curve1X} ${curve1Y - 12}, ${curve1X} ${curve1Y}
                         C ${curve1X} ${curve1Y + 12}, ${curve2X} ${curve2Y - 12}, ${curve2X} ${curve2Y}
                         C ${curve2X} ${curve2Y + 12}, ${curve3X} ${curve3Y - 12}, ${curve3X} ${curve3Y}
                         C ${curve3X} ${curve3Y + 12}, ${endX - 6} ${endY - 12}, ${endX} ${endY}`;
        
        string.setAttribute('d', pathData);
        string.setAttribute('stroke', '#8B4513'); // Brown string
        string.setAttribute('stroke-width', 3.5); // Slightly thicker for larger balloons
        string.setAttribute('fill', 'none');
        string.setAttribute('class', 'balloon-string-curly'); // Different class
        
        // Store control points for animation
        balloon.stringStartX = startX;
        balloon.stringStartY = startY;
        balloon.stringEndX = endX;
        balloon.stringEndY = endY;
        balloon.stringCurve1X = curve1X;
        balloon.stringCurve1Y = curve1Y;
        balloon.stringCurve2X = curve2X;
        balloon.stringCurve2Y = curve2Y;
        balloon.stringCurve3X = curve3X;
        balloon.stringCurve3Y = curve3Y;
        
        return string;
    }

    popBalloon(balloon) {
        if (balloon.popped || !this.playingBalloonGame) return;
        
        balloon.popped = true;
        
        console.log(`Balloon popped with number: ${balloon.number}, correct: ${balloon.isCorrect}`);
        
        // Create yellow star pop effect at balloon center
        this.createPopEffect(balloon.x + balloon.radius, balloon.y + balloon.radius);
        
        if (balloon.isCorrect) {
            // Correct balloon popped!
            this.correctBalloonsFound++;
            
            // Play success sound
            if (this.audioEnabled) {
                this.playCompletionSound();
            }
            
            // Create falling number at balloon position
            this.createFallingNumber(balloon.x + balloon.radius, balloon.y + balloon.radius, balloon.number);
            
            // Speak encouragement
            if (this.audioEnabled) {
                const encouragements = ['Great job!', 'Well done!', 'Excellent!', 'Perfect!'];
                const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                setTimeout(() => {
                    this.speakText(randomEncouragement, this.currentVoiceGender);
                }, 200);
            }
        } else {
            // Incorrect balloon popped - play failure sound
            if (this.audioEnabled) {
                this.playFailureSound();
            }
        }
        
        // Remove balloon with pop animation
        if (balloon.group) {
            balloon.group.remove();
        }
        
        // Check if game is complete
        this.checkBalloonGameCompletion();
    }

    createPopEffect(x, y) {
        // Create yellow star at balloon center
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        star.setAttribute('x', x);
        star.setAttribute('y', y);
        star.setAttribute('text-anchor', 'middle');
        star.setAttribute('dominant-baseline', 'middle');
        star.setAttribute('font-size', '40');
        star.setAttribute('fill', '#FFD700'); // Yellow color
        star.setAttribute('class', 'pop-star');
        star.textContent = '⭐';
        
        // Add pop animation
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animate.setAttribute('attributeName', 'transform');
        animate.setAttribute('type', 'scale');
        animate.setAttribute('values', '0;1.5;1');
        animate.setAttribute('dur', '0.6s');
        animate.setAttribute('fill', 'freeze');
        
        const fadeOut = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        fadeOut.setAttribute('attributeName', 'opacity');
        fadeOut.setAttribute('values', '1;1;0');
        fadeOut.setAttribute('dur', '0.6s');
        fadeOut.setAttribute('fill', 'freeze');
        
        star.appendChild(animate);
        star.appendChild(fadeOut);
        
        this.renderer.svg.appendChild(star);
        
        // Remove effect after animation
        setTimeout(() => {
            if (star.parentNode) {
                star.parentNode.removeChild(star);
            }
        }, 600);
    }

    createFallingNumber(x, y, number) {
        const grassBandHeight = 80;
        const gameAreaHeight = CONFIG.SVG_HEIGHT;
        const grassBandTop = gameAreaHeight - grassBandHeight;
        
        // Calculate random landing position within 40% to 80% of grass band height from bottom
        const minHeightFromTop = grassBandHeight * 0.2; // 20% from top (80% from bottom)
        const maxHeightFromTop = grassBandHeight * 0.6; // 60% from top (40% from bottom)
        const randomHeightFromTop = minHeightFromTop + Math.random() * (maxHeightFromTop - minHeightFromTop);
        const targetY = grassBandTop + randomHeightFromTop;
        
        // Calculate falling speed: DOUBLED from previous version
        const fallingSpeed = 180; // Doubled falling speed
        
        const fallingNumber = {
            x: x, // FIXED X position - this never changes
            startX: x, // Store the original X position
            y: y,
            targetY: targetY, // Random position within grass band
            number: number,
            speed: fallingSpeed,
            element: null,
            landed: false
        };
        
        console.log(`Falling number ${number} will land at Y: ${targetY} (grass band: ${grassBandTop}-${gameAreaHeight}, random height from top: ${randomHeightFromTop}px)`);
        
        // Create large number element (digit version for falling)
        const numberElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberElement.setAttribute('x', fallingNumber.startX);
        numberElement.setAttribute('y', fallingNumber.y);
        numberElement.setAttribute('text-anchor', 'middle');
        numberElement.setAttribute('dominant-baseline', 'middle');
        numberElement.setAttribute('font-size', '60');
        numberElement.setAttribute('font-weight', 'bold');
        numberElement.setAttribute('fill', CONFIG.FILL_COLOR);
        numberElement.setAttribute('stroke', 'white');
        numberElement.setAttribute('stroke-width', 2);
        numberElement.setAttribute('class', 'falling-number-static');
        numberElement.textContent = number;
        
        fallingNumber.element = numberElement;
        this.fallingNumbers.push(fallingNumber);
        this.renderer.svg.appendChild(numberElement);
        
        console.log(`Created falling number ${number} at FIXED position (${fallingNumber.startX}, ${y}) with DOUBLED speed ${fallingSpeed}, will land in grass at Y: ${targetY}`);
        
        return fallingNumber;
    }

    animateBalloons(currentTime = performance.now()) {
        if (!this.playingBalloonGame) return;
        
        const deltaTime = (currentTime - this.balloonLastTime) / 1000;
        this.balloonLastTime = currentTime;
        
        // Update balloons (rise upward with sideways drift)
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                // Move balloon up at its individual speed
                balloon.y -= balloon.riseSpeed * deltaTime;
                
                // Check if balloon touched the ceiling (top of game area)
                if (balloon.y <= 0) {
                    console.log(`Balloon with number ${balloon.number} touched ceiling - auto-popping`);
                    this.popBalloon(balloon);
                    return; // Skip further processing for this balloon
                }
                
                // Move balloon sideways with drift
                balloon.x += Math.abs(balloon.sidewaysSpeed) * balloon.sidewaysDirection * deltaTime;
                
                // Check boundaries and bounce off edges
                const gameAreaWidth = CONFIG.SVG_WIDTH;
                const balloonWidth = balloon.radius * 2;
                
                if (balloon.x <= 0) {
                    // Hit left edge - bounce right
                    balloon.x = 0;
                    balloon.sidewaysDirection = 1;
                } else if (balloon.x + balloonWidth >= gameAreaWidth) {
                    // Hit right edge - bounce left
                    balloon.x = gameAreaWidth - balloonWidth;
                    balloon.sidewaysDirection = -1;
                }
                
                // Update balloon position
                if (balloon.circle) {
                    balloon.circle.setAttribute('cx', balloon.x + balloon.radius);
                    balloon.circle.setAttribute('cy', balloon.y + balloon.radius);
                }
                if (balloon.highlight) {
                    balloon.highlight.setAttribute('cx', balloon.x + balloon.radius - 17);
                    balloon.highlight.setAttribute('cy', balloon.y + balloon.radius - 17);
                }
                if (balloon.textWord) {
                    balloon.textWord.setAttribute('x', balloon.x + balloon.radius);
                    balloon.textWord.setAttribute('y', balloon.y + balloon.radius + 2);
                }
                
                // Update string - CURLY S-shape attachment
                if (balloon.string) {
                    // Calculate current balloon bottom position
                    const currentStartX = balloon.x + balloon.radius;
                    const currentStartY = balloon.y + balloon.radius * 2;
                    
                    // Calculate movement delta
                    const deltaX = currentStartX - balloon.stringStartX;
                    const deltaY = currentStartY - balloon.stringStartY;
                    
                    // Update all curve points by the same delta to maintain S-shape
                    const newStartX = currentStartX;
                    const newStartY = currentStartY;
                    const newEndX = balloon.stringEndX + deltaX;
                    const newEndY = balloon.stringEndY + deltaY;
                    const newCurve1X = balloon.stringCurve1X + deltaX;
                    const newCurve1Y = balloon.stringCurve1Y + deltaY;
                    const newCurve2X = balloon.stringCurve2X + deltaX;
                    const newCurve2Y = balloon.stringCurve2Y + deltaY;
                    const newCurve3X = balloon.stringCurve3X + deltaX;
                    const newCurve3Y = balloon.stringCurve3Y + deltaY;
                    
                    // Recreate S-curve path with updated positions
                    const pathData = `M ${newStartX} ${newStartY} 
                                     C ${newStartX + 6} ${newStartY + 12}, ${newCurve1X} ${newCurve1Y - 12}, ${newCurve1X} ${newCurve1Y}
                                     C ${newCurve1X} ${newCurve1Y + 12}, ${newCurve2X} ${newCurve2Y - 12}, ${newCurve2X} ${newCurve2Y}
                                     C ${newCurve2X} ${newCurve2Y + 12}, ${newCurve3X} ${newCurve3Y - 12}, ${newCurve3X} ${newCurve3Y}
                                     C ${newCurve3X} ${newCurve3Y + 12}, ${newEndX - 6} ${newEndY - 12}, ${newEndX} ${newEndY}`;
                    
                    balloon.string.setAttribute('d', pathData);
                }
            }
        });
        
        // Update falling numbers - ABSOLUTELY STRAIGHT vertical fall
        this.fallingNumbers.forEach(fallingNumber => {
            if (!fallingNumber.landed) {
                // ONLY update Y position - X position is NEVER modified
                fallingNumber.y += fallingNumber.speed * deltaTime;
                
                // Check if reached ground
                if (fallingNumber.y >= fallingNumber.targetY) {
                    fallingNumber.y = fallingNumber.targetY;
                    fallingNumber.landed = true;
                    console.log(`Falling number ${fallingNumber.number} landed`);
                    
                    // Check if all numbers have landed
                    const allLanded = this.fallingNumbers.every(fn => fn.landed);
                    if (allLanded && !this.numbersLanded) {
                        this.numbersLanded = true;
                        console.log('All falling numbers have landed');
                        this.checkBalloonGameCompletion();
                    }
                }
                
                // Update ONLY Y position - X position remains at startX forever
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
        const hasFoundEnoughCorrect = this.correctBalloonsFound >= this.totalCorrectBalloons;
        const allBalloonsGone = activeBalloonsCount === 0;
        
        // Game can complete if we found enough correct balloons OR all balloons are gone
        // BUT we must wait for both speech completion AND numbers to land
        if ((hasFoundEnoughCorrect || allBalloonsGone) && this.speechComplete && this.numbersLanded) {
            console.log(`Balloon game completing: found ${this.correctBalloonsFound}/${this.totalCorrectBalloons} correct balloons, speech complete: ${this.speechComplete}, numbers landed: ${this.numbersLanded}`);
            
            // Complete immediately since all conditions are met
            this.onBalloonGameComplete();
        } else {
            console.log(`Waiting for completion conditions - correct: ${hasFoundEnoughCorrect}, all gone: ${allBalloonsGone}, speech: ${this.speechComplete}, landed: ${this.numbersLanded}`);
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
            '.balloon-group, .falling-number-static, .pop-star'
        );
        elementsToRemove.forEach(element => element.remove());
        
        // Reset balloon game state
        this.balloons = [];
        this.fallingNumbers = [];
        this.correctBalloonsFound = 0;
        this.speechComplete = false;
        this.numbersLanded = false;
    }

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

    speakText(text, preferredGender = null) {
        if (!this.audioEnabled) return;
        
        try {
            // Use Web Speech API for text-to-speech
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1.3;
                utterance.volume = 0.8;
                
                // Get available voices
                const voices = speechSynthesis.getVoices();
                let selectedVoice = null;
                
                // Try to find child-like voices based on preferred gender
                if (preferredGender === 'boy') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('boy') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('young') ||
                        voice.name.toLowerCase().includes('junior') ||
                        voice.name.toLowerCase().includes('daniel') ||
                        voice.name.toLowerCase().includes('alex') ||
                        voice.name.toLowerCase().includes('david')
                    );
                    
                    if (!selectedVoice) {
                        selectedVoice = voices.find(voice => 
                            voice.name.toLowerCase().includes('male') ||
                            (voice.gender && voice.gender.toLowerCase() === 'male')
                        );
                    }
                } else if (preferredGender === 'girl') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('girl') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('young') ||
                        voice.name.toLowerCase().includes('junior') ||
                        voice.name.toLowerCase().includes('samantha') ||
                        voice.name.toLowerCase().includes('victoria') ||
                        voice.name.toLowerCase().includes('karen') ||
                        voice.name.toLowerCase().includes('emma')
                    );
                    
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
                    utterance.pitch = 1.3;
                    utterance.rate = 0.9;
                } else if (preferredGender === 'girl') {
                    utterance.pitch = 1.4;
                    utterance.rate = 0.9;
                }
                
                speechSynthesis.speak(utterance);
                console.log(`Speaking (${preferredGender || 'default'}):`, text);
            }
        } catch (error) {
            console.warn('Speech synthesis failed:', error);
        }
    }

    speakTextWithCallback(text, preferredGender = null, callback = null) {
        if (!this.audioEnabled) {
            if (callback) callback();
            return;
        }
        
        try {
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1.3;
                utterance.volume = 0.8;
                
                // Add end callback
                if (callback) {
                    utterance.onend = callback;
                    utterance.onerror = callback;
                }
                
                // Get available voices (same logic as speakText)
                const voices = speechSynthesis.getVoices();
                let selectedVoice = null;
                
                if (preferredGender === 'boy') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('boy') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('young') ||
                        voice.name.toLowerCase().includes('daniel') ||
                        voice.name.toLowerCase().includes('alex') ||
                        voice.name.toLowerCase().includes('david')
                    );
                    
                    if (!selectedVoice) {
                        selectedVoice = voices.find(voice => 
                            voice.name.toLowerCase().includes('male') ||
                            (voice.gender && voice.gender.toLowerCase() === 'male')
                        );
                    }
                } else if (preferredGender === 'girl') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('girl') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('young') ||
                        voice.name.toLowerCase().includes('samantha') ||
                        voice.name.toLowerCase().includes('victoria') ||
                        voice.name.toLowerCase().includes('karen') ||
                        voice.name.toLowerCase().includes('emma')
                    );
                    
                    if (!selectedVoice) {
                        selectedVoice = voices.find(voice => 
                            voice.name.toLowerCase().includes('female') ||
                            (voice.gender && voice.gender.toLowerCase() === 'female')
                        );
                    }
                }
                
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
                }
                
                if (preferredGender === 'boy') {
                    utterance.pitch = 1.3;
                    utterance.rate = 0.9;
                } else if (preferredGender === 'girl') {
                    utterance.pitch = 1.4;
                    utterance.rate = 0.9;
                }
                
                speechSynthesis.speak(utterance);
                console.log(`Speaking with callback (${preferredGender || 'default'}):`, text);
            }
        } catch (error) {
            console.warn('Speech synthesis failed:', error);
            if (callback) callback();
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
            console.warn('Completion sound failed:', error);
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
            console.warn('Failure sound failed:', error);
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            if ('speechSynthesis' in window) {
                speechSynthesis.pause();
            }
            
            if (this.playingBalloonGame) {
                console.log('Page hidden, pausing balloon game');
            }
        } else {
            if ('speechSynthesis' in window) {
                speechSynthesis.resume();
            }
            
            if (this.playingBalloonGame) {
                console.log('Page visible, resuming balloon game');
            }
        }
    }

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
        
        this.renderer.completeNumber();
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        console.log('Audio', this.audioEnabled ? 'enabled' : 'disabled');
    }

    destroy() {
        console.log('Destroying game controller');
        
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.pathManager) {
            this.pathManager.cleanup();
        }
        
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
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        console.log('Game controller destroyed');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('visibilitychange', () => {
        if (window.traceGame) {
            window.traceGame.handleVisibilityChange();
        }
    });
    
    window.traceGame = new TraceGameController();
    
    console.log('Trace game loaded and ready!');
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.traceGame) {
        window.traceGame.destroy();
    }
});class TraceGameController {
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
        this.speechComplete = false;
        this.numbersLanded = false;
        
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
        console.log(`Created falling number ${number} at FIXED position (${fallingNumber.startX}, ${y}) with DOUBLED speed ${fallingSpeed}, will land in grass at Y: ${targetY}`);
        
        return fallingNumber;
    }

    animateBalloons(currentTime = performance.now()) {
        if (!this.playingBalloonGame) return;
        
        const deltaTime = (currentTime - this.balloonLastTime) / 1000;
        this.balloonLastTime = currentTime;
        
        // Update balloons (rise upward with sideways drift)
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                // Move balloon up at its individual speed
                balloon.y -= balloon.riseSpeed * deltaTime;
                
                // Check if balloon touched the ceiling (top of game area)
                if (balloon.y <= 0) {
                    console.log(`Balloon with number ${balloon.number} touched ceiling - auto-popping`);
                    this.popBalloon(balloon);
                    return; // Skip further processing for this balloon
                }
                
                // Move balloon sideways with drift
                balloon.x += Math.abs(balloon.sidewaysSpeed) * balloon.sidewaysDirection * deltaTime;
                
                // Check boundaries and bounce off edges
                const gameAreaWidth = CONFIG.SVG_WIDTH;
                const balloonWidth = balloon.radius * 2;
                
                if (balloon.x <= 0) {
                    // Hit left edge - bounce right
                    balloon.x = 0;
                    balloon.sidewaysDirection = 1;
                } else if (balloon.x + balloonWidth >= gameAreaWidth) {
                    // Hit right edge - bounce left
                    balloon.x = gameAreaWidth - balloonWidth;
                    balloon.sidewaysDirection = -1;
                }
                
                // Update balloon position
                if (balloon.circle) {
                    balloon.circle.setAttribute('cx', balloon.x + balloon.radius);
                    balloon.circle.setAttribute('cy', balloon.y + balloon.radius);
                }
                if (balloon.highlight) {
                    balloon.highlight.setAttribute('cx', balloon.x + balloon.radius - 17); // Adjusted for larger balloon
                    balloon.highlight.setAttribute('cy', balloon.y + balloon.radius - 17);
                }
                if (balloon.textWord) {
                    balloon.textWord.setAttribute('x', balloon.x + balloon.radius);
                    balloon.textWord.setAttribute('y', balloon.y + balloon.radius + 2);
                }
                
                // Update string - CURLY S-shape attachment
                if (balloon.string) {
                    // Calculate current balloon bottom position
                    const currentStartX = balloon.x + balloon.radius;
                    const currentStartY = balloon.y + balloon.radius * 2;
                    
                    // Calculate movement delta
                    const deltaX = currentStartX - balloon.stringStartX;
                    const deltaY = currentStartY - balloon.stringStartY;
                    
                    // Update all curve points by the same delta to maintain S-shape
                    const newStartX = currentStartX;
                    const newStartY = currentStartY;
                    const newEndX = balloon.stringEndX + deltaX;
                    const newEndY = balloon.stringEndY + deltaY;
                    const newCurve1X = balloon.stringCurve1X + deltaX;
                    const newCurve1Y = balloon.stringCurve1Y + deltaY;
                    const newCurve2X = balloon.stringCurve2X + deltaX;
                    const newCurve2Y = balloon.stringCurve2Y + deltaY;
                    const newCurve3X = balloon.stringCurve3X + deltaX;
                    const newCurve3Y = balloon.stringCurve3Y + deltaY;
                    
                    // Recreate S-curve path with updated positions
                    const pathData = `M ${newStartX} ${newStartY} 
                                     C ${newStartX + 6} ${newStartY + 12}, ${newCurve1X} ${newCurve1Y - 12}, ${newCurve1X} ${newCurve1Y}
                                     C ${newCurve1X} ${newCurve1Y + 12}, ${newCurve2X} ${newCurve2Y - 12}, ${newCurve2X} ${newCurve2Y}
                                     C ${newCurve2X} ${newCurve2Y + 12}, ${newCurve3X} ${newCurve3Y - 12}, ${newCurve3X} ${newCurve3Y}
                                     C ${newCurve3X} ${newCurve3Y + 12}, ${newEndX - 6} ${newEndY - 12}, ${newEndX} ${newEndY}`;
                    
                    balloon.string.setAttribute('d', pathData);
                }
            }
        });
        
        // Update falling numbers - ABSOLUTELY STRAIGHT vertical fall
        this.fallingNumbers.forEach(fallingNumber => {
            if (!fallingNumber.landed) {
                // ONLY update Y position - X position is NEVER modified
                fallingNumber.y += fallingNumber.speed * deltaTime;
                
                // Check if reached ground
                if (fallingNumber.y >= fallingNumber.targetY) {
                    fallingNumber.y = fallingNumber.targetY;
                    fallingNumber.landed = true;
                    console.log(`Falling number ${fallingNumber.number} landed`);
                    
                    // Check if all numbers have landed
                    const allLanded = this.fallingNumbers.every(fn => fn.landed);
                    if (allLanded && !this.numbersLanded) {
                        this.numbersLanded = true;
                        console.log('All falling numbers have landed');
                        this.checkBalloonGameCompletion();
                    }
                }
                
                // Update ONLY Y position - X position remains at startX forever
                if (fallingNumber.element) {
                    fallingNumber.element.setAttribute('y', fallingNumber.y);
                    // NEVER update X position - it stays at the original startX value
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
        const hasFoundEnoughCorrect = this.correctBalloonsFound >= this.totalCorrectBalloons;
        const allBalloonsGone = activeBalloonsCount === 0;
        
        // Game can complete if we found enough correct balloons OR all balloons are gone
        // BUT we must wait for both speech completion AND numbers to land
        if ((hasFoundEnoughCorrect || allBalloonsGone) && this.speechComplete && this.numbersLanded) {
            console.log(`Balloon game completing: found ${this.correctBalloonsFound}/${this.totalCorrectBalloons} correct balloons, speech complete: ${this.speechComplete}, numbers landed: ${this.numbersLanded}`);
            
            // Complete immediately since all conditions are met
            this.onBalloonGameComplete();
        } else {
            console.log(`Waiting for completion conditions - correct: ${hasFoundEnoughCorrect}, all gone: ${allBalloonsGone}, speech: ${this.speechComplete}, landed: ${this.numbersLanded}`);
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
        // Clear all balloon game elements from SVG (but not the CSS grass band)
        const elementsToRemove = this.renderer.svg.querySelectorAll(
            '.balloon-group, .falling-number-static, .pop-star'
        );
        elementsToRemove.forEach(element => element.remove());
        
        // Reset balloon game state
        this.balloons = [];
        this.fallingNumbers = [];
        this.correctBalloonsFound = 0;
        this.speechComplete = false;
        this.numbersLanded = false;
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

    // Enhanced audio methods with voice gender support and callback functionality
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
                    utterance.pitch = 1.3; // Slightly higher than adult male but not silly
                    utterance.rate = 0.9;
                } else if (preferredGender === 'girl') {
                    utterance.pitch = 1.4; // Keep original girl voice pitch
                    utterance.rate = 0.9;
                }
                
                speechSynthesis.speak(utterance);
                console.log(`Speaking (${preferredGender || 'default'}):`, text);
            }
        } catch (error) {
            console.warn('Speech synthesis failed:', error);
        }
    }

    speakTextWithCallback(text, preferredGender = null, callback = null) {
        if (!this.audioEnabled) {
            if (callback) callback();
            return;
        }
        
        try {
            // Use Web Speech API for text-to-speech
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9; // Slightly slower for children
                utterance.pitch = 1.3; // Higher pitch for child-like voices
                utterance.volume = 0.8;
                
                // Add end callback
                if (callback) {
                    utterance.onend = callback;
                    utterance.onerror = callback; // Also call on error
                }
                
                // Get available voices (same logic as speakText)
                const voices = speechSynthesis.getVoices();
                let selectedVoice = null;
                
                if (preferredGender === 'boy') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('boy') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('young') ||
                        voice.name.toLowerCase().includes('junior') ||
                        voice.name.toLowerCase().includes('daniel') ||
                        voice.name.toLowerCase().includes('alex') ||
                        voice.name.toLowerCase().includes('david')
                    );
                    
                    if (!selectedVoice) {
                        selectedVoice = voices.find(voice => 
                            voice.name.toLowerCase().includes('male') ||
                            (voice.gender && voice.gender.toLowerCase() === 'male')
                        );
                    }
                } else if (preferredGender === 'girl') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('girl') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('young') ||
                        voice.name.toLowerCase().includes('samantha') ||
                        voice.name.toLowerCase().includes('victoria') ||
                        voice.name.toLowerCase().includes('karen') ||
                        voice.name.toLowerCase().includes('emma')
                    );
                    
                    if (!selectedVoice) {
                        selectedVoice = voices.find(voice => 
                            voice.name.toLowerCase().includes('female') ||
                            (voice.gender && voice.gender.toLowerCase() === 'female')
                        );
                    }
                }
                
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
                }
                
                // Adjust pitch and rate for more child-like sound
                if (preferredGender === 'boy') {
                    utterance.pitch = 1.3;
                    utterance.rate = 0.9;
                } else if (preferredGender === 'girl') {
                    utterance.pitch = 1.4;
                    utterance.rate = 0.9;
                }
                
                speechSynthesis.speak(utterance);
                console.log(`Speaking with callback (${preferredGender || 'default'}):`, text);
            }
        } catch (error) {
            console.warn('Speech synthesis failed:', error);
            if (callback) callback();
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

    playFailureSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            // Create a failure tone (lower pitched, dissonant)
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Lower frequency descending tone for failure
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime); // Lower starting frequency
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3); // Descend to lower note
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('Failure sound failed:', error);
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
});.log('Initializing main game controller...');
        
        // Find DOM elements
        this.findDOMElements();
        
        // Add window resize listener
        window.addEventListener('resize', this.handleResize);
        
        // Initialize audio system
        await this.initializeAudio();
        
        // Initialize rainbow with proper size for full screen
        this.initializeRainbowSize();
        
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

    // Grass band is now permanent in HTML - no need for JavaScript creation

    initializeRainbowSize() {
        // Override the rainbow size calculation to fit 75% of game width
        const gameWidth = CONFIG.SVG_WIDTH;
        const appropriateRainbowWidth = gameWidth * 0.75; // 75% of game width
        
        // Temporarily override the rainbow's width calculation
        const originalInitialize = this.rainbow.initializeArcs.bind(this.rainbow);
        this.rainbow.initializeArcs = function() {
            // Clear existing arcs
            this.container.innerHTML = '';
            
            // Use the controller's specified width instead of calculating from game area
            const rainbowWidth = appropriateRainbowWidth;
            
            // Create all 10 rainbow arcs (initially hidden)
            for (let i = 0; i < this.maxPieces; i++) {
                const arc = document.createElement('div');
                arc.className = 'rainbow-arc';
                arc.id = `arc-${i}`;
                
                // Calculate radius for this arc (outermost first)
                const baseRadius = rainbowWidth / 2;
                const radius = baseRadius - (i * this.arcWidth);
                
                // Set arc properties for semi-circle
                arc.style.width = radius * 2 + 'px';
                arc.style.height = radius + 'px';
                arc.style.borderTopWidth = this.arcWidth + 'px';
                arc.style.borderTopColor = this.colors[i];
                arc.style.borderRadius = radius + 'px ' + radius + 'px 0 0';
                arc.style.position = 'absolute';
                arc.style.bottom = '0';
                arc.style.left = '50%';
                arc.style.transform = 'translateX(-50%)';
                arc.style.opacity = '0'; // Start completely hidden
                arc.style.transition = 'opacity 0.5s ease-in-out';
                arc.style.pointerEvents = 'none';
                
                this.container.appendChild(arc);
            }
        };
        
        // Reinitialize the rainbow with the new size
        this.rainbow.initializeArcs();
        
        console.log(`Rainbow initialized with width: ${appropriateRainbowWidth}px (75% of game width)`);
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
        
        // Update rainbow size on resize
        this.initializeRainbowSize();
        
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
        this.speechComplete = false;
        this.numbersLanded = false;
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
    // ENHANCED BALLOON GAME LOGIC
    // =============================================================================

    startBalloonMiniGame() {
        console.log('Starting balloon mini-game for number:', this.currentNumber);
        
        this.playingBalloonGame = true;
        this.correctBalloonsFound = 0;
        this.balloons = [];
        this.fallingNumbers = [];
        this.speechComplete = false;
        this.numbersLanded = false;
        
        // Clear number word display during balloon game
        this.updateNumberWordDisplay('');
        
        // Create 12 balloons with random positions and speeds
        this.createBalloons();
        
        // Start animation loop
        this.balloonLastTime = performance.now();
        this.animateBalloons();
        
        // Speak instruction and track completion
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakTextWithCallback(
                    `Pop the balloons with the number ${this.currentNumber}!`, 
                    this.currentVoiceGender,
                    () => {
                        this.speechComplete = true;
                        console.log('Speech completed');
                        this.checkBalloonGameCompletion();
                    }
                );
            }, 500);
        } else {
            // If audio disabled, mark speech as complete immediately
            this.speechComplete = true;
        }
    }

    createBalloons() {
        const balloonCount = 12;
        const balloonWidth = 120; // Increased from 100 to 120 (20% larger)
        
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
        
        // Create balloons with random starting heights
        for (let i = 0; i < balloonCount; i++) {
            const balloon = this.createBalloon(positions[i], numbers[i]);
            this.balloons.push(balloon);
        }
        
        console.log(`Created ${balloonCount} balloons with ${this.totalCorrectBalloons} correct numbers`);
    }

    generateNonOverlappingPositions(count, width) {
        const positions = [];
        const margin = 20;
        const totalWidth = width + margin;
        
        // Keep balloons within 90% of game area width
        const gameAreaWidth = CONFIG.SVG_WIDTH;
        const constrainedWidth = gameAreaWidth * 0.9; // 90% of game area
        const availableWidth = constrainedWidth - width;
        const startOffset = (gameAreaWidth - constrainedWidth) / 2; // Center the 90% area
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let position;
            
            do {
                position = startOffset + (Math.random() * availableWidth);
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
        const riseSpeed = 20 + Math.random() * 20; // Slower: 20-40 pixels per second
        const groundLevel = CONFIG.SVG_HEIGHT - 80;
        
        // Random starting height in lower half of game area
        const gameAreaHeight = CONFIG.SVG_HEIGHT - 80; // Total game area minus grass
        const lowerHalfStart = gameAreaHeight * 0.5; // Start of lower half
        const randomStartHeight = lowerHalfStart + Math.random() * (gameAreaHeight * 0.3); // Random within lower portion
        
        // Random sideways movement
        const sidewaysSpeed = (Math.random() - 0.5) * 30; // Random speed between -15 and +15 pixels/second
        
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
            y: randomStartHeight, // Random starting height in lower half
            number: number,
            isCorrect: isCorrectNumber,
            riseSpeed: riseSpeed,
            sidewaysSpeed: sidewaysSpeed, // Add sideways movement
            sidewaysDirection: Math.sign(sidewaysSpeed) || 1, // Track direction (1 or -1)
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
        
        // Create LARGER balloon circle (increased from 45 to 54)
        const balloonRadius = 54; // Increased by 20% from 45
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
        highlight.setAttribute('cx', balloon.x + balloonRadius - 17); // Adjusted for larger balloon
        highlight.setAttribute('cy', balloon.y + balloonRadius - 17);
        highlight.setAttribute('r', 14); // Larger highlight for bigger balloon
        highlight.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
        highlight.setAttribute('class', 'balloon-highlight');
        
        balloonGroup.appendChild(balloonCircle);
        balloonGroup.appendChild(highlight);
        
        // Create LARGER number text (increased from 22 to 26)
        const numberWord = numberWords[number];
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', balloon.x + balloonRadius);
        numberText.setAttribute('y', balloon.y + balloonRadius + 2); // Centered in balloon
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '26'); // Increased from 22 to 26 (about 18% larger)
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.setAttribute('stroke', '#333');
        numberText.setAttribute('stroke-width', '1.4'); // Slightly thicker stroke
        numberText.setAttribute('class', 'balloon-number-word');
        numberText.textContent = numberWord;
        
        balloonGroup.appendChild(numberText);
        
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
        balloon.radius = balloonRadius;
        
        this.renderer.svg.appendChild(balloonGroup);
        
        return balloon;
    }

    createBalloonString(balloon) {
        const balloonRadius = 54; // Updated for larger balloons
        const stringLength = 120; // Longer string for larger balloons
        
        // Create CURLY string like a stretched S
        const string = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // String starts at bottom of balloon
        const startX = balloon.x + balloonRadius;
        const startY = balloon.y + balloonRadius * 2; // Bottom of balloon
        
        // String ends below balloon
        const endX = startX; // Same X position - ends straight down
        const endY = startY + stringLength;
        
        // Create S-curve with multiple control points for stretched S effect
        const curve1X = startX + 18; // Curve right (adjusted for larger balloon)
        const curve1Y = startY + stringLength * 0.25;
        const curve2X = startX - 18; // Curve left
        const curve2Y = startY + stringLength * 0.5;
        const curve3X = startX + 12; // Curve right again
        const curve3Y = startY + stringLength * 0.75;
        
        // Create stretched S path with cubic bezier curves
        const pathData = `M ${startX} ${startY} 
                         C ${startX + 6} ${startY + 12}, ${curve1X} ${curve1Y - 12}, ${curve1X} ${curve1Y}
                         C ${curve1X} ${curve1Y + 12}, ${curve2X} ${curve2Y - 12}, ${curve2X} ${curve2Y}
                         C ${curve2X} ${curve2Y + 12}, ${curve3X} ${curve3Y - 12}, ${curve3X} ${curve3Y}
                         C ${curve3X} ${curve3Y + 12}, ${endX - 6} ${endY - 12}, ${endX} ${endY}`;
        
        string.setAttribute('d', pathData);
        string.setAttribute('stroke', '#8B4513'); // Brown string
        string.setAttribute('stroke-width', 3.5); // Slightly thicker for larger balloons
        string.setAttribute('fill', 'none');
        string.setAttribute('class', 'balloon-string-curly'); // Different class
        
        // Store control points for animation
        balloon.stringStartX = startX;
        balloon.stringStartY = startY;
        balloon.stringEndX = endX;
        balloon.stringEndY = endY;
        balloon.stringCurve1X = curve1X;
        balloon.stringCurve1Y = curve1Y;
        balloon.stringCurve2X = curve2X;
        balloon.stringCurve2Y = curve2Y;
        balloon.stringCurve3X = curve3X;
        balloon.stringCurve3Y = curve3Y;
        
        return string;
    }

    popBalloon(balloon) {
        if (balloon.popped || !this.playingBalloonGame) return;
        
        balloon.popped = true;
        
        console.log(`Balloon popped with number: ${balloon.number}, correct: ${balloon.isCorrect}`);
        
        // Create yellow star pop effect at balloon center
        this.createPopEffect(balloon.x + balloon.radius, balloon.y + balloon.radius);
        
        if (balloon.isCorrect) {
            // Correct balloon popped!
            this.correctBalloonsFound++;
            
            // Play success sound
            if (this.audioEnabled) {
                this.playCompletionSound();
            }
            
            // Create falling number at balloon position
            this.createFallingNumber(balloon.x + balloon.radius, balloon.y + balloon.radius, balloon.number);
            
            // Speak encouragement
            if (this.audioEnabled) {
                const encouragements = ['Great job!', 'Well done!', 'Excellent!', 'Perfect!'];
                const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                setTimeout(() => {
                    this.speakText(randomEncouragement, this.currentVoiceGender);
                }, 200);
            }
        } else {
            // Incorrect balloon popped - play failure sound
            if (this.audioEnabled) {
                this.playFailureSound();
            }
        }
        
        // Remove balloon with pop animation
        if (balloon.group) {
            balloon.group.remove();
        }
        
        // Check if game is complete
        this.checkBalloonGameCompletion();
    }

    createPopEffect(x, y) {
        // Create yellow star at balloon center
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        star.setAttribute('x', x);
        star.setAttribute('y', y);
        star.setAttribute('text-anchor', 'middle');
        star.setAttribute('dominant-baseline', 'middle');
        star.setAttribute('font-size', '40');
        star.setAttribute('fill', '#FFD700'); // Yellow color
        star.setAttribute('class', 'pop-star');
        star.textContent = '⭐';
        
        // Add pop animation
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animate.setAttribute('attributeName', 'transform');
        animate.setAttribute('type', 'scale');
        animate.setAttribute('values', '0;1.5;1');
        animate.setAttribute('dur', '0.6s');
        animate.setAttribute('fill', 'freeze');
        
        const fadeOut = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        fadeOut.setAttribute('attributeName', 'opacity');
        fadeOut.setAttribute('values', '1;1;0');
        fadeOut.setAttribute('dur', '0.6s');
        fadeOut.setAttribute('fill', 'freeze');
        
        star.appendChild(animate);
        star.appendChild(fadeOut);
        
        this.renderer.svg.appendChild(star);
        
        // Remove effect after animation
        setTimeout(() => {
            if (star.parentNode) {
                star.parentNode.removeChild(star);
            }
        }, 600);
    }

    createFallingNumber(x, y, number) {
        const grassBandHeight = 80;
        const gameAreaHeight = CONFIG.SVG_HEIGHT;
        const grassBandTop = gameAreaHeight - grassBandHeight;
        
        // Calculate random landing position within 40% to 80% of grass band height from bottom
        // 40% from bottom = 80% from top of grass band
        // 80% from bottom = 20% from top of grass band
        const minHeightFromTop = grassBandHeight * 0.2; // 20% from top (80% from bottom)
        const maxHeightFromTop = grassBandHeight * 0.6; // 60% from top (40% from bottom)
        const randomHeightFromTop = minHeightFromTop + Math.random() * (maxHeightFromTop - minHeightFromTop);
        const targetY = grassBandTop + randomHeightFromTop;
        
        // Calculate falling speed: DOUBLED from previous version
        // Previous speed was 90, now it's 180 pixels per second
        const fallingSpeed = 180; // Doubled falling speed
        
        const fallingNumber = {
            x: x, // FIXED X position - this never changes
            startX: x, // Store the original X position
            y: y,
            targetY: targetY, // Random position within grass band
            number: number,
            speed: fallingSpeed,
            element: null,
            landed: false
        };
        
        console.log(`Falling number ${number} will land at Y: ${targetY} (grass band: ${grassBandTop}-${gameAreaHeight}, random height from top: ${randomHeightFromTop}px)`);
        // Create large number element (digit version for falling)
        const numberElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberElement.setAttribute('x', fallingNumber.startX);
        numberElement.setAttribute('y', fallingNumber.y);
        numberElement.setAttribute('text-anchor', 'middle');
        numberElement.setAttribute('dominant-baseline', 'middle');
        numberElement.setAttribute('font-size', '60');
        numberElement.setAttribute('font-weight', 'bold');
        numberElement.setAttribute('fill', CONFIG.FILL_COLOR);
        numberElement.setAttribute('stroke', 'white');
        numberElement.setAttribute('stroke-width', 2);
        numberElement.setAttribute('class', 'falling-number-static');
        numberElement.textContent = number;
        
        fallingNumber.element = numberElement;
        this.fallingNumbers.push(fallingNumber);
        this.renderer.svg.appendChild(numberElement);
        
        console.log(`Created falling number ${number} at FIXED position (${fallingNumber.startX}, ${y}) with DOUBLED speed ${fallingSpeed}, will land in grass at Y: ${targetY}`);
        
        return fallingNumber;
    }

    animateBalloons(currentTime = performance.now()) {
        if (!this.playingBalloonGame) return;
        
        const deltaTime = (currentTime - this.balloonLastTime) / 1000;
        this.balloonLastTime = currentTime;
        
        // Update balloons (rise upward with sideways drift)
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                // Move balloon up at its individual speed
                balloon.y -= balloon.riseSpeed * deltaTime;
                
                // Check if balloon touched the ceiling (top of game area)
                if (balloon.y <= 0) {
                    console.log(`Balloon with number ${balloon.number} touched ceiling - auto-popping`);
                    this.popBalloon(balloon);
                    return; // Skip further processing for this balloon
                }
                
                // Move balloon sideways with drift
                balloon.x += Math.abs(balloon.sidewaysSpeed) * balloon.sidewaysDirection * deltaTime;
                
                // Check boundaries and bounce off edges
                const gameAreaWidth = CONFIG.SVG_WIDTH;
                const balloonWidth = balloon.radius * 2;
                
                if (balloon.x <= 0) {
                    // Hit left edge - bounce right
                    balloon.x = 0;
                    balloon.sidewaysDirection = 1;
                } else if (balloon.x + balloonWidth >= gameAreaWidth) {
                    // Hit right edge - bounce left
                    balloon.x = gameAreaWidth - balloonWidth;
                    balloon.sidewaysDirection = -1;
                }
                
                // Update balloon position
                if (balloon.circle) {
                    balloon.circle.setAttribute('cx', balloon.x + balloon.radius);
                    balloon.circle.setAttribute('cy', balloon.y + balloon.radius);
                }
                if (balloon.highlight) {
                    balloon.highlight.setAttribute('cx', balloon.x + balloon.radius - 17); // Adjusted for larger balloon
                    balloon.highlight.setAttribute('cy', balloon.y + balloon.radius - 17);
                }
                if (balloon.textWord) {
                    balloon.textWord.setAttribute('x', balloon.x + balloon.radius);
                    balloon.textWord.setAttribute('y', balloon.y + balloon.radius + 2);
                }
                
                // Update string - CURLY S-shape attachment
                if (balloon.string) {
                    // Calculate current balloon bottom position
                    const currentStartX = balloon.x + balloon.radius;
                    const currentStartY = balloon.y + balloon.radius * 2;
                    
                    // Calculate movement delta
                    const deltaX = currentStartX - balloon.stringStartX;
                    const deltaY = currentStartY - balloon.stringStartY;
                    
                    // Update all curve points by the same delta to maintain S-shape
                    const newStartX = currentStartX;
                    const newStartY = currentStartY;
                    const newEndX = balloon.stringEndX + deltaX;
                    const newEndY = balloon.stringEndY + deltaY;
                    const newCurve1X = balloon.stringCurve1X + deltaX;
                    const newCurve1Y = balloon.stringCurve1Y + deltaY;
                    const newCurve2X = balloon.stringCurve2X + deltaX;
                    const newCurve2Y = balloon.stringCurve2Y + deltaY;
                    const newCurve3X = balloon.stringCurve3X + deltaX;
                    const newCurve3Y = balloon.stringCurve3Y + deltaY;
                    
                    // Recreate S-curve path with updated positions
                    const pathData = `M ${newStartX} ${newStartY} 
                                     C ${newStartX + 6} ${newStartY + 12}, ${newCurve1X} ${newCurve1Y - 12}, ${newCurve1X} ${newCurve1Y}
                                     C ${newCurve1X} ${newCurve1Y + 12}, ${newCurve2X} ${newCurve2Y - 12}, ${newCurve2X} ${newCurve2Y}
                                     C ${newCurve2X} ${newCurve2Y + 12}, ${newCurve3X} ${newCurve3Y - 12}, ${newCurve3X} ${newCurve3Y}
                                     C ${newCurve3X} ${newCurve3Y + 12}, ${newEndX - 6} ${newEndY - 12}, ${newEndX} ${newEndY}`;
                    
                    balloon.string.setAttribute('d', pathData);
                }
            }
        });
        
        // Update falling numbers - ABSOLUTELY STRAIGHT vertical fall
        this.fallingNumbers.forEach(fallingNumber => {
            if (!fallingNumber.landed) {
                // ONLY update Y position - X position is NEVER modified
                fallingNumber.y += fallingNumber.speed * deltaTime;
                
                // Check if reached ground
                if (fallingNumber.y >= fallingNumber.targetY) {
                    fallingNumber.y = fallingNumber.targetY;
                    fallingNumber.landed = true;
                    console.log(`Falling number ${fallingNumber.number} landed`);
                    
                    // Check if all numbers have landed
                    const allLanded = this.fallingNumbers.every(fn => fn.landed);
                    if (allLanded && !this.numbersLanded) {
                        this.numbersLanded = true;
                        console.log('All falling numbers have landed');
                        this.checkBalloonGameCompletion();
                    }
                }
                
                // Update ONLY Y position - X position remains at startX forever
                if (fallingNumber.element) {
                    fallingNumber.element.setAttribute('y', fallingNumber.y);
                    // NEVER update X position - it stays at the original startX value
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
        const hasFoundEnoughCorrect = this.correctBalloonsFound >= this.totalCorrectBalloons;
        const allBalloonsGone = activeBalloonsCount === 0;
        
        // Game can complete if we found enough correct balloons OR all balloons are gone
        // BUT we must wait for both speech completion AND numbers to land
        if ((hasFoundEnoughCorrect || allBalloonsGone) && this.speechComplete && this.numbersLanded) {
            console.log(`Balloon game completing: found ${this.correctBalloonsFound}/${this.totalCorrectBalloons} correct balloons, speech complete: ${this.speechComplete}, numbers landed: ${this.numbersLanded}`);
            
            // Complete immediately since all conditions are met
            this.onBalloonGameComplete();
        } else {
            console.log(`Waiting for completion conditions - correct: ${hasFoundEnoughCorrect}, all gone: ${allBalloonsGone}, speech: ${this.speechComplete}, landed: ${this.numbersLanded}`);
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
        // Clear all balloon game elements from SVG (but not the CSS grass band)
        const elementsToRemove = this.renderer.svg.querySelectorAll(
            '.balloon-group, .falling-number-static, .pop-star'
        );
        elementsToRemove.forEach(element => element.remove());
        
        // Reset balloon game state
        this.balloons = [];
        this.fallingNumbers = [];
        this.correctBalloonsFound = 0;
        this.speechComplete = false;
        this.numbersLanded = false;
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

    // Enhanced audio methods with voice gender support and callback functionality
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
                    utterance.pitch = 1.3; // Slightly higher than adult male but not silly
                    utterance.rate = 0.9;
                } else if (preferredGender === 'girl') {
                    utterance.pitch = 1.4; // Keep original girl voice pitch
                    utterance.rate = 0.9;
                }
                
                speechSynthesis.speak(utterance);
                console.log(`Speaking (${preferredGender || 'default'}):`, text);
            }
        } catch (error) {
            console.warn('Speech synthesis failed:', error);
        }
    }

    speakTextWithCallback(text, preferredGender = null, callback = null) {
        if (!this.audioEnabled) {
            if (callback) callback();
            return;
        }
        
        try {
            // Use Web Speech API for text-to-speech
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9; // Slightly slower for children
                utterance.pitch = 1.3; // Higher pitch for child-like voices
                utterance.volume = 0.8;
                
                // Add end callback
                if (callback) {
                    utterance.onend = callback;
                    utterance.onerror = callback; // Also call on error
                }
                
                // Get available voices (same logic as speakText)
                const voices = speechSynthesis.getVoices();
                let selectedVoice = null;
                
                if (preferredGender === 'boy') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('boy') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('young') ||
                        voice.name.toLowerCase().includes('junior') ||
                        voice.name.toLowerCase().includes('daniel') ||
                        voice.name.toLowerCase().includes('alex') ||
                        voice.name.toLowerCase().includes('david')
                    );
                    
                    if (!selectedVoice) {
                        selectedVoice = voices.find(voice => 
                            voice.name.toLowerCase().includes('male') ||
                            (voice.gender && voice.gender.toLowerCase() === 'male')
                        );
                    }
                } else if (preferredGender === 'girl') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('girl') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('young') ||
                        voice.name.toLowerCase().includes('samantha') ||
                        voice.name.toLowerCase().includes('victoria') ||
                        voice.name.toLowerCase().includes('karen') ||
                        voice.name.toLowerCase().includes('emma')
                    );
                    
                    if (!selectedVoice) {
                        selectedVoice = voices.find(voice => 
                            voice.name.toLowerCase().includes('female') ||
                            (voice.gender && voice.gender.toLowerCase() === 'female')
                        );
                    }
                }
                
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
                }
                
                // Adjust pitch and rate for more child-like sound
                if (preferredGender === 'boy') {
                    utterance.pitch = 1.3;
                    utterance.rate = 0.9;
                } else if (preferredGender === 'girl') {
                    utterance.pitch = 1.4;
                    utterance.rate = 0.9;
                }
                
                speechSynthesis.speak(utterance);
                console.log(`Speaking with callback (${preferredGender || 'default'}):`, text);
            }
        } catch (error) {
            console.warn('Speech synthesis failed:', error);
            if (callback) callback();
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

    playFailureSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            // Create a failure tone (lower pitched, dissonant)
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Lower frequency descending tone for failure
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime); // Lower starting frequency
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3); // Descend to lower note
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('Failure sound failed:', error);
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
