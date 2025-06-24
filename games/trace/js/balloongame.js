class BalloonGame {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Game state
        this.isActive = false;
        this.correctNumber = null;
        this.balloons = [];
        this.correctAnswerRevealed = false;
        this.fallingNumber = null;
        this.allBalloonsPopped = false;
        
        // Animation
        this.animationId = null;
        this.startTime = null;
        
        // Balloon configuration
        this.balloonCount = 3;
        this.balloonWidth = 60;
        this.balloonHeight = 80;
        this.balloonSpeed = 30; // pixels per second upward
        this.floatAmplitude = 15; // horizontal drift amplitude
        this.floatFrequency = 0.002; // how fast they drift left/right
        
        // Game area
        this.gameTop = 50;
        this.gameBottom = CONFIG.SVG_HEIGHT - 50;
        this.gameLeft = 50;
        this.gameRight = CONFIG.SVG_WIDTH - 50;
    }

    startGame(correctNumber, onComplete) {
        if (this.isActive) return;
        
        console.log('Starting balloon game for number:', correctNumber);
        
        this.correctNumber = correctNumber;
        this.onComplete = onComplete;
        this.isActive = true;
        this.correctAnswerRevealed = false;
        this.allBalloonsPopped = false;
        this.fallingNumber = null;
        
        // Clear any existing balloons
        this.cleanup();
        
        // Create balloons
        this.createBalloons();
        
        // Start animation immediately
        this.startTime = Date.now();
        this.animate();
        
        console.log('Balloon game started with animation');
    }

    createBalloons() {
        this.balloons = [];
        
        // Generate 3 different numbers, one of which is correct
        const numbers = this.generateBalloonNumbers();
        
        // Create balloon positions
        const spacing = (this.gameRight - this.gameLeft - this.balloonWidth) / (this.balloonCount - 1);
        
        for (let i = 0; i < this.balloonCount; i++) {
            const x = this.gameLeft + (spacing * i);
            const y = this.gameBottom - 100; // Start near bottom
            const number = numbers[i];
            const isCorrect = number === this.correctNumber;
            
            const balloon = this.createBalloon(x, y, number, isCorrect, i);
            this.balloons.push(balloon);
        }
        
        console.log('Created balloons with numbers:', numbers);
    }

    generateBalloonNumbers() {
        const numbers = [this.correctNumber];
        
        // Add 2 different random numbers
        while (numbers.length < 3) {
            const randomNum = Math.floor(Math.random() * 10);
            if (!numbers.includes(randomNum)) {
                numbers.push(randomNum);
            }
        }
        
        // Shuffle the array so correct answer isn't always in same position
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        return numbers;
    }

    createBalloon(x, y, number, isCorrect, index) {
        // Create balloon group
        const balloonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        balloonGroup.setAttribute('class', `balloon-${index}`);
        balloonGroup.setAttribute('transform', `translate(${x}, ${y})`);
        balloonGroup.style.cursor = 'pointer';
        
        // Balloon body (ellipse)
        const balloonBody = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        balloonBody.setAttribute('cx', this.balloonWidth / 2);
        balloonBody.setAttribute('cy', this.balloonHeight / 2);
        balloonBody.setAttribute('rx', this.balloonWidth / 2 - 5);
        balloonBody.setAttribute('ry', this.balloonHeight / 2 - 5);
        balloonBody.setAttribute('fill', this.getBalloonColor(index));
        balloonBody.setAttribute('stroke', 'white');
        balloonBody.setAttribute('stroke-width', 2);
        balloonBody.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        // Balloon string
        const string = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        string.setAttribute('x1', this.balloonWidth / 2);
        string.setAttribute('y1', this.balloonHeight - 5);
        string.setAttribute('x2', this.balloonWidth / 2);
        string.setAttribute('y2', this.balloonHeight + 20);
        string.setAttribute('stroke', '#333');
        string.setAttribute('stroke-width', 1);
        
        // Number text (letter version)
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', this.balloonWidth / 2);
        numberText.setAttribute('y', this.balloonHeight / 2 + 8);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '20');
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.setAttribute('pointer-events', 'none'); // Prevent text from blocking clicks
        numberText.textContent = CONFIG.NUMBER_WORDS[number];
        
        balloonGroup.appendChild(balloonBody);
        balloonGroup.appendChild(string);
        balloonGroup.appendChild(numberText);
        
        // Add click handler with proper binding
        const clickHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log(`Balloon ${index} clicked, isCorrect: ${isCorrect}`);
            this.handleBalloonClick(index, isCorrect);
        };
        
        balloonGroup.addEventListener('click', clickHandler);
        balloonGroup.addEventListener('touchstart', clickHandler);
        
        // Insert balloon before any existing elements to ensure proper layering
        this.svg.appendChild(balloonGroup);
        
        console.log(`Created balloon ${index} at (${x}, ${y}) with number word: ${CONFIG.NUMBER_WORDS[number]}`);
        
        return {
            element: balloonGroup,
            x: x,
            y: y,
            originalY: y, // Store original Y for animation reference
            number: number,
            isCorrect: isCorrect,
            isPopped: false,
            startTime: Date.now(), // Start immediately, no stagger for now
            floatOffset: Math.random() * Math.PI * 2, // Random phase for floating
            clickHandler: clickHandler
        };
    }

    getBalloonColor(index) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        return colors[index % colors.length];
    }

    handleBalloonClick(index, isCorrect) {
        if (!this.isActive || this.balloons[index].isPopped) {
            console.log(`Click ignored - game active: ${this.isActive}, balloon popped: ${this.balloons[index].isPopped}`);
            return;
        }
        
        console.log(`Balloon ${index} clicked! Correct: ${isCorrect}, Number: ${this.balloons[index].number}`);
        
        if (isCorrect) {
            this.handleCorrectBalloon(index);
        } else {
            this.handleWrongBalloon(index);
        }
    }

    handleCorrectBalloon(index) {
        const balloon = this.balloons[index];
        
        // Pop the balloon
        this.popBalloon(index);
        
        // Create falling number figure
        this.createFallingNumber(balloon.x + this.balloonWidth / 2, balloon.y + this.balloonHeight / 2);
        
        // Speak the number using the game controller's SAME voice gender as the tracing instruction
        // This ensures both "trace the number X" and "X" use the same voice before switching
        if (window.traceGame && window.traceGame.audioEnabled) {
            setTimeout(() => {
                window.traceGame.speakText(CONFIG.NUMBER_WORDS[this.correctNumber], window.traceGame.currentVoiceGender);
            }, 300);
        }
        
        this.correctAnswerRevealed = true;
        console.log('Correct balloon clicked! Number figure falling...');
    }

    handleWrongBalloon(index) {
        // Just pop the balloon - it's empty
        this.popBalloon(index);
        console.log('Wrong balloon clicked and popped');
    }

    popBalloon(index) {
        const balloon = this.balloons[index];
        if (balloon.isPopped) return;
        
        balloon.isPopped = true;
        
        // Create pop animation
        const popEffect = this.createPopEffect(balloon.x + this.balloonWidth / 2, balloon.y + this.balloonHeight / 2);
        
        // Remove balloon element
        if (balloon.element && balloon.element.parentNode) {
            balloon.element.remove();
        }
        
        // Remove pop effect after animation
        setTimeout(() => {
            if (popEffect && popEffect.parentNode) {
                popEffect.remove();
            }
        }, 500);
    }

    createPopEffect(x, y) {
        const popGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        popGroup.setAttribute('transform', `translate(${x}, ${y})`);
        popGroup.setAttribute('class', 'pop-effect');
        
        // Create burst lines
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', Math.cos(angle) * 20);
            line.setAttribute('y2', Math.sin(angle) * 20);
            line.setAttribute('stroke', '#FFD700');
            line.setAttribute('stroke-width', 3);
            line.setAttribute('stroke-linecap', 'round');
            
            // Animate the burst
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'stroke-width');
            animate.setAttribute('values', '3;0');
            animate.setAttribute('dur', '0.5s');
            animate.setAttribute('begin', '0s');
            
            const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animateOpacity.setAttribute('attributeName', 'opacity');
            animateOpacity.setAttribute('values', '1;0');
            animateOpacity.setAttribute('dur', '0.5s');
            animateOpacity.setAttribute('begin', '0s');
            
            line.appendChild(animate);
            line.appendChild(animateOpacity);
            popGroup.appendChild(line);
        }
        
        this.svg.appendChild(popGroup);
        return popGroup;
    }

    createFallingNumber(x, y) {
        this.fallingNumber = {
            x: x,
            y: y,
            element: null,
            fallSpeed: 100, // pixels per second
            hasReachedBottom: false
        };
        
        // Create number figure element
        const numberGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        numberGroup.setAttribute('transform', `translate(${x}, ${y})`);
        numberGroup.setAttribute('class', 'falling-number');
        
        // Create background circle
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        background.setAttribute('cx', 0);
        background.setAttribute('cy', 0);
        background.setAttribute('r', 25);
        background.setAttribute('fill', CONFIG.FILL_COLOR);
        background.setAttribute('stroke', 'white');
        background.setAttribute('stroke-width', 3);
        background.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        // Create number text (figure version)
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', 0);
        numberText.setAttribute('y', 8);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '32');
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.textContent = this.correctNumber;
        
        numberGroup.appendChild(background);
        numberGroup.appendChild(numberText);
        
        this.svg.appendChild(numberGroup);
        this.fallingNumber.element = numberGroup;
        
        console.log(`Created falling number ${this.correctNumber} at (${x}, ${y})`);
    }

    animate() {
        if (!this.isActive) {
            console.log('Animation stopped - game not active');
            return;
        }
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.startTime;
        
        // Update balloons
        this.updateBalloons(deltaTime);
        
        // Update falling number
        this.updateFallingNumber(deltaTime);
        
        // Check game completion
        this.checkGameCompletion();
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateBalloons(totalTime) {
        let allPopped = true;
        
        this.balloons.forEach((balloon, index) => {
            if (balloon.isPopped) return;
            
            allPopped = false;
            
            // Calculate time since this balloon started (no stagger for now)
            const balloonTime = totalTime;
            
            // Calculate vertical position (moving upward)
            const verticalProgress = this.balloonSpeed * balloonTime / 1000; // pixels moved upward
            const newY = balloon.originalY - verticalProgress;
            
            // Calculate horizontal drift (gentle side-to-side movement)
            const timeInSeconds = balloonTime / 1000;
            const driftX = Math.sin((timeInSeconds * this.floatFrequency) + balloon.floatOffset) * this.floatAmplitude;
            const newX = balloon.x + driftX;
            
            // Update position
            if (balloon.element && balloon.element.parentNode) {
                balloon.element.setAttribute('transform', `translate(${newX}, ${newY})`);
            }
            
            // Check if balloon reached top
            if (newY + this.balloonHeight < this.gameTop) {
                console.log(`Balloon ${index} reached top, popping...`);
                if (balloon.isCorrect && !this.correctAnswerRevealed) {
                    // Correct balloon reached top without being clicked
                    this.handleCorrectBalloon(index);
                } else {
                    // Wrong balloon or already revealed - just pop
                    this.popBalloon(index);
                }
            }
        });
        
        this.allBalloonsPopped = allPopped;
    }

    updateFallingNumber(totalTime) {
        if (!this.fallingNumber || !this.fallingNumber.element) return;
        
        const fallTime = totalTime / 1000;
        const newY = this.fallingNumber.y + (this.fallingNumber.fallSpeed * fallTime);
        
        // Check if reached bottom
        if (newY >= this.gameBottom - 30) {
            this.fallingNumber.element.setAttribute('transform', `translate(${this.fallingNumber.x}, ${this.gameBottom - 30})`);
        } else {
            this.fallingNumber.element.setAttribute('transform', `translate(${this.fallingNumber.x}, ${newY})`);
        }
    }

    checkGameCompletion() {
        // Game is complete when:
        // 1. All balloons are popped AND
        // 2. Either the correct answer was revealed OR all balloons reached the top
        if (this.allBalloonsPopped && (this.correctAnswerRevealed || this.hasCorrectNumberFallen())) {
            this.completeGame();
        }
    }

    hasCorrectNumberFallen() {
        if (!this.fallingNumber || !this.fallingNumber.element) return false;
        
        // Check if falling number has reached the bottom
        const transform = this.fallingNumber.element.getAttribute('transform');
        const yMatch = transform.match(/translate\([^,]+,\s*([^)]+)\)/);
        if (yMatch) {
            const currentY = parseFloat(yMatch[1]);
            return currentY >= this.gameBottom - 35;
        }
        
        return false;
    }

    completeGame() {
        if (!this.isActive) return;
        
        console.log('Balloon game completed!');
        this.isActive = false;
        
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clean up after a short delay to show final state
        setTimeout(() => {
            this.cleanup();
            if (this.onComplete) {
                this.onComplete();
            }
        }, 1500);
    }

    cleanup() {
        // Remove all balloon elements
        this.balloons.forEach(balloon => {
            if (balloon.element && balloon.element.parentNode) {
                balloon.element.remove();
            }
        });
        
        // Remove falling number
        if (this.fallingNumber && this.fallingNumber.element && this.fallingNumber.element.parentNode) {
            this.fallingNumber.element.remove();
        }
        
        // Remove any pop effects
        const popEffects = this.svg.querySelectorAll('.pop-effect');
        popEffects.forEach(effect => effect.remove());
        
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.balloons = [];
        this.fallingNumber = null;
        this.isActive = false;
    }

    reset() {
        this.cleanup();
        this.correctNumber = null;
        this.correctAnswerRevealed = false;
        this.allBalloonsPopped = false;
    }
}
