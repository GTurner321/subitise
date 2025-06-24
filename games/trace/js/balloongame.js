// Fixed BalloonGame Class - Complete Implementation
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
        
        // Enhanced balloon configuration for full screen
        this.balloonCount = 3;
        this.balloonWidth = 80; // Larger balloons
        this.balloonHeight = 100;
        this.balloonSpeed = { min: 40, max: 60 }; // Variable speeds per balloon
        this.floatAmplitude = 25; // Increased horizontal drift
        this.floatFrequency = 0.001; // Slower, more natural drift
        
        // Full screen game area (no longer confined to white box)
        this.gameTop = 50;
        this.gameBottom = CONFIG.SVG_HEIGHT - 100; // Above grass area
        this.gameLeft = 50;
        this.gameRight = CONFIG.SVG_WIDTH - 50;
        
        console.log('BalloonGame constructor completed successfully');
    }

    startGame(correctNumber, onComplete) {
        if (this.isActive) {
            console.log('Game already active, skipping start');
            return;
        }
        
        console.log('Starting enhanced balloon game for number:', correctNumber);
        
        this.correctNumber = correctNumber;
        this.onComplete = onComplete;
        this.isActive = true;
        this.correctAnswerRevealed = false;
        this.allBalloonsPopped = false;
        this.fallingNumber = null;
        
        // Clear any existing balloons
        this.cleanup();
        
        // Create balloons with enhanced positioning
        this.createBalloons();
        
        // Start animation immediately
        this.startTime = Date.now();
        this.animate();
        
        console.log('Enhanced balloon game started with animation');
    }

    createBalloons() {
        this.balloons = [];
        
        // Generate 3 different numbers, one of which is correct
        const numbers = this.generateBalloonNumbers();
        
        // Create random non-overlapping positions near bottom
        const positions = this.generateRandomPositions();
        
        for (let i = 0; i < this.balloonCount; i++) {
            const x = positions[i].x;
            const y = positions[i].y;
            const number = numbers[i];
            const isCorrect = number === this.correctNumber;
            // Each balloon gets its own random speed within the range
            const speed = this.balloonSpeed.min + Math.random() * (this.balloonSpeed.max - this.balloonSpeed.min);
            
            const balloon = this.createBalloon(x, y, number, isCorrect, i, speed);
            this.balloons.push(balloon);
        }
        
        console.log('Created enhanced balloons with numbers:', numbers);
    }

    generateRandomPositions() {
        const positions = [];
        const minDistance = this.balloonWidth + 20; // Minimum distance between balloons
        
        for (let i = 0; i < this.balloonCount; i++) {
            let attempts = 0;
            let position;
            
            do {
                position = {
                    x: this.gameLeft + Math.random() * (this.gameRight - this.gameLeft - this.balloonWidth),
                    y: this.gameBottom - 50 - Math.random() * 100 // Random starting heights near bottom
                };
                attempts++;
            } while (attempts < 50 && this.isPositionTooClose(position, positions, minDistance));
            
            positions.push(position);
        }
        
        return positions;
    }

    isPositionTooClose(newPos, existingPositions, minDistance) {
        return existingPositions.some(pos => {
            const distance = Math.sqrt(
                Math.pow(newPos.x - pos.x, 2) + Math.pow(newPos.y - pos.y, 2)
            );
            return distance < minDistance;
        });
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

    createBalloon(x, y, number, isCorrect, index, speed) {
        // Create balloon group
        const balloonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        balloonGroup.setAttribute('class', `balloon-${index}`);
        balloonGroup.setAttribute('transform', `translate(${x}, ${y})`);
        balloonGroup.style.cursor = 'pointer';
        
        // Balloon body (ellipse) - larger than before
        const balloonBody = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        balloonBody.setAttribute('cx', this.balloonWidth / 2);
        balloonBody.setAttribute('cy', this.balloonHeight / 2);
        balloonBody.setAttribute('rx', this.balloonWidth / 2 - 5);
        balloonBody.setAttribute('ry', this.balloonHeight / 2 - 5);
        balloonBody.setAttribute('fill', this.getBalloonColor(index));
        balloonBody.setAttribute('stroke', 'white');
        balloonBody.setAttribute('stroke-width', 3);
        balloonBody.setAttribute('filter', 'drop-shadow(3px 3px 6px rgba(0,0,0,0.3))');
        
        // Enhanced curved string with S-shape and flowing animation
        const stringPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const stringLength = 40;
        const stringStartX = this.balloonWidth / 2;
        const stringStartY = this.balloonHeight - 5;
        
        // Create flowing S-curve path
        const pathData = `M ${stringStartX} ${stringStartY} 
                         Q ${stringStartX - 8} ${stringStartY + 10} ${stringStartX + 4} ${stringStartY + 20}
                         Q ${stringStartX + 12} ${stringStartY + 30} ${stringStartX - 2} ${stringStartY + stringLength}`;
        
        stringPath.setAttribute('d', pathData);
        stringPath.setAttribute('stroke', '#333');
        stringPath.setAttribute('stroke-width', 2);
        stringPath.setAttribute('fill', 'none');
        stringPath.setAttribute('class', 'balloon-string');
        
        // Add flowing animation to string - each string has slightly different timing
        const animateString = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animateString.setAttribute('attributeName', 'transform');
        animateString.setAttribute('type', 'rotate');
        animateString.setAttribute('values', '-3 40 85; 3 40 85; -3 40 85');
        animateString.setAttribute('dur', `${2 + Math.random()}s`);
        animateString.setAttribute('repeatCount', 'indefinite');
        stringPath.appendChild(animateString);
        
        // Number text (word version, larger)
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', this.balloonWidth / 2);
        numberText.setAttribute('y', this.balloonHeight / 2 + 10);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '28');
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.setAttribute('pointer-events', 'none'); // Prevent text from blocking clicks
        numberText.textContent = CONFIG.NUMBER_WORDS[number];
        
        balloonGroup.appendChild(balloonBody);
        balloonGroup.appendChild(stringPath);
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
        
        console.log(`Created enhanced balloon ${index} at (${x}, ${y}) with speed ${speed.toFixed(1)} px/s`);
        
        return {
            element: balloonGroup,
            x: x,
            y: y,
            originalY: y, // Store original Y for animation reference
            number: number,
            isCorrect: isCorrect,
            isPopped: false,
            startTime: Date.now(), // Start immediately
            floatOffset: Math.random() * Math.PI * 2, // Random phase for floating
            speed: speed, // Individual speed for this balloon
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
        
        console.log(`Enhanced balloon ${index} clicked! Correct: ${isCorrect}, Number: ${this.balloons[index].number}`);
        
        if (isCorrect) {
            this.handleCorrectBalloon(index);
        } else {
            this.handleWrongBalloon(index);
        }
    }

    handleCorrectBalloon(index) {
        const balloon = this.balloons[index];
        
        // Create falling number BEFORE popping balloon (so we have the position)
        this.createFallingNumber(balloon.x + this.balloonWidth / 2, balloon.y + this.balloonHeight / 2);
        
        // Pop the balloon
        this.popBalloon(index);
        
        // Speak the number using the game controller's SAME voice gender as the tracing instruction
        if (window.traceGame && window.traceGame.audioEnabled) {
            setTimeout(() => {
                window.traceGame.speakText(CONFIG.NUMBER_WORDS[this.correctNumber], window.traceGame.currentVoiceGender);
            }, 300);
        }
        
        this.correctAnswerRevealed = true;
        
        // Auto-complete after showing the number for a moment (no longer wait for all balloons)
        setTimeout(() => {
            this.completeGame();
        }, 2000);
        
        console.log('Correct balloon clicked! Number figure falling and game will auto-complete...');
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
        
        // Get balloon center position for pop effect (important: use current transform position)
        const transform = balloon.element.getAttribute('transform');
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        let balloonCenterX, balloonCenterY;
        
        if (match) {
            balloonCenterX = parseFloat(match[1]) + this.balloonWidth / 2;
            balloonCenterY = parseFloat(match[2]) + this.balloonHeight / 2;
        } else {
            // Fallback to original position
            balloonCenterX = balloon.x + this.balloonWidth / 2;
            balloonCenterY = balloon.y + this.balloonHeight / 2;
        }
        
        // Create enhanced pop animation at balloon center
        const popEffect = this.createPopEffect(balloonCenterX, balloonCenterY);
        
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
        
        // Create larger burst with more lines for enhanced effect
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', Math.cos(angle) * 30);
            line.setAttribute('y2', Math.sin(angle) * 30);
            line.setAttribute('stroke', '#FFD700');
            line.setAttribute('stroke-width', 4);
            line.setAttribute('stroke-linecap', 'round');
            
            // Animate the burst
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'stroke-width');
            animate.setAttribute('values', '4;0');
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
            fallSpeed: 120, // Slightly faster fall
            hasReachedBottom: false
        };
        
        // Create number figure element with enhanced flash animation
        const numberGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        numberGroup.setAttribute('transform', `translate(${x}, ${y})`);
        numberGroup.setAttribute('class', 'falling-number'); // This triggers CSS animation
        
        // Create background circle (larger than before)
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        background.setAttribute('cx', 0);
        background.setAttribute('cy', 0);
        background.setAttribute('r', 35); // Larger radius
        background.setAttribute('fill', CONFIG.FILL_COLOR);
        background.setAttribute('stroke', 'white');
        background.setAttribute('stroke-width', 4);
        background.setAttribute('filter', 'drop-shadow(3px 3px 8px rgba(0,0,0,0.4))');
        
        // Create number text (figure version, larger)
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', 0);
        numberText.setAttribute('y', 12);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '42'); // Larger font
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.textContent = this.correctNumber;
        
        numberGroup.appendChild(background);
        numberGroup.appendChild(numberText);
        
        this.svg.appendChild(numberGroup);
        this.fallingNumber.element = numberGroup;
        
        console.log(`Created enhanced falling number ${this.correctNumber} at (${x}, ${y})`);
    }

    animate() {
        if (!this.isActive) {
            console.log('Animation stopped - game not active');
            return;
        }
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.startTime;
        
        // Update balloons with enhanced movement
        this.updateBalloons(deltaTime);
        
        // Update falling number
        this.updateFallingNumber(deltaTime);
        
        // Continue animation if game is still active
        if (this.isActive) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            console.log('Stopping enhanced balloon animation - game completed');
        }
    }

    updateBalloons(totalTime) {
        let allPopped = true;
        
        this.balloons.forEach((balloon, index) => {
            if (balloon.isPopped) return;
            
            allPopped = false;
            
            // Calculate time-based movement with individual balloon speeds
            const balloonTime = totalTime;
            const verticalProgress = balloon.speed * balloonTime / 1000; // Use individual speed
            const newY = balloon.originalY - verticalProgress;
            
            // Enhanced horizontal drift with individual phases for more natural movement
            const timeInSeconds = balloonTime / 1000;
            const driftX = Math.sin((timeInSeconds * this.floatFrequency) + balloon.floatOffset) * this.floatAmplitude;
            const newX = balloon.x + driftX;
            
            // Update position
            if (balloon.element && balloon.element.parentNode) {
                balloon.element.setAttribute('transform', `translate(${newX}, ${newY})`);
            } else {
                console.warn(`Enhanced balloon ${index} element missing or not in DOM`);
            }
            
            // Check if balloon reached top of full screen area
            if (newY + this.balloonHeight < this.gameTop) {
                console.log(`Enhanced balloon ${index} reached top, handling...`);
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
        
        // Check if reached bottom (above grass area)
        if (newY >= this.gameBottom - 50) {
            this.fallingNumber.element.setAttribute('transform', `translate(${this.fallingNumber.x}, ${this.gameBottom - 50})`);
            this.fallingNumber.hasReachedBottom = true;
        } else {
            this.fallingNumber.element.setAttribute('transform', `translate(${this.fallingNumber.x}, ${newY})`);
        }
    }

    completeGame() {
        if (!this.isActive) {
            console.log('Enhanced balloon game already completed or not active');
            return;
        }
        
        console.log('Enhanced balloon game completed!');
        this.isActive = false; // Set to false to stop animation
        
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clean up after showing final state
        setTimeout(() => {
            this.cleanup();
            if (this.onComplete) {
                this.onComplete();
            }
        }, 1500);
    }

    cleanup() {
        console.log('Cleaning up enhanced balloon game');
        
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
        
        console.log('Enhanced balloon cleanup completed');
    }

    reset() {
        console.log('Resetting enhanced balloon game');
        this.cleanup();
        this.correctNumber = null;
        this.correctAnswerRevealed = false;
        this.allBalloonsPopped = false;
    }
}

// Ensure BalloonGame is available globally
window.BalloonGame = BalloonGame;
