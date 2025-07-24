// Teddy Trumps Game Configuration
const CONFIG = {
    // Game settings
    TOTAL_CARDS: 16,
    ROUNDS: 8,
    GRID_ROWS: 2,
    GRID_COLS: 8,
    
    // Animation timings (milliseconds)
    CARD_FADE_DURATION: 500,
    CARD_MOVE_DURATION: 800,
    CARD_FLIP_DURATION: 600,
    RESULT_DISPLAY_DURATION: 2000,
    RESET_DELAY: 1000,
    
    // Categories
    CATEGORIES: {
        FUNNY: 'funny',
        CUDDLY: 'cuddly', 
        STARS: 'stars'
    },
    
    // Category display info
    CATEGORY_INFO: {
        funny: { label: 'Funny', suffix: '%', max: 100 },
        cuddly: { label: 'Cuddly', suffix: '/10', max: 10 },
        stars: { label: 'Stars', suffix: '', max: 5 } // No suffix for star display
    },
    
    // Visual settings
    CARD_ASPECT_RATIO: 0.7, // height/width
    CENTER_CARD_WIDTH: 200, // pixels
    
    // Audio settings
    AUDIO_ENABLED: true,
    
    // Card database - 16 different teddy bears and toys
    CARDS: [
        {
            id: 1,
            name: "Biscuit Bear",
            image: "../../assets/trumps/biscuitbear.png",
            stats: { funny: 24, cuddly: 3, stars: 1.5 }
        },
        {
            id: 2,
            name: "Black Bear",
            image: "../../assets/trumps/blackbear.png", 
            stats: { funny: 42, cuddly: 7, stars: 3.5 }
        },
        {
            id: 3,
            name: "Casper Rabbit",
            image: "../../assets/trumps/casperrabbit.png",
            stats: { funny: 31, cuddly: 7, stars: 3.5 }
        },
        {
            id: 4,
            name: "Chick",
            image: "../../assets/trumps/chick.png",
            stats: { funny: 40, cuddly: 6, stars: 3 }
        },
        {
            id: 5,
            name: "Dinosaur",
            image: "../../assets/trumps/dinosaur.png",
            stats: { funny: 54, cuddly: 5, stars: 4.5 }
        },
        {
            id: 6,
            name: "Elephant",
            image: "../../assets/trumps/elephant.png",
            stats: { funny: 15, cuddly: 8, stars: 1 }
        },
        {
            id: 7,
            name: "Flabber Jabber",
            image: "../../assets/trumps/flabberjabber.png",
            stats: { funny: 98, cuddly: 4, stars: 5 }
        },
        {
            id: 8,
            name: "Bear",
            image: "../../assets/trumps/gemsbear.png",
            stats: { funny: 57, cuddly: 8, stars: 4 }
        },
        {
            id: 9,
            name: "Knight Bear",
            image: "../../assets/trumps/knightbear.png",
            stats: { funny: 50, cuddly: 6, stars: 4.5 }
        },
        {
            id: 10,
            name: "Duck",
            image: "../../assets/trumps/legoduck.png",
            stats: { funny: 48, cuddly: 1, stars: 2.5 }
        },
        {
            id: 11,
            name: "Penguin",
            image: "../../assets/trumps/penguin.png",
            stats: { funny: 49, cuddly: 6, stars: 2.5 }
        },
        {
            id: 12,
            name: "Inflatable Sheep",
            image: "../../assets/trumps/sheep.png",
            stats: { funny: 75, cuddly: 2, stars: 3 }
        },
        {
            id: 13,
            name: "Soft Rabbit",
            image: "../../assets/trumps/softrabbit.png",
            stats: { funny: 16, cuddly: 9, stars: 2 }
        },
        {
            id: 14,
            name: "The Vowel Family",
            image: "../../assets/trumps/vowels.png",
            stats: { funny: 72, cuddly: 1, stars: 4 }
        },
        {
            id: 15,
            name: "Guinea Pig",
            image: "../../assets/raisin/guineapig1.png",
            stats: { funny: 80, cuddly: 7, stars: 5 }
        },
        {
            id: 16,
            name: "Raffles",
            image: "../../assets/bear.png",
            stats: { funny: 65, cuddly: 9, stars: 5 }
        }
    ]
};
