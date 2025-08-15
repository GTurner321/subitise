// Animal Trumps Game Configuration - Version 2.0 - Highest Selection Phase
const CONFIG = {
    // Game settings
    TOTAL_CARDS: 30,
    ROUNDS: 10,
    CARDS_PER_ROUND: 3,
    GRID_ROWS: 3,
    GRID_COLS: 10,
    
    // Animation timings (milliseconds)
    CARD_FADE_DURATION: 1000, // Time to fade out non-selected cards (reduced from 2000)
    CARD_MOVE_DURATION: 800,   // Time for cards to slide into rectangular layout
    CARD_FLIP_DURATION: 600,   // Time for card flip animation
    RESULT_DISPLAY_DURATION: 2000, // Time to show round result
    RESET_DELAY: 1000,         // Delay before starting next round
    PAUSE_BETWEEN_REVEALS: 200, // Pause between card reveals (reduced from 500ms for faster gameplay)
    SPEECH_COMPLETION_BUFFER: 200, // Extra time for speech to complete (reduced from 500ms)
    
    // Visual settings
    CARD_ASPECT_RATIO: 0.77, // height/width for grid cards (10/7.7)
    
    // Audio settings - delegated to universal AudioSystem
    AUDIO_ENABLED: true,
    
    // Player names (randomly assigned to A and B each game)
    PLAYER_NAMES: {
        BOYS: ['Oliver', 'Noah', 'Jack', 'Harry', 'George', 'Aarav', 'Yusuf', 'Leo', 'Freddie', 'Amir'],
        GIRLS: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Aisha', 'Grace', 'Sophie', 'Zainab', 'Lily', 'Amira']
    },
    
    // Rectangular layout positioning (percentages of rectangle size)
    RECT_LAYOUT: {
        // Rectangle aspect ratio (width:height)
        ASPECT_RATIO: 1.62, // 162:100
        
        // Score elements (updated positioning)
        LEFT_SCORE_BOX: { x: 12.96, y: 2, width: 7.41, height: 12 },
        MIDDLE_SCORE_BOX: { x: 46.3, y: 2, width: 7.41, height: 12 },
        RIGHT_SCORE_BOX: { x: 79.6, y: 2, width: 7.41, height: 12 },
        
        // Player name labels (moved below score boxes)
        LEFT_SCORE_NAME: { x: 1.23, y: 14, width: 30.86, height: 8 },
        MIDDLE_SCORE_NAME: { x: 34.6, y: 14, width: 30.86, height: 8 },
        RIGHT_SCORE_NAME: { x: 67.9, y: 14, width: 30.86, height: 8 },
        
        // Cards
        LEFT_CARD: { x: 1.23, y: 23, width: 30.86, height: 73 },
        MIDDLE_CARD: { x: 34.57, y: 23, width: 30.86, height: 73 },
        RIGHT_CARD: { x: 67.9, y: 23, width: 30.86, height: 73 },
        
        // Card elements (relative to card position)
        CARD_ELEMENTS: {
            TITLE: { x: 1.23, y: 0, width: 28.4, height: 9 },
            PICTURE: { x: 1.23, y: 9, width: 28.4, height: 46 },
            NUMBER: { x: 1.23, y: 55, width: 28.4, height: 18 }
        },
        
        // Font sizes (percentages of rectangle size)
        FONT_SIZES: {
            SCORE_NAME: 0.025,    // 2.5% of rectangle size
            SCORE_BOX: 0.06,      // 6% of rectangle size
            CARD_TITLE: 0.020,    // 2% of rectangle size
            CARD_NUMBER: 0.070    // 7% of rectangle size (doubled from 3.5%)
        }
    },
    
    // Grid layout positioning for 30 cards (vw units)
    GRID_LAYOUT: {
        CARD_WIDTH: 7.7,  // vw
        CARD_HEIGHT: 10, // vw (reduced from 10.4)
        POSITIONS: [
            // Row 1 (y: 22)
            { x: 7, y: 22 }, { x: 15.7, y: 22 }, { x: 24.4, y: 22 }, { x: 33.1, y: 22 }, { x: 41.8, y: 22 },
            { x: 50.5, y: 22 }, { x: 59.2, y: 22 }, { x: 67.9, y: 22 }, { x: 76.6, y: 22 }, { x: 85.3, y: 22 },
            // Row 2 (y: 47 - changed from 46)
            { x: 7, y: 47 }, { x: 15.7, y: 47 }, { x: 24.4, y: 47 }, { x: 33.1, y: 47 }, { x: 41.8, y: 47 },
            { x: 50.5, y: 47 }, { x: 59.2, y: 47 }, { x: 67.9, y: 47 }, { x: 76.6, y: 47 }, { x: 85.3, y: 47 },
            // Row 3 (y: 72 - changed from 70)
            { x: 7, y: 72 }, { x: 15.7, y: 72 }, { x: 24.4, y: 72 }, { x: 33.1, y: 72 }, { x: 41.8, y: 72 },
            { x: 50.5, y: 72 }, { x: 59.2, y: 72 }, { x: 67.9, y: 72 }, { x: 76.6, y: 72 }, { x: 85.3, y: 72 }
        ]
    },
    
    // Score box colors for the three players
    SCORE_COLORS: {
        USER: '#4CAF50',     // Green
        PLAYER_A: '#FF9800', // Orange
        PLAYER_B: '#2196F3'  // Blue
    },
    
    // Audio messages - centralized for easy editing
    AUDIO_MESSAGES: {
        GAME_START: "Choose 3 cards. They each have a different animal and a different number from 1 to 30.",
        START_REMIND: "Choose 3 cards.",
        CARD_SELECTION_PHASE_START: "Choose one of the cards, the others will be chosen by {playerA} and {playerB}. The highest number wins the round.",
        CARD_SELECTION_PHASE: "Choose a card.",
        
        // User card selection - now includes animal name
        USER_CARD_SELECTED: "You have picked the {animal}, number {number}.",
        
        // AI player card selections - removed reveal messages for Job 1
        SECOND_PICK: "{player} chooses the {position} card.",
        THIRD_PICK: "{player} is left with the {position} card.",
        
        // New highest selection phase messages
        HIGHEST_SELECTION: "Which card is the highest?",
        HIGHEST_SELECTION_PROMPT: "Click on the card with the highest score.",
        HIGHEST_SELECTED_CORRECT: "{praise} {number} is the highest number. {winner} {wins} this round with the {animal}!",
        HIGHEST_SELECTED_FAIL: "Try again.",
        
        // Game completion messages
        GAME_COMPLETE_WIN: "Congratulations! You've won the game! Play again or return to the home page.",
        GAME_COMPLETE_LOSE: "{winner} wins this time. Play again or return to the home page.",
        GAME_COMPLETE_DRAW: "The game is a draw. Play again or return to the home page.",
        
        // Round announcements
        ROUND_START: "Choose 3 cards.",
        
        // Position names for audio
        POSITIONS: {
            LEFT: "first",
            MIDDLE: "second", 
            RIGHT: "third"
        }
    },
    
    // Card database - 30 animals with consistent numbering
    CARDS: [
        {
            id: 1,
            name: "Chicken",
            image: "../../assets/trumps2/chicken.jpg",
            value: 1
        },
        {
            id: 2,
            name: "Snail",
            image: "../../assets/trumps2/snail.jpg",
            value: 2
        },
        {
            id: 3,
            name: "Ladybird",
            image: "../../assets/trumps2/ladybird.jpg",
            value: 3
        },
        {
            id: 4,
            name: "Bee",
            image: "../../assets/trumps2/bee.jpg",
            value: 4
        },
        {
            id: 5,
            name: "Butterfly",
            image: "../../assets/trumps2/butterfly.jpg",
            value: 5
        },
        {
            id: 6,
            name: "Falcon",
            image: "../../assets/trumps2/falcon.jpg",
            value: 6
        },
        {
            id: 7,
            name: "Starfish",
            image: "../../assets/trumps2/starfish.jpg",
            value: 7
        },
        {
            id: 8,
            name: "Seahorse",
            image: "../../assets/trumps2/seahorse.jpg",
            value: 8
        },
        {
            id: 9,
            name: "Shark",
            image: "../../assets/trumps2/shark.jpg",
            value: 9
        },
        {
            id: 10,
            name: "Clownfish",
            image: "../../assets/trumps2/clownfish.jpg",
            value: 10
        },
        {
            id: 11,
            name: "Cow",
            image: "../../assets/trumps2/cow.jpg",
            value: 11
        },
        {
            id: 12,
            name: "Sheep",
            image: "../../assets/trumps2/sheep.jpg",
            value: 12
        },
        {
            id: 13,
            name: "Chameleon",
            image: "../../assets/trumps2/chameleon.jpg",
            value: 13
        },
        {
            id: 14,
            name: "Frog",
            image: "../../assets/trumps2/frog.jpg",
            value: 14
        },
        {
            id: 15,
            name: "Turtle",
            image: "../../assets/trumps2/turtle.jpg",
            value: 15
        },
        {
            id: 16,
            name: "Duck",
            image: "../../assets/trumps2/duck.jpg",
            value: 16
        },
        {
            id: 17,
            name: "Flamingo",
            image: "../../assets/trumps2/flamengo.jpg",
            value: 17
        },
        {
            id: 18,
            name: "Owl",
            image: "../../assets/trumps2/owl.jpg",
            value: 18
        },
        {
            id: 19,
            name: "Penguin",
            image: "../../assets/trumps2/penguin.jpg",
            value: 19
        },
        {
            id: 20,
            name: "Parrot",
            image: "../../assets/trumps2/parrot.jpg",
            value: 20
        },
        {
            id: 21,
            name: "Dolphin",
            image: "../../assets/trumps2/dolphin.jpg",
            value: 21
        },
        {
            id: 22,
            name: "Horse",
            image: "../../assets/trumps2/horse.jpg",
            value: 22
        },
        {
            id: 23,
            name: "Kangaroo",
            image: "../../assets/trumps2/kangaroo.jpg",
            value: 23
        },
        {
            id: 24,
            name: "Panda",
            image: "../../assets/trumps2/panda.jpg",
            value: 24
        },
        {
            id: 25,
            name: "Monkey",
            image: "../../assets/trumps2/monkey.jpg",
            value: 25
        },
        {
            id: 26,
            name: "Zebra",
            image: "../../assets/trumps2/zebra.jpg",
            value: 26
        },
        {
            id: 27,
            name: "Giraffe",
            image: "../../assets/trumps2/giraffe.jpg",
            value: 27
        },
        {
            id: 28,
            name: "Elephant",
            image: "../../assets/trumps2/elephant.jpg",
            value: 28
        },
        {
            id: 29,
            name: "Tiger",
            image: "../../assets/trumps2/tiger.jpg",
            value: 29
        },
        {
            id: 30,
            name: "Lion",
            image: "../../assets/trumps2/lion.jpg",
            value: 30
        }
    ]
};

// Image Preloader Class
class ImagePreloader {
    static preloadImages() {
        console.log('Starting image preload...');
        return Promise.all(
            CONFIG.CARDS.map(card => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        console.log(`Loaded: ${card.image}`);
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn(`Failed to load: ${card.image}`);
                        reject();
                    };
                    img.src = card.image;
                });
            })
        );
    }
}

// Utility functions for audio message formatting
const AudioUtils = {
    formatMessage: (template, replacements = {}) => {
        if (!template) {
            console.warn('formatMessage: template is undefined or empty');
            return '';
        }
        
        let message = template;
        Object.keys(replacements).forEach(key => {
            const value = replacements[key];
            // Handle undefined/null values by converting to empty string
            let safeValue = '';
            if (value !== undefined && value !== null) {
                safeValue = String(value);
            } else {
                console.warn(`formatMessage: replacement value for key "${key}" is undefined/null in template "${template}"`);
            }
            message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), safeValue);
        });
        return message;
    },
    
    getRandomPlayerName: () => {
        const allNames = [...CONFIG.PLAYER_NAMES.BOYS, ...CONFIG.PLAYER_NAMES.GIRLS];
        return allNames[Math.floor(Math.random() * allNames.length)];
    },
    
    getRandomPraise: () => {
        const praises = ["That's right!", "Correct!", "Well done!", "Good job!"];
        return praises[Math.floor(Math.random() * praises.length)];
    },
    
    getPositionName: (position) => {
        switch(position) {
            case 'left': return CONFIG.AUDIO_MESSAGES.POSITIONS.LEFT;
            case 'middle': return CONFIG.AUDIO_MESSAGES.POSITIONS.MIDDLE;
            case 'right': return CONFIG.AUDIO_MESSAGES.POSITIONS.RIGHT;
            default: return position;
        }
    }
};
