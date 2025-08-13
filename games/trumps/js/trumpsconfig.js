// Teddy Trumps Game Configuration
const CONFIG = {
    // Game settings
    TOTAL_CARDS: 16,
    ROUNDS: 8,
    GRID_ROWS: 2,
    GRID_COLS: 8,
    
    // Animation timings (milliseconds)
    CARD_FADE_DURATION: 2000, // Time to fade out non-selected cards
    CARD_MOVE_DURATION: 800,   // Time for cards to slide into square layout
    CARD_FLIP_DURATION: 600,   // Time for card flip animation
    RESULT_DISPLAY_DURATION: 2000, // Time to show round result
    RESET_DELAY: 1000,         // Delay before starting next round
    
    // Categories
    CATEGORIES: {
        FUN: 'fun',
        CUDDLY: 'cuddly', 
        STARS: 'stars'
    },
    
    // Category display info
    CATEGORY_INFO: {
        fun: { label: 'Fun', suffix: '%', max: 100 },
        cuddly: { label: 'Cuddly', suffix: '/10', max: 10 },
        stars: { label: 'Stars', suffix: '', max: 5 } // No suffix for star display
    },
    
    // Square layout positioning (percentages of square size)
    SQUARE_LAYOUT: {
        // Score boxes
        USER_SCORE: { x: 25, y: 4, width: 15, height: 15 },
        COMPUTER_SCORE: { x: 60, y: 4, width: 15, height: 15 },
        
        // Cards
        USER_CARD: { x: 2, y: 23, width: 45, height: 73 },
        COMPUTER_CARD: { x: 53, y: 23, width: 45, height: 73 },
        
        // Card elements (relative to card position)
        CARD_ELEMENTS: {
            TITLE: { x: 5, y: 0, width: 35, height: 9 },
            PICTURE: { x: 5, y: 9, width: 35, height: 30 },
            BUTTON_1: { x: 5, y: 41, width: 35, height: 9 },
            BUTTON_2: { x: 5, y: 51, width: 35, height: 9 },
            BUTTON_3: { x: 5, y: 61, width: 35, height: 9 }
        },
        
        // Font sizes (percentages of square size)
        FONT_SIZES: {
            SCORE: 0.08,      // 8% of square size
            TITLE: 0.025,     // 2.5% of square size
            BUTTON: 0.02,     // 2% of square size
            STAR: 0.025       // 2.5% of square size
        }
    },
    
    // Visual settings
    CARD_ASPECT_RATIO: 0.7, // height/width for grid cards
    
    // Audio settings - delegated to universal AudioSystem
    AUDIO_ENABLED: true,
    
    // Card database - 16 different teddy bears and toys
    CARDS: [
        {
            id: 1,
            name: "Biscuit Bear",
            image: "../../assets/trumps/biscuitbear.png",
            stats: { fun: 45, cuddly: 3, stars: 1.5 }
        },
        {
            id: 2,
            name: "Black Bear",
            image: "../../assets/trumps/blackbear.png", 
            stats: { fun: 42, cuddly: 7, stars: 3.5 }
        },
        {
            id: 3,
            name: "Casper Rabbit",
            image: "../../assets/trumps/casperrabbit.png",
            stats: { fun: 31, cuddly: 7, stars: 3 }
        },
        {
            id: 4,
            name: "Chick",
            image: "../../assets/trumps/chick.png",
            stats: { fun: 40, cuddly: 6, stars: 3 }
        },
        {
            id: 5,
            name: "Dinosaur",
            image: "../../assets/trumps/dinosaur.png",
            stats: { fun: 70, cuddly: 5, stars: 4.5 }
        },
        {
            id: 6,
            name: "Elephant",
            image: "../../assets/trumps/elephant.png",
            stats: { fun: 15, cuddly: 9, stars: 1 }
        },
        {
            id: 7,
            name: "Flabber Jabber",
            image: "../../assets/trumps/flabberjabber.png",
            stats: { fun: 98, cuddly: 4, stars: 5 }
        },
        {
            id: 8,
            name: "Bear",
            image: "../../assets/trumps/gemsbear.png",
            stats: { fun: 57, cuddly: 8, stars: 3.5 }
        },
        {
            id: 9,
            name: "Knight Bear",
            image: "../../assets/trumps/knightbear.png",
            stats: { fun: 67, cuddly: 6, stars: 4 }
        },
        {
            id: 10,
            name: "Duck",
            image: "../../assets/trumps/legoduck.png",
            stats: { fun: 68, cuddly: 1, stars: 2.5 }
        },
        {
            id: 11,
            name: "Penguin",
            image: "../../assets/trumps/penguin.png",
            stats: { fun: 49, cuddly: 6, stars: 2.5 }
        },
        {
            id: 12,
            name: "Inflatable Sheep",
            image: "../../assets/trumps/sheep.png",
            stats: { fun: 86, cuddly: 2, stars: 3 }
        },
        {
            id: 13,
            name: "Soft Rabbit",
            image: "../../assets/trumps/softrabbit.png",
            stats: { fun: 16, cuddly: 10, stars: 2 }
        },
        {
            id: 14,
            name: "The Vowel Family",
            image: "../../assets/trumps/vowels.png",
            stats: { fun: 72, cuddly: 1, stars: 4 }
        },
        {
            id: 15,
            name: "Guinea Pig",
            image: "../../assets/raisin/guineapig1.png",
            stats: { fun: 80, cuddly: 7, stars: 4.5 }
        },
        {
            id: 16,
            name: "Raffles",
            image: "../../assets/bear.png",
            stats: { fun: 65, cuddly: 8, stars: 5 }
        }
    ]
};
