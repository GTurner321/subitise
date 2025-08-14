// Animal Trumps Game Configuration
const CONFIG = {
    // Game settings
    TOTAL_CARDS: 30,
    ROUNDS: 10,
    CARDS_PER_ROUND: 3,
    GRID_ROWS: 3,
    GRID_COLS: 10,
    
    // Animation timings (milliseconds)
    CARD_FADE_DURATION: 2000, // Time to fade out non-selected cards
    CARD_MOVE_DURATION: 800,   // Time for cards to slide into rectangular layout
    CARD_FLIP_DURATION: 600,   // Time for card flip animation
    RESULT_DISPLAY_DURATION: 2000, // Time to show round result
    RESET_DELAY: 1000,         // Delay before starting next round
    PAUSE_BETWEEN_REVEALS: 1500, // Pause between card reveals
    
    // Visual settings
    CARD_ASPECT_RATIO: 0.69, // height/width for grid cards (11.2/7.7)
    
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
        
        // Score elements
        LEFT_SCORE_NAME: { x: 1.23, y: 4, width: 20.37, height: 15 },
        LEFT_SCORE_BOX: { x: 22.84, y: 4, width: 9.26, height: 15 },
        MIDDLE_SCORE_NAME: { x: 34.57, y: 4, width: 20.37, height: 15 },
        MIDDLE_SCORE_BOX: { x: 56.17, y: 4, width: 9.26, height: 15 },
        RIGHT_SCORE_NAME: { x: 67.9, y: 4, width: 20.37, height: 15 },
        RIGHT_SCORE_BOX: { x: 89.51, y: 4, width: 9.26, height: 15 },
        
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
            CARD_NUMBER: 0.035    // 3.5% of rectangle size
        }
    },
    
    // Grid layout positioning for 30 cards (vw units)
    GRID_LAYOUT: {
        CARD_WIDTH: 7.7,  // vw
        CARD_HEIGHT: 11.2, // vw
        POSITIONS: [
            // Row 1 (y: 22)
            { x: 7, y: 22 }, { x: 15.7, y: 22 }, { x: 24.4, y: 22 }, { x: 33.1, y: 22 }, { x: 41.8, y: 22 },
            { x: 50.5, y: 22 }, { x: 59.2, y: 22 }, { x: 67.9, y: 22 }, { x: 76.6, y: 22 }, { x: 85.3, y: 22 },
            // Row 2 (y: 46)
            { x: 7, y: 46 }, { x: 15.7, y: 46 }, { x: 24.4, y: 46 }, { x: 33.1, y: 46 }, { x: 41.8, y: 46 },
            { x: 50.5, y: 46 }, { x: 59.2, y: 46 }, { x: 67.9, y: 46 }, { x: 76.6, y: 46 }, { x: 85.3, y: 46 },
            // Row 3 (y: 70)
            { x: 7, y: 70 }, { x: 15.7, y: 70 }, { x: 24.4, y: 70 }, { x: 33.1, y: 70 }, { x: 41.8, y: 70 },
            { x: 50.5, y: 70 }, { x: 59.2, y: 70 }, { x: 67.9, y: 70 }, { x: 76.6, y: 70 }, { x: 85.3, y: 70 }
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
        GAME_START: "Choose 3 cards to start the round.",
        CARD_SELECTION_PHASE: "Select any card to see its value.",
        
        // User card selection
        USER_CARD_SELECTED: "You have picked number {number}, the {animal}.",
        
        // AI player card selections
        AI_CHOOSES_CARD: "{player} chooses the {position} card.",
        AI_REVEALED: "{player} has number {number}, the {animal}.",
        
        // AI strategy announcements
        AI_TAKES_REMAINING: "{player} has selected the {position} card.",
        AI_TAKES_FIRST: "{player} has selected the first card.",
        
        // Round results
        WINNER_ANNOUNCEMENT: "{winner} has won this round!",
        DRAW_ANNOUNCEMENT: "It's a draw! No points awarded.",
        
        // Game completion
        GAME_COMPLETE: "Congratulations! You completed all {rounds} rounds! Play again or return to the home page.",
        
        // Round announcements
        ROUND_START: "Round {round}. Choose 3 cards.",
        
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
            image: "../../assets/trumps2/lion.png",
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
        let message = template;
        Object.keys(replacements).forEach(key => {
            message = message.replace(new RegExp(`{${key}}`, 'g'), replacements[key]);
        });
        return message;
    },
    
    getRandomPlayerName: () => {
        const allNames = [...CONFIG.PLAYER_NAMES.BOYS, ...CONFIG.PLAYER_NAMES.GIRLS];
        return allNames[Math.floor(Math.random() * allNames.length)];
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
