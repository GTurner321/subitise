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
        
        this.bearImage = '/subitise/assets/bear.png';
    }

    startCelebration() {
        console.log('Bear celebration started!');
        if (this.isActive) {
            this.stopCelebration(); // Clean up any existing celebration
        }
        
        this.isActive = true;
        this.bearCount = 0;
        
        // First bear - right side of modal (after 3 seconds)
        const firstTimeout = setTimeout(() => {
            if (this.isActive) {
                this.addBear('right', this.initialSize);
            }
        }, this.initialDelay);
        this.timeouts.push(firstTimeout);
        
        // Second bear - left side of modal (after another 3 seconds)
        const secondTimeout = setTimeout(() => {
            if (this.isActive) {
                this.addBear('left', this.initialSize);
            }
        }, this.initialDelay + this.secondBearDelay);
        this.timeouts.push(secondTimeout);
        
        // Third bear - random position (after another 2 seconds)
        const thirdTimeout = setTimeout(() => {
            if (this.isActive) {
                this.addBear('random', this.initialSize + this.sizeIncrement);
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
            this.addBear('random', currentSize);
            
            // Schedule next bear (continue until manually stopped)
            const nextTimeout = setTimeout(spawnNextBear, this.finalDelay);
            this.timeouts.push(nextTimeout);
        };
        
        const continuousTimeout = setTimeout(spawnNextBear, this.finalDelay);
        this.timeouts.push(continuousTimeout);
    }

    addBear(position, sizePercent) {
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
        
        // Set z-index (behind modal but in front of game elements)
        bear.style.zIndex = '999';
        
        // Set position
        this.positionBear(bear, position, bearSize);
        
        // Add random rotation for bears after the first two
        if (this.bearCount >= 2) {
            const rotation = this.getRandomRotation();
            bear.style.transform += ` rotate(${rotation}deg)`;
        }
        
        // Add entrance animation
        bear.style.opacity = '0';
        bear.style.transform += ' scale(0.1)';
        bear.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
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
            // Random position anywhere on screen
            const maxX = window.innerWidth;
            const maxY = window.innerHeight;
            
            // Allow bears to partially go off screen
            const x = Math.random() * (maxX + bearSize) - (bearSize / 2);
            const y = Math.random() * (maxY + bearSize) - (bearSize / 2);
            
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
