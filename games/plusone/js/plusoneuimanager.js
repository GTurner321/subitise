class PlusOneUIManager {
    constructor(controller) {
        this.controller = controller;
        
        // Inactivity and visibility tracking
        this.inactivityTimer = null;
        this.hintGiven = false;
        this.isTabVisible = true;
        
        // Flashing intervals
        this.flashingInterval = null;
        this.flashingTimeout = null;
        
        console.log('🎭 UI Manager initialized');
    }

    // ===== AUDIO SYSTEM =====
    
    speakText(text, options = {}) {
        if (window.AudioSystem) {
            window.AudioSystem.speakText(text, options);
        }
    }

    playCompletionSound() {
        if (window.AudioSystem) {
            window.AudioSystem.playCompletionSound();
        }
    }

    playFailureSound() {
        if (window.AudioSystem) {
            window.AudioSystem.playFailureSound();
        }
    }

    // ===== VISIBILITY HANDLING =====
    
    handleVisibilityChange(isVisible) {
        this.isTabVisible = isVisible;
        
        if (!this.isTabVisible) {
            this.clearInactivityTimer();
            if (window.AudioSystem) {
                window.AudioSystem.stopAllAudio();
            }
        } else {
            if (!this.controller.gameComplete && !this.controller.buttonsDisabled && this.controller.initializationComplete) {
                this.startInactivityTimer();
            }
        }
    }

    // ===== INACTIVITY AND HINT SYSTEM =====
    
    startInactivityTimer() {
        if (!this.isTabVisible || this.hintGiven || !this.controller.initializationComplete) {
            return;
        }
        
        this.clearInactivityTimer();
        this.inactivityTimer = setTimeout(() => {
            this.giveInactivityHint();
        }, CONFIG.INACTIVITY_DURATION);
    }

    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    giveInactivityHint() {
        if (this.controller.buttonsDisabled || this.controller.gameComplete || !this.isTabVisible || !this.controller.initializationComplete) return;
        
        this.hintGiven = true;
        const audioConfig = this.controller.getCurrentAudio();
        
        let hintText = '';
        if (this.controller.shouldUsePictureFormat()) {
            if (!this.controller.leftFilled) {
                hintText = audioConfig.HINTS.COUNT_LEFT;
            } else if (!this.controller.rightFilled) {
                hintText = audioConfig.HINTS.COUNT_RIGHT;
            } else if (!this.controller.totalFilled) {
                if (this.controller.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
                    hintText = audioConfig.HINTS.WHAT_IS_MINUS_ONE(this.controller.currentNumber);
                } else if (this.controller.gameMode === CONFIG.GAME_MODES.PLUS_TWO) {
                    hintText = audioConfig.HINTS.WHAT_IS_PLUS_TWO(this.controller.currentNumber);
                } else {
                    hintText = audioConfig.HINTS.WHAT_IS_PLUS_ONE(this.controller.currentNumber);
                }
            }
        } else {
            if (!this.controller.totalFilled) {
                if (this.controller.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
                    hintText = audioConfig.NUMBER_HINTS.WHAT_COMES_BEFORE(this.controller.currentNumber);
                } else if (this.controller.gameMode === CONFIG.GAME_MODES.PLUS_TWO) {
                    hintText = audioConfig.NUMBER_HINTS.WHAT_COMES_AFTER_TWO(this.controller.currentNumber);
                } else {
                    hintText = audioConfig.NUMBER_HINTS.WHAT_COMES_AFTER(this.controller.currentNumber);
                }
            }
        }
        
        if (hintText) {
            this.speakText(hintText);
        }
    }

    // ===== FLASHING SYSTEM =====
    
    showInputBoxes() {
        if (!this.controller.leftFilled) {
            this.controller.leftInputBox.classList.add('flashing');
        } else if (!this.controller.rightFilled) {
            this.controller.rightInputBox.classList.add('flashing');
        } else if (!this.controller.totalFilled) {
            this.controller.totalInputBox.classList.add('flashing');
        }
        this.startFlashing();
    }

    updateFlashingBoxes() {
        this.controller.leftInputBox.classList.remove('flashing');
        this.controller.rightInputBox.classList.remove('flashing');
        this.controller.totalInputBox.classList.remove('flashing');
        
        if (!this.controller.leftFilled) {
            this.controller.leftInputBox.classList.add('flashing');
        } else if (!this.controller.rightFilled) {
            this.controller.rightInputBox.classList.add('flashing');
        } else if (!this.controller.totalFilled) {
            this.controller.totalInputBox.classList.add('flashing');
        }
        
        this.startFlashing();
    }

    startFlashing() {
        this.stopFlashing();
        
        const flashElements = () => {
            if (this.controller.shouldUsePictureFormat()) {
                if (!this.controller.leftFilled) {
                    if (this.controller.leftPulseArea) this.controller.leftPulseArea.classList.add('area-flash');
                    if (this.controller.leftInputBox) this.controller.leftInputBox.classList.add('box-flash');
                } else if (!this.controller.rightFilled) {
                    if (this.controller.rightPulseArea) this.controller.rightPulseArea.classList.add('area-flash');
                    if (this.controller.rightInputBox) this.controller.rightInputBox.classList.add('box-flash');
                } else if (!this.controller.totalFilled) {
                    if (this.controller.leftPulseArea) this.controller.leftPulseArea.classList.add('area-flash');
                    if (this.controller.rightPulseArea) this.controller.rightPulseArea.classList.add('area-flash');
                    if (this.controller.totalInputBox) this.controller.totalInputBox.classList.add('box-flash');
                }
            } else {
                if (!this.controller.totalFilled) {
                    if (this.controller.leftPulseArea) this.controller.leftPulseArea.classList.add('area-flash');
                    if (this.controller.rightPulseArea) this.controller.rightPulseArea.classList.add('area-flash');
                    if (this.controller.totalInputBox) this.controller.totalInputBox.classList.add('box-flash');
                }
            }
            
            setTimeout(() => {
                if (this.controller.leftPulseArea) this.controller.leftPulseArea.classList.remove('area-flash');
                if (this.controller.rightPulseArea) this.controller.rightPulseArea.classList.remove('area-flash');
                if (this.controller.leftInputBox) this.controller.leftInputBox.classList.remove('box-flash');
                if (this.controller.rightInputBox) this.controller.rightInputBox.classList.remove('box-flash');
                if (this.controller.totalInputBox) this.controller.totalInputBox.classList.remove('box-flash');
            }, 1000);
        };
        
        this.flashingTimeout = setTimeout(() => {
            flashElements();
            this.flashingInterval = setInterval(flashElements, 5000);
        }, 5000);
    }

    stopFlashing() {
        if (this.flashingInterval) {
            clearInterval(this.flashingInterval);
            this.flashingInterval = null;
        }
        
        if (this.flashingTimeout) {
            clearTimeout(this.flashingTimeout);
            this.flashingTimeout = null;
        }
        
        if (this.controller.leftPulseArea) this.controller.leftPulseArea.classList.remove('area-flash');
        if (this.controller.rightPulseArea) this.controller.rightPulseArea.classList.remove('area-flash');
        if (this.controller.leftInputBox) this.controller.leftInputBox.classList.remove('box-flash');
        if (this.controller.rightInputBox) this.controller.rightInputBox.classList.remove('box-flash');
        if (this.controller.totalInputBox) this.controller.totalInputBox.classList.remove('box-flash');
    }

    // ===== TRANSITION ANIMATIONS =====
    
    fadeOutChangingElements() {
        // Only fade out content that changes, not persistent elements
        const currentContent = [...this.controller.contentRenderer.currentContent];
        currentContent.forEach(element => {
            if (element) {
                element.classList.add('fade-out');
            }
        });
        
        // Fade out buttons (they may change)
        const buttonContainer = document.querySelector('.number-buttons');
        if (buttonContainer) {
            buttonContainer.style.transition = 'opacity 0.6s ease';
            buttonContainer.style.opacity = '0.3';
        }
    }

    fadeInChangingElements() {
        // Fade in new content
        const newContent = [...this.controller.contentRenderer.currentContent];
        newContent.forEach(element => {
            if (element) {
                element.classList.remove('fade-out');
                element.classList.add('fade-in');
            }
        });
        
        // Fade in buttons
        const buttonContainer = document.querySelector('.number-buttons');
        if (buttonContainer) {
            buttonContainer.style.transition = 'opacity 0.8s ease';
            buttonContainer.style.opacity = '1';
        }
        
        setTimeout(() => {
            newContent.forEach(element => {
                if (element) {
                    element.classList.remove('fade-in');
                }
            });
        }, 800);
    }

    // ===== MODAL MANAGEMENT =====
    
    updateModalForCompletion() {
        const modalContent = this.controller.modal.querySelector('.modal-content');
        if (!modalContent) return;
        
        // Clear existing content
        modalContent.innerHTML = '';
        
        // Add title
        const title = document.createElement('h2');
        title.textContent = '🌈 Well Done! 🌈';
        modalContent.appendChild(title);
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            align-items: center;
            margin-top: 20px;
        `;
        
        // Play Again button (always first)
        const playAgainBtn = document.createElement('button');
        playAgainBtn.className = 'modal-btn primary-btn';
        playAgainBtn.innerHTML = '<i class="fas fa-redo-alt"></i> PLAY AGAIN';
        playAgainBtn.addEventListener('click', () => {
            this.controller.startNewGame();
        });
        
        // Create the other two game mode buttons based on current mode
        const { button1, button2 } = this.createGameModeButtons();
        
        buttonContainer.appendChild(playAgainBtn);
        buttonContainer.appendChild(button1);
        buttonContainer.appendChild(button2);
        modalContent.appendChild(buttonContainer);
        
        // Update styles for new buttons
        this.updateModalButtonStyles();
    }

    createGameModeButtons() {
        let button1, button2;
        
        if (this.controller.gameMode === CONFIG.GAME_MODES.PLUS_ONE) {
            // Currently Plus One - offer Minus One and Plus Two
            button1 = this.createModeButton('MINUS ONE', CONFIG.GAME_MODES.MINUS_ONE, 'fas fa-minus');
            button2 = this.createModeButton('PLUS TWO', CONFIG.GAME_MODES.PLUS_TWO, 'fas fa-plus');
        } else if (this.controller.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
            // Currently Minus One - offer Plus One and Plus Two
            button1 = this.createModeButton('PLUS ONE', CONFIG.GAME_MODES.PLUS_ONE, 'fas fa-plus');
            button2 = this.createModeButton('PLUS TWO', CONFIG.GAME_MODES.PLUS_TWO, 'fas fa-plus');
        } else {
            // Currently Plus Two - offer Plus One and Minus One
            button1 = this.createModeButton('PLUS ONE', CONFIG.GAME_MODES.PLUS_ONE, 'fas fa-plus');
            button2 = this.createModeButton('MINUS ONE', CONFIG.GAME_MODES.MINUS_ONE, 'fas fa-minus');
        }
        
        return { button1, button2 };
    }

    createModeButton(displayName, gameMode, iconClass) {
        const button = document.createElement('button');
        button.className = 'modal-btn secondary-btn';
        button.innerHTML = `<i class="${iconClass}"></i> ${displayName}`;
        button.addEventListener('click', () => {
            this.controller.switchGameMode(gameMode);
            this.controller.startNewGame();
        });
        return button;
    }

    updateModalButtonStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .modal-btn {
                border: none;
                padding: 15px 30px;
                font-size: 1.3rem;
                border-radius: 10px;
                cursor: pointer;
                font-weight: bold;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
                touch-action: manipulation;
                pointer-events: auto;
                outline: none;
                min-width: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            
            .modal-btn.primary-btn {
                background: #4caf50;
                color: white;
            }
            
            .modal-btn.secondary-btn {
                background: #2196F3;
                color: white;
            }
            
            .modal-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            }
            
            .modal-btn.primary-btn:hover {
                background: #45a049;
            }
            
            .modal-btn.secondary-btn:hover {
                background: #1976D2;
            }
            
            .modal-btn:focus {
                outline: none;
            }
            
            @media (max-width: 768px) {
                .modal-btn {
                    font-size: 1.1rem;
                    padding: 12px 24px;
                    min-width: 180px;
                }
            }
        `;
        
        // Remove existing style if present
        const existingStyle = document.head.querySelector('style[data-modal-buttons]');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        style.setAttribute('data-modal-buttons', 'true');
        document.head.appendChild(style);
    }

    // ===== CELEBRATION AND EFFECTS =====
    
    createCelebrationEffect(x, y) {
        // Create celebration stars at specified coordinates
        const starCount = 8;
        const radius = 80;
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.innerHTML = '⭐';
            star.className = 'completion-effect';
            star.style.cssText = `
                position: fixed;
                font-size: 24px;
                z-index: 1000;
                pointer-events: none;
                animation: starBurst 1.5s ease-out forwards;
                animation-delay: ${i * 0.1}s;
            `;
            
            // Calculate position around the center point
            const angle = (i / starCount) * 2 * Math.PI;
            const starX = x + Math.cos(angle) * radius;
            const starY = y + Math.sin(angle) * radius;
            
            star.style.left = starX + 'px';
            star.style.top = starY + 'px';
            
            document.body.appendChild(star);
            
            // Remove after animation
            setTimeout(() => {
                if (star.parentNode) {
                    star.parentNode.removeChild(star);
                }
            }, 1500 + (i * 100));
        }
    }

    showCompletionFeedback(element) {
        if (!element) return;
        
        // Add completion glow effect
        element.style.filter = 'drop-shadow(0 0 20px #4caf50)';
        element.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            element.style.filter = '';
            element.style.transform = '';
        }, 1000);
    }

    // ===== ENHANCED ERROR FEEDBACK =====
    
    showEnhancedErrorFeedback(buttonElement, selectedNumber) {
        if (!buttonElement) return;
        
        // Create error ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'error-ripple';
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            background: rgba(244, 67, 54, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: errorRipple 0.6s ease-out;
            pointer-events: none;
            z-index: 15;
        `;
        
        buttonElement.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
        
        // Add shake animation to button
        buttonElement.style.animation = 'buttonShake 0.5s ease-in-out';
        setTimeout(() => {
            buttonElement.style.animation = '';
        }, 500);
    }

    // ===== PROGRESSIVE HINTS =====
    
    showProgressiveHint(hintLevel) {
        // Show increasingly specific hints based on how many times user has been wrong
        const audioConfig = this.controller.getCurrentAudio();
        let hintText = '';
        
        switch (hintLevel) {
            case 1:
                // First hint - general guidance
                if (this.controller.shouldUsePictureFormat()) {
                    hintText = 'Count carefully and look at both sides';
                } else {
                    hintText = 'Think about what number comes next';
                }
                break;
            case 2:
                // Second hint - more specific
                if (this.controller.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
                    hintText = `What number comes before ${this.controller.currentNumber}?`;
                } else if (this.controller.gameMode === CONFIG.GAME_MODES.PLUS_TWO) {
                    hintText = `What number is two more than ${this.controller.currentNumber}?`;
                } else {
                    hintText = `What number comes after ${this.controller.currentNumber}?`;
                }
                break;
            case 3:
                // Third hint - very specific
                hintText = `The answer is ${this.controller.currentAnswer}`;
                break;
        }
        
        if (hintText) {
            this.speakText(hintText);
        }
    }

    // ===== CLEANUP =====
    
    destroy() {
        this.clearInactivityTimer();
        this.stopFlashing();
        
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        // Remove modal button styles
        const modalButtonStyles = document.head.querySelector('style[data-modal-buttons]');
        if (modalButtonStyles) {
            modalButtonStyles.remove();
        }
    }
}

// Add CSS for new animations
if (!document.querySelector('#ui-manager-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'ui-manager-styles';
    styleSheet.textContent = `
        @keyframes starBurst {
            0% {
                opacity: 1;
                transform: scale(0) rotate(0deg);
            }
            50% {
                opacity: 1;
                transform: scale(1.2) rotate(180deg);
            }
            100% {
                opacity: 0;
                transform: scale(0.8) rotate(360deg);
            }
        }
        
        @keyframes errorRipple {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(4);
                opacity: 0;
            }
        }
        
        @keyframes buttonShake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
            20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        
        .completion-effect {
            pointer-events: none;
            user-select: none;
        }
        
        .error-ripple {
            pointer-events: none;
        }
    `;
    document.head.appendChild(styleSheet);
}
