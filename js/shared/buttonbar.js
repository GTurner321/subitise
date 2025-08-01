/**
 * Universal Button Bar System
 * Handles responsive button layout across all games and coordinates with game areas
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
     * Create button bar
     * @param {number} n - Number of buttons
     * @param {number} x - Button width as % of button panel width
     * @param {number} y - Button height as % of button panel width
     * @param {Array} colors - Array of button colors
     * @param {Array} numbers - Array of button numbers/labels
     * @param {Function} clickHandler - Function to handle button clicks
     */
    create(n, x, y, colors = [], numbers = [], clickHandler = null) {
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
        
        console.log('ButtonBar created:', {
            n, x, y,
            dimensions: this.dimensions
        });
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
        
        // Base container styles - FULL WIDTH background with proper spacing
        // Total height: 3vh (bottom) + button height + 2vh (top)
        const buttonHeightVw = (this.config.y * this.dimensions.buttonPanelWidth) / 100;
        
        container.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100vw;
            height: calc(${buttonHeightVw}vw + 5vh);
            background: #f5f5f5;
            display: flex;
            align-items: flex-end;
            justify-content: flex-start;
            padding: 0;
            margin: 0;
            z-index: 100;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        `;
        
        // Add loaded class after brief delay for animations
        setTimeout(() => {
            container.classList.add('loaded');
            container.style.opacity = '1';
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
            
            // Set button color
            const buttonColor = this.config.colors[i] || defaultColors[i % defaultColors.length];
            
            // Calculate font size based on button dimensions - made even larger
            const fontSize = this.dimensions.buttonWidth / 2; // Changed from /4 to /2 for twice as large
            
            button.style.cssText = `
                position: absolute;
                width: ${this.dimensions.buttonWidth}px;
                height: ${this.dimensions.buttonHeight}px;
                bottom: 3vh;
                font-size: ${fontSize}px;
                font-weight: bold;
                color: white;
                background-color: ${buttonColor};
                border: none;
                border-radius: 18px;
                cursor: pointer;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                touch-action: manipulation;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                user-select: none;
                pointer-events: auto;
                outline: none;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.3s ease;
                --btn-color: ${buttonColor};
            `;
            
            // Add event listeners
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
            
            // Add hover effects
            button.addEventListener('mouseenter', () => {
                if (!button.classList.contains('disabled')) {
                    button.style.transform = 'translateY(-2px)';
                    button.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
                }
            });
            
            button.addEventListener('mouseleave', () => {
                if (!button.classList.contains('disabled')) {
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }
            });
            
            this.container.appendChild(button);
            this.buttons.push(button);
        }
    }
    
    positionButtons() {
        this.buttons.forEach((button, index) => {
            // Calculate left position for this button - ADD outside margin offset
            // Use buttonSpacing (button width + actual gap) between buttons
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
        if (this.container && this.config.n > 0) {
            // Recalculate and reposition
            this.calculateDimensions();
            this.styleContainer();
            
            // Update button positions and sizes
            this.buttons.forEach((button, index) => {
                const fontSize = this.dimensions.buttonWidth / 2; // Changed from /4 to /2 for twice as large
                // ADD outside margin offset for resize
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
        }
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
        
        // Calculate cross size as 60% of button width
        const buttonWidth = parseFloat(buttonElement.style.width) || this.dimensions.buttonWidth;
        const crossSize = buttonWidth * 0.6;
        const crossThickness = crossSize * 0.133; // Maintain proportions (8px / 60px = 0.133)
        
        const crossOverlay = document.createElement('div');
        crossOverlay.className = 'cross-overlay';
        crossOverlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${crossSize}px;
            height: ${crossSize}px;
            pointer-events: none;
            z-index: 10;
            animation: crossAppear 0.3s ease-out;
        `;
        
        // Create the cross lines as pseudo-elements via CSS custom properties
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
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.style.pointerEvents = 'auto';
            } else {
                button.classList.add('disabled');
                button.style.opacity = '0.6';
                button.style.cursor = 'not-allowed';
                button.style.pointerEvents = 'none';
            }
        });
    }
    
    /**
     * Mark a button as used
     */
    markButtonAsUsed(buttonElement) {
        if (!buttonElement) return;
        
        buttonElement.classList.add('used');
        buttonElement.style.opacity = '0.6';
        buttonElement.style.filter = 'brightness(0.7)';
        buttonElement.style.cursor = 'not-allowed';
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
    }
}

// Create global instance
window.ButtonBar = new ButtonBar();
