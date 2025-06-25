class BalloonGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Balloon game container not found:', containerId);
            return;
        }
        
        // Store original container content so we can restore it later
        this.originalContent = null;
        
        // Wait for CONFIG to be available before initializing
        if (typeof CONFIG === 'undefined') {
            console.error('CONFIG object not available - waiting...');
            // Try again after a short delay
            setTimeout(() => {
                if (typeof CONFIG !== 'undefined') {
                    this.initializeWithConfig();
                } else {
                    console.error('CONFIG still not available - using fallback dimensions');
                    this.initializeWithFallback();
                }
            }, 100);
            return;
        }
        
        this.initializeWithConfig();
    }

    initializeWithConfig() {
        this.svg = null;
        this.balloons = [];
        this.fallingNumbers = [];
        this.currentNumber = null;
        this.correctBalloonsFound = 0;
        this.totalCorrectBalloons = 3;
        this.isActive = false;
        this.onComplete = null;
        this.animationId = null;
        this.lastTime = 0;
        
        // Game settings
        this.balloonCount = 12;
        this.minRiseSpeed = 40; // pixels per second
        this.maxRiseSpeed = 60; // pixels per second
        this.numberFallSpeed = 100; // pixels per second (double average rise speed)
        this.groundLevel = CONFIG.SVG_HEIGHT - 80; // Ground level for numbers to land
        
        this.initialize();
    }

    initializeWithFallback() {
        this.svg = null;
        this.balloons = [];
        this.fallingNumbers = [];
        this.currentNumber = null;
        this.correctBalloonsFound = 0;
        this.totalCorrectBalloons = 3;
        this.isActive = false;
        this.onComplete = null;
        this.animationId = null;
        this.lastTime = 0;
        
        // Game settings with fallback dimensions
        this.balloonCount = 12;
        this.minRiseSpeed = 40;
        this.maxRiseSpeed = 60;
        this.numberFallSpeed = 100;
        this.groundLevel = 520; // Fallback ground level (600 - 80)
        this.svgWidth = 800; // Fallback width
        this.svgHeight = 600; // Fallback height
        
        this.initialize();
    }

    initialize() {
        this.createSVG();
        console.log('Balloon game initialized');
    }

    createSVG() {
        // Store original content before replacing it
        if (!this.originalContent) {
            this.originalContent = this.container.innerHTML;
        }
        
        // Clear existing content and replace with balloon game
        this.container.innerHTML = '';
        
        // Get dimensions (with fallback support)
        const width = (typeof CONFIG !== 'undefined') ? CONFIG.SVG_WIDTH : this.svgWidth || 800;
        const height = (typeof CONFIG !== 'undefined') ? CONFIG.SVG_HEIGHT : this.svgHeight || 600;
        
        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('class', 'balloon-game-svg');
        this.svg.style.backgroundColor = '#87CEEB'; // Sky blue background
        this.svg.style.position = 'absolute';
        this.svg.style.top = '0';
        this.svg.style.left = '0';
        this.svg.style.zIndex = '1000';
        
        // Update ground level if using fallback
        if (typeof CONFIG === 'undefined') {
            this.groundLevel = height - 80;
        }
        
        // Add ground
        this.createGround();
        
        this.container.appendChild(this.svg);
        
        console.log(`Balloon game SVG created: ${width} x ${height}`);
    }

    createGround() {
        if (!this.svg) {
            console.error('Cannot create ground - SVG not initialized');
            return;
        }
        
        // Get dimensions (with fallback support)
        const width = (typeof CONFIG !== 'undefined') ? CONFIG.SVG_WIDTH : this.svgWidth || 800;
        const height = (typeof CONFIG !== 'undefined') ? CONFIG.SVG_HEIGHT : this.svgHeight || 600;
        
        const ground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        ground.setAttribute('x', 0);
        ground.setAttribute('y', this.groundLevel);
        ground.setAttribute('width', width);
        ground.setAttribute('height', height - this.groundLevel);
        ground.setAttribute('fill', '#90EE90'); // Light green ground
        ground.setAttribute('class', 'balloon-ground');
        
        this.svg.appendChild(ground);
        
        console.log(`Ground created at y=${this.groundLevel}`);
    }

    startGame(number, onCompleteCallback) {
        console.log('Starting balloon game for number:', number);
        
        this.currentNumber = number;
        this.onComplete = onCompleteCallback;
        this.correctBalloonsFound = 0;
        this.isActive = true;
        
        // Clear existing balloons and numbers
        this.balloons = [];
        this.fallingNumbers = [];
        this.clearSVG();
        this.createGround();
        
        // Create 12 balloons with random positions and speeds
        this.createBalloons();
        
        // Start animation loop
        this.lastTime = performance.now();
        this.animate();
        
        // Speak instruction using game controller's voice system
        if (window.traceGame && window.traceGame.audioEnabled) {
            setTimeout(() => {
                window.traceGame.speakText(`Pop the balloons with the number ${number}!`, window.traceGame.currentVoiceGender);
            }, 500);
        }
    }

    createBalloons() {
        // Generate 12 random horizontal positions without overlap
        const balloonWidth = 80; // Approximate balloon width including margin
        const positions = this.generateNonOverlappingPositions(this.balloonCount, balloonWidth);
        
        // Create array of numbers: 3 correct numbers + 9 random different numbers
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
        for (let i = 0; i < this.balloonCount; i++) {
            const balloon = this.createBalloon(positions[i], numbers[i]);
            this.balloons.push(balloon);
        }
        
        console.log(`Created ${this.balloonCount} balloons with ${this.totalCorrectBalloons} correct numbers`);
    }

    generateNonOverlappingPositions(count, width) {
        const positions = [];
        const margin = 20; // Extra margin between balloons
        const totalWidth = width + margin;
        
        // Get available width (with fallback support)
        const svgWidth = (typeof CONFIG !== 'undefined') ? CONFIG.SVG_WIDTH : this.svgWidth || 800;
        const availableWidth = svgWidth - width;
        
        // Try to place balloons without overlap
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let position;
            
            do {
                position = Math.random() * availableWidth;
                attempts++;
            } while (this.hasOverlap(position, positions, totalWidth) && attempts < 50);
            
            positions.push(position);
        }
        
        return positions.sort((a, b) => a - b); // Sort for better visual distribution
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
        if (!this.svg) {
            console.error('Cannot create balloon - SVG not initialized');
            return null;
        }
        
        // Get height (with fallback support)
        const svgHeight = (typeof CONFIG !== 'undefined') ? CONFIG.SVG_HEIGHT : this.svgHeight || 600;
        
        const isCorrectNumber = number === this.currentNumber;
        
        // Random rise speed for each balloon
        const riseSpeed = this.minRiseSpeed + Math.random() * (this.maxRiseSpeed - this.minRiseSpeed);
        
        const balloon = {
            x: x,
            y: svgHeight + 50, // Start below screen
            number: number,
            isCorrect: isCorrectNumber,
            riseSpeed: riseSpeed,
            popped: false,
            group: null
        };
        
        // Create balloon group
        const balloonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        balloonGroup.setAttribute('class', 'balloon-group');
        balloonGroup.style.cursor = 'pointer';
        
        // Create balloon string FIRST (so it appears behind balloon)
        const string = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        string.setAttribute('x1', balloon.x + 25); // Center of balloon
        string.setAttribute('y1', balloon.y + 50); // Bottom of balloon
        string.setAttribute('x2', balloon.x + 25); // Same x
        string.setAttribute('y2', balloon.y + 120); // String length
        string.setAttribute('stroke', '#8B4513'); // Brown string
        string.setAttribute('stroke-width', 2);
        string.setAttribute('class', 'balloon-string');
        balloonGroup.appendChild(string);
        
        // Create balloon circle
        const balloonCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        balloonCircle.setAttribute('cx', balloon.x + 25);
        balloonCircle.setAttribute('cy', balloon.y + 25);
        balloonCircle.setAttribute('r', 25);
        balloonCircle.setAttribute('fill', isCorrectNumber ? '#FF6B6B' : '#87CEEB'); // Red for correct, blue for others
        balloonCircle.setAttribute('stroke', '#333');
        balloonCircle.setAttribute('stroke-width', 2);
        balloonCircle.setAttribute('class', 'balloon-circle');
        balloonGroup.appendChild(balloonCircle);
        
        // Create number text on balloon
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', balloon.x + 25);
        numberText.setAttribute('y', balloon.y + 32);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '20');
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.setAttribute('class', 'balloon-number');
        numberText.textContent = number;
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
        balloon.text = numberText;
        
        this.svg.appendChild(balloonGroup);
        
        return balloon;
    }

    popBalloon(balloon) {
        if (balloon.popped || !this.isActive) return;
        
        balloon.popped = true;
        
        console.log(`Balloon popped with number: ${balloon.number}, correct: ${balloon.isCorrect}`);
        
        // Play pop sound effect using game controller's audio
        if (window.traceGame && window.traceGame.audioEnabled) {
            window.traceGame.playCompletionSound();
        }
        
        if (balloon.isCorrect) {
            // Correct balloon popped!
            this.correctBalloonsFound++;
            
            // Create falling number at balloon position
            this.createFallingNumber(balloon.x + 25, balloon.y + 25, balloon.number);
            
            // Speak encouragement
            if (window.traceGame && window.traceGame.audioEnabled) {
                const encouragements = ['Great job!', 'Well done!', 'Excellent!', 'Perfect!'];
                const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                setTimeout(() => {
                    window.traceGame.speakText(randomEncouragement, window.traceGame.currentVoiceGender);
                }, 200);
            }
        }
        
        // Remove balloon with pop animation
        if (balloon.group) {
            // Create pop effect
            this.createPopEffect(balloon.x + 25, balloon.y + 25);
            
            // Remove balloon
            balloon.group.remove();
        }
        
        // Check if game is complete
        this.checkGameCompletion();
    }

    createPopEffect(x, y) {
        if (!this.svg) {
            console.error('Cannot create pop effect - SVG not initialized');
            return;
        }
        
        // Create simple star burst effect
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
        
        this.svg.appendChild(popGroup);
        
        // Remove effect after animation
        setTimeout(() => {
            if (popGroup.parentNode) {
                popGroup.parentNode.removeChild(popGroup);
            }
        }, 500);
    }

    createFallingNumber(x, y, number) {
        if (!this.svg) {
            console.error('Cannot create falling number - SVG not initialized');
            return null;
        }
        
        const fallingNumber = {
            x: x,
            y: y,
            targetY: this.groundLevel - 40, // Land on ground
            number: number,
            speed: this.numberFallSpeed,
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
        
        // Use fallback color if CONFIG not available
        const fillColor = (typeof CONFIG !== 'undefined') ? CONFIG.FILL_COLOR : '#4CAF50';
        numberElement.setAttribute('fill', fillColor);
        numberElement.setAttribute('stroke', 'white');
        numberElement.setAttribute('stroke-width', 2);
        numberElement.setAttribute('class', 'falling-number');
        numberElement.textContent = number;
        
        fallingNumber.element = numberElement;
        this.fallingNumbers.push(fallingNumber);
        this.svg.appendChild(numberElement);
        
        console.log(`Created falling number ${number} at (${x}, ${y})`);
        
        return fallingNumber;
    }

    animate(currentTime = performance.now()) {
        if (!this.isActive) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Update balloons (rise upward)
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                // Move balloon up at its individual speed
                balloon.y -= balloon.riseSpeed * deltaTime;
                
                // Update balloon position
                if (balloon.circle) {
                    balloon.circle.setAttribute('cy', balloon.y + 25);
                }
                if (balloon.text) {
                    balloon.text.setAttribute('y', balloon.y + 32);
                }
                
                // FIXED: String stays attached to bottom of balloon
                if (balloon.string) {
                    balloon.string.setAttribute('y1', balloon.y + 50); // Bottom of balloon
                    balloon.string.setAttribute('y2', balloon.y + 120); // String hangs down 70px
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
        
        // Check if all balloons are gone (reached top or popped)
        const activeBalloonsCount = this.balloons.filter(b => !b.popped).length;
        if (activeBalloonsCount === 0) {
            this.checkGameCompletion();
            return;
        }
        
        // Continue animation
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    checkGameCompletion() {
        // Game completes when all 3 correct balloons are found OR all balloons are gone
        const activeBalloonsCount = this.balloons.filter(b => !b.popped).length;
        
        if (this.correctBalloonsFound >= this.totalCorrectBalloons || activeBalloonsCount === 0) {
            console.log(`Balloon game completing: found ${this.correctBalloonsFound}/${this.totalCorrectBalloons} correct balloons`);
            
            // Wait 1 second after last number lands, then complete
            setTimeout(() => {
                this.completeGame();
            }, 1000);
        }
    }

    completeGame() {
        console.log('Balloon game completed');
        
        this.isActive = false;
        
        // Cancel animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Call completion callback
        if (this.onComplete) {
            this.onComplete();
        }
    }

    clearSVG() {
        // Clear all balloon game elements
        if (this.svg) {
            const elementsToRemove = this.svg.querySelectorAll('.balloon-group, .falling-number, .pop-effect');
            elementsToRemove.forEach(element => element.remove());
        }
    }

    cleanup() {
        this.isActive = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.balloons = [];
        this.fallingNumbers = [];
        this.clearSVG();
        
        console.log('Balloon game cleaned up');
    }

    reset() {
        this.cleanup();
        this.correctBalloonsFound = 0;
        this.currentNumber = null;
        this.onComplete = null;
    }
}

// Make BalloonGame available globally
window.BalloonGame = BalloonGame;
