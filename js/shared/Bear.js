// Simple Bear.js for testing
console.log('Bear.js loaded successfully');

class Bear {
    constructor() {
        console.log('Bear constructor called');
        this.bears = [];
        this.bearCount = 0;
        this.isActive = false;
        this.timeouts = [];
        
        // Bear animation settings
        this.initialDelay = 3000; // 3 seconds after modal opens
        this.secondBearDelay = 3000; // 3 seconds after first bear
        this.subsequentDelay = 2000; // 2 seconds for third bear
        this.finalDelay = 1000; // 1 second for remaining bears
        this.initialSize = 30; // 30% of screen height
        this.sizeIncrement = 5; // 5% increase each time
        
        // Auto-stop timer
        this.maxDuration = 60000; // 1 minute in milliseconds
        this.autoStopTimeout = null;
        
        this.bearImage = '/subitise/assets/bear.png';
    }

    startCelebration() {
        console.log('Bear celebration started!');
        if (this.isActive) {
            this.stopCelebration(); // Clean up any existing celebration
        }
        
        this.isActive = true;
        this.bearCount = 0;
        
        // Set up auto-stop timer (1 minute)
        this.autoStopTimeout = setTimeout(() => {
            console.log('Auto-stopping bear celebration after 1 minute');
            this.stopCelebration();
        }, this.maxDuration);
        
        // First bear - right side of modal (after 3 seconds)
        const firstTimeout = setTimeout(() => {
            if (this.isActive) {
                this.addBear('right', this.initialSize, 8); // 8 degrees clockwise
            }
        }, this.initialDelay);
        this.timeouts.push(firstTimeout);
        
        // Second bear - left side of modal (after another 3 seconds)
        const secondTimeout = setTimeout(() => {
            if (this.isActive) {
                this.addBear('left', this.initialSize, -8, true); // 8 degrees anticlockwise, reflected horizontally
            }
        }, this.initialDelay + this.secondBearDelay);
        this.timeouts.push(secondTimeout);
        
        // Third bear - random position (after another 2 seconds)
        const thirdTimeout = setTimeout(() => {
            if (this.isActive) {
                this.addBear('random', this.initialSize + this.sizeIncrement, 0, false); // No specific rotation/reflection
                this.startContinuousSpawning();
            }
        }, this.initialDelay + this.secondBearDelay + this.subsequentDelay);
        this.timeouts.push(thirdTimeout);
    }

    startContinuousSpawning() {
        // Continue spawning bears every 1 second with increasing size
        const spawnNextBear = () => {
            if (!this.isActive) return;
            
            const currentSize = this.initialSize + (this.bearCount * this.sizeIncrement);
            // Determine if this bear should be mirrored (even numbered bears: 4th, 6th, 8th, etc.)
            const shouldMirror = (this.bearCount + 1) % 2 === 0; // bearCount is 0-indexed, so +1 gives actual bear number
            this.addBear('random', currentSize, 0, shouldMirror);
            
            // Schedule next bear (continue until manually stopped)
            const nextTimeout = setTimeout(spawnNextBear, this.finalDelay);
            this.timeouts.push(nextTimeout);
        };
        
        const continuousTimeout = setTimeout(spawnNextBear, this.finalDelay);
        this.timeouts.push(continuousTimeout);
    }

    addBear(position, sizePercent, rotation = 0, reflected = false) {
        console.log(`Adding bear #${this.bearCount + 1} at ${position}, size: ${sizePercent}%`);
        
        const bear = document.createElement('img');
        bear.src = this.bearImage;
        bear.className = 'celebration-bear';
        bear.alt = 'Celebration Bear';
        
        // Set size based on screen height
        const screenHeight = window.innerHeight;
        const bearSize = (screenHeight * sizePercent) / 100;
        bear.style.width = `${bearSize}px`;
        bear.style.height = `${bearSize}px`;
        
        // Set z-index (behind modal buttons but in front of game elements)
        bear.style.zIndex = '999';
        
        // Set position - now position first, then apply transforms
        this.positionBear(bear, position, bearSize);
        
        // Build transform string
        let transformString = '';
        
        // Add horizontal reflection if needed (left-right flip)
        if (reflected) {
            transformString += ' scaleX(-1)'; // Changed from scaleY(-1) to scaleX(-1)
        }
        
        // Add rotation
        if (rotation !== 0) {
            transformString += ` rotate(${rotation}deg)`;
        }
        
        // Add random rotation for bears after the first two (if no specific rotation given)
        if (this.bearCount >= 2 && rotation === 0) {
            const randomRotation = this.getRandomRotation();
            transformString += ` rotate(${randomRotation}deg)`;
        }
        
        // Set initial transform for entrance animation
        bear.style.opacity = '0';
        bear.style.transformOrigin = 'center center'; // Ensure rotation happens from center
        bear.style.transform = 'scale(0.1)' + transformString;
        bear.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'; // Changed to 0.3s
        
        // Add to DOM
        document.body.appendChild(bear);
        this.bears.push(bear);
        
        // Trigger entrance animation
        setTimeout(() => {
            bear.style.opacity = '1';
            bear.style.transform = bear.style.transform.replace('scale(0.1)', 'scale(1)');
        }, 50);
        
        this.bearCount++;
    }

    positionBear(bear, position, bearSize) {
        bear.style.position = 'fixed';
        
        if (position === 'right') {
            // Position to the right of the modal
            const modalCenter = window.innerWidth / 2;
            const modalWidth = 400; // Approximate modal width
            bear.style.left = `${modalCenter + (modalWidth / 2) + 50}px`;
            bear.style.top = '50%';
            bear.style.transform = 'translateY(-50%)';
        } else if (position === 'left') {
            // Position to the left of the modal
            const modalCenter = window.innerWidth / 2;
            const modalWidth = 400; // Approximate modal width
            bear.style.right = `${modalCenter + (modalWidth / 2) + 50}px`;
            bear.style.top = '50%';
            bear.style.transform = 'translateY(-50%)';
        } else {
            // Random position anywhere on visible screen
            const maxX = window.innerWidth - bearSize; // Keep within screen bounds
            const maxY = window.innerHeight - bearSize; // Keep within screen bounds
            
            // Ensure bears stay mostly on screen but can partially go off
            const x = Math.random() * (maxX + bearSize * 0.5) - (bearSize * 0.25);
            const y = Math.random() * (maxY + bearSize * 0.5) - (bearSize * 0.25);
            
            bear.style.left = `${x}px`;
            bear.style.top = `${y}px`;
        }
    }

    getRandomRotation() {
        // Random rotation between -10 and 10 degrees
        const minRotation = -10;
        const maxRotation = 10;
        return Math.random() * (maxRotation - minRotation) + minRotation;
    }

    stopCelebration() {
        console.log('Stopping bear celebration');
        this.isActive = false;
        
        // Clear auto-stop timeout
        if (this.autoStopTimeout) {
            clearTimeout(this.autoStopTimeout);
            this.autoStopTimeout = null;
        }
        
        // Clear all timeouts
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts = [];
        
        // Remove all bears with fade out animation
        this.bears.forEach(bear => {
            if (bear.parentNode) {
                bear.style.transition = 'all 0.5s ease-out';
                bear.style.opacity = '0';
                bear.style.transform += ' scale(0.8)';
                
                setTimeout(() => {
                    if (bear.parentNode) {
                        bear.parentNode.removeChild(bear);
                    }
                }, 500);
            }
        });
        
        this.bears = [];
        this.bearCount = 0;
    }

    reset() {
        this.stopCelebration();
    }
}

// Add CSS if it doesn't exist
if (!document.querySelector('#bear-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'bear-styles';
    styleSheet.textContent = `
        .celebration-bear {
            pointer-events: none;
            user-select: none;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            object-fit: contain;
        }
    `;
    document.head.appendChild(styleSheet);
}

console.log('Bear.js fully loaded and ready!');
