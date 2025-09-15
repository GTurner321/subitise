/**
 * Universal Button Bar System
 * Handles responsive button layout across all games and coordinates with game areas
 * Enhanced with game-area-only mode for games that don't need buttons
 * Styles managed through CSS classes for better separation of concerns
 */
class ButtonBar {
    constructor() {
        this.container = null;
        this.buttons = [];
        this.config = {
            n: 0,           // number of buttons
            x: 0,           // button width as % of button panel width
            y: 0,           // button height as % of button panel width
            colors: [],     // button colors
            numbers: []     // button numbers/labels
        };
        this.dimensions = {
            screenWidth: 0,
            outsideMargin: 0,
            buttonPanelWidth: 0,
            buttonWidth: 0,
            buttonHeight: 0,
            buttonGap: 0,
            insideMargin: 0,
            totalHeight: 0  // Total height of button bar including padding
        };
        
        // Game area coordination
        this.gameAreaElement = null;
        this.observers = []; // For notifying observers of dimension changes
        this.isGameAreaOnlyMode = false; // Track which mode we're in
        
        // Bind resize handler
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
    }
    
    /**
     * Register an observer to be notified of dimension changes
     * @param {Function} callback - Function to call with dimension updates
     */
    addObserver(callback) {
        this.observers.push(callback);
    }
    
    /**
     * Remove an observer
     * @param {Function} callback - Function to remove
     */
    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }
    
    /**
     * Notify all observers of dimension changes
     */
    notifyObservers() {
        const dimensionData = {
            ...this.dimensions,
            buttonBarHeight: this.dimensions.totalHeight
        };
        
        this.observers.forEach(callback => {
            try {
                callback(dimensionData);
            } catch (error) {
                console.warn('ButtonBar observer error:', error);
            }
        });
    }
    
    /**
     * Get current outside margin percentage
     */
    getOutsideMarginPercent() {
        return this.dimensions.outsideMargin;
    }
    
    /**
     * Create game area with margins but no buttons
     * @param {Object} options - Configuration options
     * @param {boolean} options.useMargins - Whether to apply responsive margins (default: true)
     * @param {number} options.marginOverride - Override margin percentage (optional)
     */
    createGameAreaOnly(options = {}) {
        const { useMargins = true, marginOverride = null } = options;
        
        console.log('Creating game area only with options:', options);
        
        // Set mode flag
        this.isGameAreaOnlyMode = true;
        
        // Find or create container (but don't use it for buttons)
        this.container = document.querySelector('.number-buttons');
        if (!this.container) {
            console.error('Button bar container (.number-buttons) not found');
            return;
        }
        
        // Find game area for coordination
        this.gameAreaElement = document.querySelector('.game-area');
        
        // Clear any existing content
        this.container.innerHTML = '';
        this.buttons = [];
        
        // Set config for margin calculations
        this.config = { n: 0, x: 0, y: 0, colors: [], numbers: [] };
        
        // Calculate dimensions (mainly for margins)
        this.calculateDimensionsForGameArea(useMargins, marginOverride);
        
        // Hide the container completely
        this.hideButtonContainer();
        
        // Apply margins to game area (if requested)
        if (useMargins) {
            this.updateGameAreaMargins();
        }
        
        // Notify observers for Rainbow compatibility
        this.notifyObservers();
        
        // IMPORTANT: Reinitialize rainbow after game area has proper dimensions
        setTimeout(() => {
            this.reinitializeRainbow();
        }, 300); // Wait for game area dimensions to settle
        
        console.log('Game area setup complete with margins:', useMargins);
    }
    
    /**
     * Calculate dimensions specifically for game area setup
     */
    calculateDimensionsForGameArea(useMargins, marginOverride) {
        const screenWidth = window.innerWidth;
        this.dimensions.screenWidth = screenWidth;
        
        if (useMargins) {
            // Use override or calculate margins as normal
            if (marginOverride !== null) {
                this.dimensions.outsideMargin = marginOverride;
            } else {
                // Standard margin calculation
                if (screenWidth <= 768) {
                    this.dimensions.outsideMargin = 0;
                } else if (screenWidth <= 1024) {
                    const progress = (screenWidth - 768) / (1024 - 768);
                    this.dimensions.outsideMargin = progress * 14; // 0% to 14% of viewport width
                } else {
                    this.dimensions.outsideMargin = 14;
                }
            }
        } else {
            this.dimensions.outsideMargin = 0;
        }
        
        // Calculate button panel width (for observer notifications)
        this.dimensions.buttonPanelWidth = 100 - (2 * this.dimensions.outsideMargin);
        
        // Set other dimensions to 0 since no buttons
        this.dimensions.buttonWidth = 0;
        this.dimensions.buttonHeight = 0;
        this.dimensions.actualGap = 0;
        this.dimensions.buttonSpacing = 0;
        this.dimensions.insideMargin = 0;
        this.dimensions.totalHeight = '0px'; // No button bar height
        
        console.log('Game area dimensions calculated:', {
            outsideMargin: this.dimensions.outsideMargin,
            buttonPanelWidth: this.dimensions.buttonPanelWidth,
            useMargins
        });
    }
    
    /**
     * Hide the button container completely
     */
    hideButtonContainer() {
        if (this.container) {
            this.container.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100vw;
                height: 0;
                background: transparent;
                display: none;
                z-index: 100;
                opacity: 0;
                pointer-events: none;
            `;
        }
    }
    
    /**
     * Create button bar
     * @param {number} n - Number of buttons
     * @param {number} x - Button width as % of button panel width
     * @param {number} y - Button height as % of button panel width
     * @param {Array} colors - Array of button colors
     * @param {Array} numbers - Array of button numbers/labels
     * @param {Function} clickHandler - Function to handle button clicks
     */
    create(n, x, y, colors = [], numbers = [], clickHandler = null) {
        // Set mode flag
        this.isGameAreaOnlyMode = false;
        
        this.config = { n, x, y, colors, numbers };
        this.clickHandler = clickHandler;
        
        // Find or create container
        this.container = document.querySelector('.number-buttons');
        if (!this.container) {
            console.error('Button bar container (.number-buttons) not found');
            return;
        }
        
        // Find game area for coordination
        this.gameAreaElement = document.querySelector('.game-area');
        
        // Clear existing buttons
        this.container.innerHTML = '';
        this.buttons = [];
        
        // Calculate dimensions
        this.calculateDimensions();
        
        // Style container
        this.styleContainer();
        
        // Create buttons
        this.createButtons();
        
        // Apply positioning
        this.positionButtons();
        
        // Update game area spacing
        this.updateGameAreaSpacing();
        
        // Apply outside margins to game area
        this.updateGameAreaMargins();
        
        // Notify observers
        this.notifyObservers();
        
        // IMPORTANT: Reinitialize rainbow after game area has proper dimensions
        setTimeout(() => {
            this.reinitializeRainbow();
        }, 300); // Wait for game area dimensions to settle
        
        console.log('ButtonBar created:', {
            n, x, y,
            dimensions: this.dimensions
        });
    }

/**
 * FIXED: Reinitialize rainbow after game area has proper dimensions
 * Now supports multiple games including addition game
 */
reinitializeRainbow() {
    console.log('🌈 Reinitializing rainbow for all supported games');
    
    // Method 1: Direct rainbow instance (preferred)
    if (window.rainbow && typeof window.rainbow.initializeArcs === 'function') {
        console.log('✅ Reinitializing direct rainbow instance');
        window.rainbow.initializeArcs();
        return;
    }
    
    // Method 2: Game controller instances - UPDATED to include addGame
    const gameControllers = [
        { name: 'drawGame', instance: window.drawGame },
        { name: 'subitGame', instance: window.subitGame },
        { name: 'addGame', instance: window.addGame },
        { name: 'twodiceGame', instance: window.twodiceGame },
        { name: 'plusoneGame', instance: window.plusoneGame },
        { name: 'raisinGame', instance: window.raisinGame },
        { name: 'sliderRandomGame', instance: window.sliderRandomGame }
    ];
    
    let rainbowFound = false;
    
    gameControllers.forEach(({ name, instance }) => {
        if (instance && instance.rainbow && typeof instance.rainbow.initializeArcs === 'function') {
            console.log(`✅ Reinitializing rainbow via ${name} controller`);
            instance.rainbow.initializeArcs();
            rainbowFound = true;
        }
    });
    
    // Method 3: Rainbow class constructor (fallback)
    if (!rainbowFound && window.Rainbow && typeof window.Rainbow === 'function') {
        console.log('⚠️ No existing rainbow found, attempting to create new instance');
        try {
            if (!window.rainbow) {
                window.rainbow = new window.Rainbow();
                console.log('✅ Created new rainbow instance');
            }
        } catch (error) {
            console.error('❌ Failed to create rainbow instance:', error);
        }
    }
    
    if (!rainbowFound) {
        console.warn('⚠️ No rainbow instances found to reinitialize');
    }
}    
    
    calculateDimensions() {
        const screenWidth = window.innerWidth;
        this.dimensions.screenWidth = screenWidth;
        
        // Calculate outside margins based on screen width
        if (screenWidth <= 768) {
            this.dimensions.outsideMargin = 0;
        } else if (screenWidth <= 1024) {
            const progress = (screenWidth - 768) / (1024 - 768);
            this.dimensions.outsideMargin = progress * 14; // 0% to 14% of viewport width
        } else {
            this.dimensions.outsideMargin = 14;
        }
        
        // Calculate button panel width (in vw units)
        this.dimensions.buttonPanelWidth = 100 - (2 * this.dimensions.outsideMargin);
        
        // Convert button panel width to pixels for calculations
        const buttonPanelWidthPx = (this.dimensions.buttonPanelWidth / 100) * screenWidth;
        
        // Calculate button dimensions in pixels
        this.dimensions.buttonWidth = (this.config.x / 100) * buttonPanelWidthPx;
        this.dimensions.buttonHeight = (this.config.y / 100) * buttonPanelWidthPx;
        
        // Calculate actual gap size between buttons (1.5bpw visual gap)
        this.dimensions.actualGap = (1.5 / 100) * buttonPanelWidthPx;
        
        // Calculate spacing between button left edges (button width + gap)
        this.dimensions.buttonSpacing = this.dimensions.buttonWidth + this.dimensions.actualGap;
        
        // Calculate inside margins
        const totalButtonWidth = this.config.n * this.dimensions.buttonWidth;
        const totalGapWidth = (this.config.n - 1) * this.dimensions.actualGap;
        const remainingWidth = buttonPanelWidthPx - totalButtonWidth - totalGapWidth;
        this.dimensions.insideMargin = remainingWidth / 2;
        
        // Calculate total button bar height (button height + 5vh total padding)
        const buttonHeightVw = (this.config.y * this.dimensions.buttonPanelWidth) / 100;
        this.dimensions.totalHeight = `calc(${buttonHeightVw}vw + 5vh)`;
        
        console.log('Calculated dimensions:', {
            ...this.dimensions,
            actualGap: this.dimensions.actualGap,
            buttonSpacing: this.dimensions.buttonSpacing
        });
    }
    
    styleContainer() {
        const container = this.container;
        
        // Apply height via CSS custom property for dynamic height calculation
        const buttonHeightVw = (this.config.y * this.dimensions.buttonPanelWidth) / 100;
        container.style.setProperty('--button-bar-height', `calc(${buttonHeightVw}vw + 5vh)`);
        container.style.height = `calc(${buttonHeightVw}vw + 5vh)`;
        
        // Add loaded class after brief delay for animations
        setTimeout(() => {
            container.classList.add('loaded');
        }, 200);
    }
    
    createButtons() {
        const defaultColors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
            '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'
        ];
        
        for (let i = 0; i < this.config.n; i++) {
            const button = document.createElement('button');
            button.className = 'number-btn';
            
            // Set button content
            const buttonNumber = this.config.numbers[i] || (i + 1);
            button.dataset.number = buttonNumber;
            button.textContent = buttonNumber;
            
            // Set button color and CSS variables
            const buttonColor = this.config.colors[i] || defaultColors[i % defaultColors.length];
            button.style.setProperty('--btn-color', buttonColor);
            button.style.backgroundColor = buttonColor;
            
            // Set dimensions and font size
            const fontSize = this.dimensions.buttonWidth / 2; // Large font size
            button.style.width = `${this.dimensions.buttonWidth}px`;
            button.style.height = `${this.dimensions.buttonHeight}px`;
            button.style.fontSize = `${fontSize}px`;
            
            // Add event listeners
            this.addButtonEventListeners(button);
            
            this.container.appendChild(button);
            this.buttons.push(button);
        }
    }
    
    addButtonEventListeners(button) {
        // Click and touch handlers
        if (this.clickHandler) {
            button.addEventListener('click', (e) => {
                const selectedNumber = parseInt(e.target.dataset.number);
                this.clickHandler(selectedNumber, e.target);
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                const selectedNumber = parseInt(e.target.dataset.number);
                this.clickHandler(selectedNumber, e.target);
            });
        }
    }
    
    positionButtons() {
        this.buttons.forEach((button, index) => {
            // Calculate left position for this button with outside margin offset
            const leftPosition = this.dimensions.outsideMargin * (window.innerWidth / 100) + 
                this.dimensions.insideMargin + 
                (index * this.dimensions.buttonSpacing);
            
            button.style.left = `${leftPosition}px`;
            
            // Stagger the fade-in animation
            setTimeout(() => {
                button.classList.add('fade-in');
                button.style.opacity = '1';
                button.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }
    
    updateGameAreaSpacing() {
        if (!this.gameAreaElement) return;
        
        // Update game area bottom margin to account for button bar
        const buttonHeightVw = (this.config.y * this.dimensions.buttonPanelWidth) / 100;
        this.gameAreaElement.style.marginBottom = `calc(${buttonHeightVw}vw + 5vh)`;
    }
    
    updateGameAreaMargins() {
        if (!this.gameAreaElement) return;
        
        // Apply responsive outside margins to game area
        const outsideMarginVw = this.dimensions.outsideMargin;
        this.gameAreaElement.style.marginLeft = `${outsideMarginVw}vw`;
        this.gameAreaElement.style.marginRight = `${outsideMarginVw}vw`;
        this.gameAreaElement.style.width = `${this.dimensions.buttonPanelWidth}vw`;
    }
    
    handleResize() {
        if (this.container) {
            // Check if we're in game-area-only mode (no buttons)
            if (this.isGameAreaOnlyMode || this.config.n === 0) {
                // Recalculate for game area only mode
                const useMargins = this.dimensions.outsideMargin > 0 || this.dimensions.buttonPanelWidth < 100;
                this.calculateDimensionsForGameArea(useMargins);
                
                // Update game area margins if applicable
                if (useMargins) {
                    this.updateGameAreaMargins();
                }
                
                // Notify observers
                this.notifyObservers();
                
                // Reinitialize rainbow on resize
                setTimeout(() => {
                    this.reinitializeRainbow();
                }, 100);
            } else if (this.config.n > 0) {
                // Normal button mode resize handling
                this.calculateDimensions();
                this.styleContainer();
                
                // Update button positions and sizes
                this.buttons.forEach((button, index) => {
                    const fontSize = this.dimensions.buttonWidth / 2;
                    const leftPosition = this.dimensions.outsideMargin * (window.innerWidth / 100) + 
                        this.dimensions.insideMargin + 
                        (index * this.dimensions.buttonSpacing);
                    
                    button.style.width = `${this.dimensions.buttonWidth}px`;
                    button.style.height = `${this.dimensions.buttonHeight}px`;
                    button.style.fontSize = `${fontSize}px`;
                    button.style.left = `${leftPosition}px`;
                });
                
                // Update game area spacing and margins
                this.updateGameAreaSpacing();
                this.updateGameAreaMargins();
                
                // Notify observers of dimension changes
                this.notifyObservers();
                
                // Reinitialize rainbow on resize as well
                setTimeout(() => {
                    this.reinitializeRainbow();
                }, 100);
            }
        }
    }
    
    /**
     * Show correct answer feedback (works for both clicks and keyboard input)
     * @param {number} selectedNumber - The number that was selected
     * @param {HTMLElement} buttonElement - The button element (can be null for keyboard)
     */
    showCorrectFeedback(selectedNumber, buttonElement) {
        // Find the button element if not provided (for keyboard input)
        if (!buttonElement) {
            buttonElement = this.findButtonByNumber(selectedNumber);
        }
        
        if (buttonElement) {
            // Flash green animation
            this.animateButton(buttonElement, 'correct');
            
            // Create celebration stars
            this.createCelebrationStars(buttonElement);
        }
    }

    /**
     * Show incorrect answer feedback (works for both clicks and keyboard input)  
     * @param {number} selectedNumber - The number that was selected
     * @param {HTMLElement} buttonElement - The button element (can be null for keyboard)
     */
    showIncorrectFeedback(selectedNumber, buttonElement) {
        // Find the button element if not provided (for keyboard input)
        if (!buttonElement) {
            buttonElement = this.findButtonByNumber(selectedNumber);
        }
        
        if (buttonElement) {
            // Flash red animation
            this.animateButton(buttonElement, 'incorrect');
            
            // Add cross overlay
            const crossOverlay = this.addCrossOverlay(buttonElement);
            
            // Mark as attempted
            buttonElement.dataset.attempted = 'true';
            
            // Fade other buttons
            this.fadeOtherButtons(buttonElement);
            
            // Restore after delay
            setTimeout(() => {
                this.fadeInAllButtons();
                
                // Fade out cross
                if (crossOverlay && crossOverlay.parentNode) {
                    crossOverlay.style.transition = 'opacity 700ms ease-out';
                    crossOverlay.style.opacity = '0';
                    
                    setTimeout(() => {
                        this.removeCrossOverlay(buttonElement);
                    }, 700);
                }
            }, 1300);
        }
    }

    /**
     * Find button element by number (for keyboard input)
     * @param {number} number - The button number to find
     * @returns {HTMLElement|null} The button element or null
     */
    findButtonByNumber(number) {
        if (!this.buttons) return null;
        
        return this.buttons.find(btn => 
            parseInt(btn.dataset.number) === number
        ) || null;
    }

    /**
     * Create celebration stars around a button
     * @param {HTMLElement} buttonElement - The button to create stars around
     */
    createCelebrationStars(buttonElement) {
        if (!buttonElement) return;
        
        const buttonRect = buttonElement.getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;
        
        const starCount = 5;
        const radius = 60;
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.innerHTML = '⭐';
            star.className = 'completion-star';
            star.style.fontSize = '20px';
            
            // Calculate position around the button
            const angle = (i / starCount) * 2 * Math.PI;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            star.style.left = x + 'px';
            star.style.top = y + 'px';
            star.style.animationDelay = (i * 0.1) + 's';
            
            document.body.appendChild(star);
            
            // Remove after animation
            setTimeout(() => {
                if (star.parentNode) {
                    star.parentNode.removeChild(star);
                }
            }, 1500 + (i * 100));
        }
    }

    /**
     * Fade out other buttons (keeping the selected one visible)
     * @param {HTMLElement} excludeButton - Button to keep visible
     */
    fadeOtherButtons(excludeButton) {
        if (!this.buttons) return;
        
        this.buttons.forEach(btn => {
            if (btn !== excludeButton) {
                btn.style.transition = 'opacity 700ms ease-in-out';
                btn.style.opacity = '0.1';
            }
        });
    }

    /**
     * Fade all buttons back in
     */
    fadeInAllButtons() {
        if (!this.buttons) return;
        
        this.buttons.forEach(btn => {
            btn.style.transition = 'opacity 700ms ease-in-out';
            btn.style.opacity = '1';
        });
        
        // Clean up transition styles
        setTimeout(() => {
            this.buttons.forEach(btn => {
                btn.style.transition = '';
            });
        }, 700);
    }
    
    /**
     * Add animation classes to buttons
     */
    animateButton(buttonElement, animationType) {
        if (!buttonElement) return;
        
        buttonElement.classList.add(animationType);
        
        const duration = animationType === 'correct' || animationType === 'incorrect' ? 800 : 500;
        setTimeout(() => {
            buttonElement.classList.remove(animationType);
        }, duration);
    }
    
    /**
     * Add responsive cross overlay to button
     */
    addCrossOverlay(buttonElement) {
        if (!buttonElement) return;
        
        // Calculate cross size as 60% of button height
        const crossSize = this.dimensions.buttonHeight * 0.6;
        const crossThickness = crossSize * 0.133; // Maintain proportions
        
        const crossOverlay = document.createElement('div');
        crossOverlay.className = 'cross-overlay';
        
        // Set CSS custom properties for cross dimensions
        crossOverlay.style.setProperty('--cross-size', `${crossSize}px`);
        crossOverlay.style.setProperty('--cross-thickness', `${crossThickness}px`);
        
        buttonElement.appendChild(crossOverlay);
        
        return crossOverlay;
    }
    
    /**
     * Remove cross overlay from button
     */
    removeCrossOverlay(buttonElement) {
        if (!buttonElement) return;
        
        const crossOverlay = buttonElement.querySelector('.cross-overlay');
        if (crossOverlay) {
            crossOverlay.remove();
        }
    }
    
    /**
     * Disable/enable all buttons
     */
    setButtonsEnabled(enabled) {
        this.buttons.forEach(button => {
            if (enabled) {
                button.classList.remove('disabled');
            } else {
                button.classList.add('disabled');
            }
        });
    }
    
    /**
     * Mark a button as used
     */
    markButtonAsUsed(buttonElement) {
        if (!buttonElement) return;
        
        buttonElement.classList.add('used');
    }
    
    /**
     * Shuffle button numbers (for games that need randomization)
     */
    shuffleNumbers(newNumbers) {
        this.config.numbers = [...newNumbers];
        this.buttons.forEach((button, index) => {
            button.dataset.number = this.config.numbers[index];
            button.textContent = this.config.numbers[index];
        });
    }
    
    /**
     * Destroy the button bar
     */
    destroy() {
        window.removeEventListener('resize', this.handleResize);
        
        // Reset game area styles
        if (this.gameAreaElement) {
            this.gameAreaElement.style.marginBottom = '';
            this.gameAreaElement.style.marginLeft = '';
            this.gameAreaElement.style.marginRight = '';
            this.gameAreaElement.style.width = '';
        }
        
        // Clear observers
        this.observers = [];
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.buttons = [];
        
        // Reset mode flag
        this.isGameAreaOnlyMode = false;
    }
}

// Create global instance
window.ButtonBar = new ButtonBar();
