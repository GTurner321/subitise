class DiceRenderer {
    constructor() {
        // SEARCH FOR THIS LINE: DICE RENDERER UPDATED 2025-01-01
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.currentDice = [];
        this.rollTimeouts = [];
        
        // Available colors for dice
        this.availableColors = [
            '#ff6b6b',  // Red
            '#4ecdc4',  // Teal
            '#45b7d1',  // Blue
            '#f9ca24',  // Yellow
            '#f0932b',  // Orange
            '#6c5ce7'   // Purple
        ];
        
        // Track previously used colors to avoid repeats
        this.previousColors = [];
    }

    clearDice() {
        this.currentDice.forEach(dice => {
            if (dice && dice.parentNode) {
                dice.parentNode.removeChild(dice);
            }
        });
        this.currentDice = [];
        
        this.rollTimeouts.forEach(timeout => clearTimeout(timeout));
        this.rollTimeouts = [];
    }

    getRandomDiceColors() {
        let availableForSelection = this.availableColors.filter(color => 
            !this.previousColors.includes(color)
        );
        
        if (availableForSelection.length < 2) {
            availableForSelection = [...this.availableColors];
        }
        
        const shuffled = [...availableForSelection].sort(() => Math.random() - 0.5);
        const selectedColors = {
            left: shuffled[0],
            right: shuffled[1]
        };
        
        this.previousColors = [selectedColors.left, selectedColors.right];
        return selectedColors;
    }

    getDiagonalDirections() {
        return [
            { rotX: 90, rotY: 90, name: 'down-right', reverse: 'up-left' },
            { rotX: -90, rotY: 90, name: 'up-right', reverse: 'down-left' },
            { rotX: 90, rotY: -90, name: 'down-left', reverse: 'up-right' },
            { rotX: -90, rotY: -90, name: 'up-left', reverse: 'down-right' }
        ];
    }

    getRandomDiagonalDirection(previousDirection = null) {
        const directions = this.getDiagonalDirections();
        
        if (!previousDirection) {
            return directions[Math.floor(Math.random() * directions.length)];
        }
        
        const validDirections = directions.filter(dir => dir.name !== previousDirection.reverse);
        return validDirections[Math.floor(Math.random() * validDirections.length)];
    }

    getRandomFlipDuration() {
        const durations = [0.35, 0.45, 0.55, 0.65];
        return durations[Math.floor(Math.random() * durations.length)];
    }

    createDice(diceColor) {
        const dice = document.createElement('div');
        dice.className = 'dice';
        dice.style.opacity = '0';
        dice.style.transformStyle = 'preserve-3d';
        dice.style.backgroundColor = 'transparent';
        dice.style.background = 'transparent';
        dice.style.border = 'none';
        dice.style.boxShadow = 'none';
        
        const faceValues = {
            'front': 1, 'back': 6, 'right': 2, 'left': 5, 'top': 3, 'bottom': 4
        };
        
        Object.entries(faceValues).forEach(([faceClass, faceValue]) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            face.style.backgroundColor = 'transparent';
            face.style.background = 'transparent';
            
            const coloredSurface = document.createElement('div');
            coloredSurface.className = 'dice-face-surface';
            coloredSurface.style.position = 'absolute';
            coloredSurface.style.top = '0';
            coloredSurface.style.left = '0';
            coloredSurface.style.width = '100%';
            coloredSurface.style.height = '100%';
            coloredSurface.style.backgroundColor = diceColor;
            coloredSurface.style.border = '3px solid #333';
            coloredSurface.style.borderRadius = '15px';
            coloredSurface.style.boxSizing = 'border-box';
            
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'dice-dots-container';
            dotsContainer.style.position = 'relative';
            dotsContainer.style.zIndex = '2';
            dotsContainer.style.width = '100%';
            dotsContainer.style.height = '100%';
            dotsContainer.style.display = 'grid';
            dotsContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
            dotsContainer.style.gridTemplateRows = '1fr 1fr 1fr';
            dotsContainer.style.gap = '8px';
            dotsContainer.style.padding = '12px';
            dotsContainer.style.boxSizing = 'border-box';
            
            this.createDots(dotsContainer, faceValue);
            
            face.appendChild(coloredSurface); 
            face.appendChild(dotsContainer);  
            dice.appendChild(face);
        });
        
        const startingRotX = Math.floor(Math.random() * 4) * 90;
        const startingRotY = Math.floor(Math.random() * 4) * 90;
        dice.style.transform = `rotateX(${startingRotX}deg) rotateY(${startingRotY}deg)`;
        
        dice.dataset.currentRotationX = startingRotX;
        dice.dataset.currentRotationY = startingRotY;
        
        return dice;
    }

    createDots(container, value) {
        const pattern = CONFIG.DICE_FACES[value];
        container.innerHTML = '';
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const dot = document.createElement('div');
                dot.className = 'dice-dot';
                
                if (pattern[row][col] === 1) {
                    dot.classList.add('active');
                }
                
                container.appendChild(dot);
            }
        }
    }

    readVisibleFaceSimple(dice) {
        const faces = dice.querySelectorAll('.dice-face');
        let largestFace = null;
        let largestArea = 0;
        
        faces.forEach(face => {
            const rect = face.getBoundingClientRect();
            const area = rect.width * rect.height;
            
            if (area > largestArea && rect.width > 50 && rect.height > 50) {
                largestFace = face;
                largestArea = area;
            }
        });
        
        if (largestFace) {
            const activeDots = largestFace.querySelectorAll('.dice-dot.active');
            const value = activeDots.length;
            console.log(`Dice shows ${value} dots (area: ${largestArea.toFixed(1)}px²)`);
            return Math.max(1, Math.min(6, value));
        }
        
        console.log('No visible face found, defaulting to 1');
        return 1;
    }

    async rollDice() {
        console.log('=== STARTING DICE ROLL ===');
        
        const colors = this.getRandomDiceColors();
        const leftDice = this.createDice(colors.left);
        const rightDice = this.createDice(colors.right);
        
        this.leftSide.appendChild(leftDice);
        this.rightSide.appendChild(rightDice);
        this.currentDice = [leftDice, rightDice];
        
        setTimeout(() => {
            [leftDice, rightDice].forEach(dice => {
                dice.style.transition = 'opacity 1s ease-in';
                dice.style.opacity = '1';
            });
        }, 200);
        
        const leftRolls = Math.floor(Math.random() * 10) + 6;
        const rightRolls = Math.floor(Math.random() * 10) + 6;
        
        const leftPromise = this.rollDiceNaturally(leftDice, leftRolls, 'Left');
        const rightPromise = this.rollDiceNaturally(rightDice, rightRolls, 'Right');
        
        await Promise.all([leftPromise, rightPromise]);
        
        // Wait for dice to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const leftValue = this.readVisibleFaceSimple(leftDice);
        const rightValue = this.readVisibleFaceSimple(rightDice);
        const total = leftValue + rightValue;
        
        console.log(`=== DICE COMPLETE ===`);
        console.log(`Left: ${leftValue}, Right: ${rightValue}, Total: ${total}`);
        
        return { left: leftValue, right: rightValue, total: total };
    }

    async rollDiceNaturally(dice, numberOfRolls, diceName) {
        return new Promise((resolve) => {
            let rollCount = 0;
            let currentRotationX = parseInt(dice.dataset.currentRotationX) || 0;
            let currentRotationY = parseInt(dice.dataset.currentRotationY) || 0;
            let previousDirection = null;
            
            const performRoll = () => {
                rollCount++;
                
                const direction = this.getRandomDiagonalDirection(previousDirection);
                const flipDuration = this.getRandomFlipDuration();
                
                currentRotationX += direction.rotX;
                currentRotationY += direction.rotY;
                
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
                
                dice.dataset.currentRotationX = currentRotationX;
                dice.dataset.currentRotationY = currentRotationY;
                previousDirection = direction;
                
                if (rollCount >= numberOfRolls) {
                    const stopTimeout = setTimeout(() => {
                        dice.classList.add('dice-final');
                        resolve();
                    }, flipDuration * 1000);
                    this.rollTimeouts.push(stopTimeout);
                } else {
                    const nextTimeout = setTimeout(performRoll, flipDuration * 1000);
                    this.rollTimeouts.push(nextTimeout);
                }
            };
            
            const initialTimeout = setTimeout(performRoll, 1300);
            this.rollTimeouts.push(initialTimeout);
        });
    }

    async fadeOutCurrentDice() {
        if (this.currentDice.length === 0) return;
        
        this.currentDice.forEach(dice => {
            if (dice && dice.parentNode) {
                dice.style.transition = 'opacity 1s ease-out';
                dice.style.opacity = '0';
            }
        });
        
        return new Promise(resolve => {
            const timeout = setTimeout(() => {
                this.currentDice.forEach(dice => {
                    if (dice && dice.parentNode) {
                        dice.parentNode.removeChild(dice);
                    }
                });
                this.currentDice = [];
                resolve();
            }, 1000);
            this.rollTimeouts.push(timeout);
        });
    }

    reset() {
        this.clearDice();
        this.previousColors = [];
    }
}
