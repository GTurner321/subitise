class GameChoice {
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
            <div class="modal" id="gameChoiceModal">
                <div class="modal-content game-choice-content">
                    <h2>🎮 Choose Your Game 🎮</h2>
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
            .game-choice-content {
                background: linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c);
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                animation: modalAppear 0.5s ease;
                pointer-events: auto;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                min-width: 300px;
            }

            .game-choice-content h2 {
                color: white;
                font-size: 2.5rem;
                margin-bottom: 30px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                font-family: 'Comic Sans MS', cursive;
            }

            .game-choice-buttons {
                display: flex;
                flex-direction: column;
                gap: 20px;
                align-items: center;
            }

            .game-choice-btn {
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                border: none;
                padding: 20px 40px;
                font-size: 1.8rem;
                border-radius: 15px;
                cursor: pointer;
                font-weight: bold;
                font-family: 'Comic Sans MS', cursive;
                box-shadow: 0 6px 12px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                touch-action: manipulation;
                pointer-events: auto;
                outline: none;
                min-width: 280px;
                text-transform: uppercase;
            }

            .teddy-trumps-btn {
                background: linear-gradient(135deg, #FF9800, #F57C00);
            }

            .animal-trumps-btn {
                background: linear-gradient(135deg, #2196F3, #1976D2);
            }

            .game-choice-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 16px rgba(0,0,0,0.4);
            }

            .teddy-trumps-btn:hover {
                background: linear-gradient(135deg, #FFB74D, #FF9800);
            }

            .animal-trumps-btn:hover {
                background: linear-gradient(135deg, #42A5F5, #2196F3);
            }

            .game-choice-btn:active {
                transform: translateY(-1px);
                transition: all 0.1s ease;
            }

            .game-choice-btn:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5);
            }

            /* Responsive design */
            @media (max-width: 480px) {
                .game-choice-content {
                    padding: 30px 20px;
                    min-width: 250px;
                }

                .game-choice-content h2 {
                    font-size: 2rem;
                    margin-bottom: 20px;
                }

                .game-choice-btn {
                    font-size: 1.5rem;
                    padding: 15px 30px;
                    min-width: 240px;
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
