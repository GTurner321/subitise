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
        FUN: 'fun',
        CUDDLES: 'cuddles', 
        STARS: 'stars'
    },
    
    // Category display info
    CATEGORY_INFO: {
        fun: { label: 'Fun', suffix: '%', max: 100 },
        cuddles: { label: 'Cuddles', suffix: '/10', max: 10 },
        stars: { label: 'Stars', suffix: '/5', max: 5 }
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
            name: "Classic Teddy",
            image: "assets/trumps/card01.png",
            stats: { fun: 75, cuddles: 9, stars: 4 }
        },
        {
            id: 2,
            name: "Rainbow Bear",
            image: "assets/trumps/card02.png", 
            stats: { fun: 95, cuddles: 7, stars: 5 }
        },
        {
            id: 3,
            name: "Sleepy Sloth",
            image: "assets/trumps/card03.png",
            stats: { fun: 60, cuddles: 10, stars: 3 }
        },
        {
            id: 4,
            name: "Action Robot",
            image: "assets/trumps/card04.png",
            stats: { fun: 100, cuddles: 3, stars: 4 }
        },
        {
            id: 5,
            name: "Fluffy Bunny",
            image: "assets/trumps/card05.png",
            stats: { fun: 80, cuddles: 8, stars: 4 }
        },
        {
            id: 6,
            name: "Dinosaur Rex",
            image: "assets/trumps/card06.png",
            stats: { fun: 90, cuddles: 5, stars: 5 }
        },
        {
            id: 7,
            name: "Princess Doll",
            image: "assets/trumps/card07.png",
            stats: { fun: 85, cuddles: 6, stars: 5 }
        },
        {
            id: 8,
            name: "Pirate Captain",
            image: "assets/trumps/card08.png",
            stats: { fun: 95, cuddles: 4, stars: 4 }
        },
        {
            id: 9,
            name: "Cozy Cat",
            image: "assets/trumps/card09.png",
            stats: { fun: 70, cuddles: 9, stars: 3 }
        },
        {
            id: 10,
            name: "Space Rocket",
            image: "assets/trumps/card10.png",
            stats: { fun: 100, cuddles: 2, stars: 5 }
        },
        {
            id: 11,
            name: "Gentle Giant",
            image: "assets/trumps/card11.png",
            stats: { fun: 65, cuddles: 10, stars: 4 }
        },
        {
            id: 12,
            name: "Musical Mouse",
            image: "assets/trumps/card12.png",
            stats: { fun: 88, cuddles: 6, stars: 3 }
        },
        {
            id: 13,
            name: "Super Hero",
            image: "assets/trumps/card13.png",
            stats: { fun: 92, cuddles: 5, stars: 5 }
        },
        {
            id: 14,
            name: "Wise Owl",
            image: "assets/trumps/card14.png",
            stats: { fun: 55, cuddles: 7, stars: 4 }
        },
        {
            id: 15,
            name: "Dancing Duck",
            image: "assets/trumps/card15.png",
            stats: { fun: 90, cuddles: 6, stars: 3 }
        },
        {
            id: 16,
            name: "Magical Unicorn",
            image: "assets/trumps/card16.png",
            stats: { fun: 85, cuddles: 8, stars: 5 }
        }
    ]
};
