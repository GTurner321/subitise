// Add touch support for buttons
        teddyBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.selectGame('teddy');
        });

        animalBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.selectGame('animal');
        });class GameChoice {
    constructor() {
        console.log('🎮 GameChoice constructor called');
        this.modal = null;
        this.onGameSelected = null; // Callback function
        this.createChoiceModal();
        console.log('✅ GameChoice constructor complete');
    }

    createChoiceModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div class="modal full-screen-modal" id="gameChoiceModal">
                <div class="modal-content game-choice-content">
                    <div class="game-choice-buttons">
                        <button class="game-choice-btn teddy-trumps-btn" id="teddyTrumpsBtn">
                            🧸 TEDDY TRUMPS
                        </button>
                        <button class="game-choice-btn animal-trumps-btn" id="animalTrumpsBtn">
                            🦁 ANIMAL TRUMPS
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('gameChoiceModal');

        // Add event listeners
        this.setupEventListeners();

        // Add CSS styles
        this.addStyles();
    }

    addStyles() {
        // Check if styles already exist
        if (document.getElementById('game-choice-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'game-choice-styles';
        styles.textContent = `
            .full-screen-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
            }

            .game-choice-content {
                background: transparent;
                padding: 40px;
                border-radius: 0;
                text-align: center;
                animation: modalAppear 0.5s ease;
                pointer-events: auto;
                box-shadow: none;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100%;
            }

            .game-choice-buttons {
                display: flex;
                flex-direction: column;
                gap: 40px;
                align-items: center;
            }

            .game-choice-btn {
                border: none;
                padding: 30px 60px;
                font-size: 2.5rem;
                border-radius: 20px;
                cursor: pointer;
                font-weight: bold;
                font-family: 'Comic Sans MS', cursive;
                box-shadow: 0 8px 16px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                touch-action: manipulation;
                pointer-events: auto;
                outline: none;
                min-width: 400px;
                text-transform: uppercase;
                color: white;
            }

            .teddy-trumps-btn {
                background: linear-gradient(135deg, #4CAF50, #45a049);
            }

            .animal-trumps-btn {
                background: linear-gradient(135deg, #2196F3, #1976D2);
            }

            .game-choice-btn:hover {
                transform: translateY(-5px);
                box-shadow: 0 12px 20px rgba(0,0,0,0.4);
            }

            .teddy-trumps-btn:hover {
                background: linear-gradient(135deg, #66BB6A, #4CAF50);
            }

            .animal-trumps-btn:hover {
                background: linear-gradient(135deg, #42A5F5, #2196F3);
            }

            .game-choice-btn:active {
                transform: translateY(-2px);
                transition: all 0.1s ease;
            }

            .game-choice-btn:focus {
                outline: none;
                box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.5);
            }

            /* Responsive design */
            @media (max-width: 600px) {
                .game-choice-btn {
                    font-size: 2rem;
                    padding: 25px 50px;
                    min-width: 300px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    setupEventListeners() {
        // Teddy Trumps button
        const teddyBtn = document.getElementById('teddyTrumpsBtn');
        const animalBtn = document.getElementById('animalTrumpsBtn');

        teddyBtn.addEventListener('click', () => {
            this.selectGame('teddy');
        });

        animalBtn.addEventListener('click', () => {
            this.selectGame('animal');
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible()) return;

            if (e.code === 'Digit1' || e.code === 'KeyT') {
                e.preventDefault();
                this.selectGame('teddy');
            } else if (e.code === 'Digit2' || e.code === 'KeyA') {
                e.preventDefault();
                this.selectGame('animal');
            } else if (e.code === 'Enter') {
                // Default to Animal Trumps on Enter
                e.preventDefault();
                this.selectGame('animal');
            }
        });
    }

    selectGame(gameType) {
        console.log(`Game selected: ${gameType}`);

        // Add selection animation
        const selectedBtn = gameType === 'teddy' ? 
            document.getElementById('teddyTrumpsBtn') : 
            document.getElementById('animalTrumpsBtn');

        if (selectedBtn) {
            selectedBtn.style.transform = 'scale(0.95)';
            selectedBtn.style.transition = 'transform 0.1s ease';
        }

        // Hide modal with animation
        this.hide();

        // Execute action after animation
        setTimeout(() => {
            if (gameType === 'teddy') {
                // Redirect to Teddy Trumps
                window.location.href = 'https://gturner321.github.io/subitise/games/trumps/index.html';
            } else {
                // Start Animal Trumps game
                if (this.onGameSelected) {
                    this.onGameSelected('animal');
                }
            }
        }, 300);
    }

    show(callback) {
        console.log('🎪 GameChoice.show() called');
        this.onGameSelected = callback;
        
        if (this.modal) {
            console.log('📺 Showing modal');
            this.modal.classList.remove('hidden');
            
            // Give audio instruction
            if (window.AudioSystem) {
                setTimeout(() => {
                    console.log('🔊 Playing audio instruction');
                    window.AudioSystem.speakText('Choose between the card games, teddy trumps and animal trumps.');
                }, 500);
            }
        } else {
            console.error('❌ Modal not found!');
        }
    }

    hide() {
        if (this.modal) {
            // Add fade out animation
            this.modal.style.opacity = '0';
            this.modal.style.transition = 'opacity 0.3s ease';
            
            setTimeout(() => {
                this.modal.classList.add('hidden');
                this.modal.style.opacity = '';
                this.modal.style.transition = '';
            }, 300);
        }
    }

    isVisible() {
        return this.modal && !this.modal.classList.contains('hidden');
    }

    destroy() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }

        // Remove styles
        const styles = document.getElementById('game-choice-styles');
        if (styles) {
            styles.remove();
        }

        // Remove event listeners (they'll be removed with the modal)
        this.onGameSelected = null;
    }
}
