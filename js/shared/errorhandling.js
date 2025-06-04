class SharedErrorHandler {
    /**
     * Handles incorrect answer logic that's shared across all games
     * @param {HTMLElement} buttonElement - The button that was clicked incorrectly
     * @param {NodeList} numberButtons - All number buttons in the game
     * @param {Function} callback - Function to call when error handling is complete
     * @param {Object} config - Configuration options
     */
    static handleIncorrectAnswer(buttonElement, numberButtons, callback, config = {}) {
        // Default configuration
        const settings = {
            flashDuration: config.flashDuration || 800,
            disableTimeout: config.disableTimeout || 3000,
            fadeTransition: config.fadeTransition || 1000,
            ...config
        };

        // Flash red on the clicked button
        buttonElement.classList.add('incorrect');
        setTimeout(() => {
            buttonElement.classList.remove('incorrect');
        }, settings.flashDuration);

        // Add crimson cross overlay to the incorrect button
        const crossOverlay = document.createElement('div');
        crossOverlay.className = 'cross-overlay';
        buttonElement.appendChild(crossOverlay);

        // Mark that an attempt was made
        buttonElement.dataset.attempted = 'true';
        
        // Fade out all other buttons (not the clicked one)
        numberButtons.forEach(btn => {
            if (btn !== buttonElement) {
                btn.style.transition = `opacity ${settings.fadeTransition}ms ease-in-out`;
                btn.style.opacity = '0.1';
            }
        });

        // After the disable timeout, start fading back in
        setTimeout(() => {
            // Start fading back in
            numberButtons.forEach(btn => {
                if (btn !== buttonElement) {
                    btn.style.opacity = '1';
                }
            });
            
            // Start fading out the cross during the last part of transition
            if (crossOverlay && crossOverlay.parentNode) {
                crossOverlay.style.transition = `opacity ${settings.fadeTransition}ms ease-out`;
                crossOverlay.style.opacity = '0';
            }
            
            // Re-enable buttons and clean up after fade completes
            setTimeout(() => {
                // Remove the cross overlay
                if (crossOverlay && crossOverlay.parentNode) {
                    crossOverlay.parentNode.removeChild(crossOverlay);
                }
                
                // Clean up transition styles
                numberButtons.forEach(btn => {
                    btn.style.transition = '';
                });
                
                // Call the callback to re-enable game functionality
                if (callback) {
                    callback();
                }
            }, settings.fadeTransition);
        }, settings.disableTimeout);
    }

    /**
     * Reset button states - utility function for games
     * @param {NodeList} numberButtons - All number buttons in the game
     */
    static resetButtonStates(numberButtons) {
        numberButtons.forEach(btn => {
            btn.dataset.attempted = 'false';
            btn.classList.remove('correct', 'incorrect');
            btn.style.opacity = '1';
            btn.style.transition = '';
            
            // Remove any existing cross overlays
            const crossOverlay = btn.querySelector('.cross-overlay');
            if (crossOverlay) {
                crossOverlay.remove();
            }
        });
    }

    /**
     * Check if any answer has been attempted
     * @param {NodeList} numberButtons - All number buttons in the game
     * @returns {boolean} - True if any button has been attempted
     */
    static hasAttemptedAnswer(numberButtons) {
        return Array.from(numberButtons).some(btn => 
            btn.dataset.attempted === 'true'
        );
    }
}
