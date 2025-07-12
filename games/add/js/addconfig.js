// Addition game configuration settings
const CONFIG = {
    // Difficulty levels - UPDATED: All capped at 10
    DIFFICULTY: {
        EASY: {
            name: 'easy',
            maxTotal: 4,
            description: 'Level 1: totals up to 4'
        },
        MEDIUM: {
            name: 'medium',
            maxTotal: 7,
            higherNumbers: [6, 7],
            description: 'Level 2: totals up to 7'
        },
        HARD: {
            name: 'hard',
            maxTotal: 10,
            higherNumbers: [8, 9, 10],
            description: 'Level 3: totals up to 10'
        }
    },

    // Font Awesome icons suitable for nursery age children
ICONS: [
    // Animals
    'fas fa-cat',
    'fas fa-dog',
    'fas fa-fish',
    'fas fa-dove',
    'fas fa-frog',
    'fas fa-bug',
    'fas fa-horse',
    'fas fa-hippo',
    
    // Home & Furniture
    'fas fa-home',
    'fas fa-bed',
    'fas fa-chair',
    
    // Vehicles & Transportation
    'fas fa-car',
    'fas fa-bicycle',
    'fas fa-plane',
    'fas fa-rocket',
    'fas fa-tractor',
    'fas fa-bus',
    'fas fa-train',
    
    // Sports & Games
    'fas fa-puzzle-piece',
    
    // Food
    'fas fa-apple-alt',
    'fas fa-carrot',
    'fas fa-ice-cream',
    'fas fa-birthday-cake',
    'fas fa-pepper-hot',
    
    // Nature & Weather
    'fas fa-tree',
    'fas fa-leaf',
    'fas fa-sun',
    'fas fa-cloud',
    'fas fa-rainbow',
    'fas fa-star',
    'fas fa-moon',
    'fas fa-snowflake',
    'fas fa-feather',
    
    // Shapes & Symbols
    'fas fa-heart',
    
    // Objects & Tools
    'fas fa-music',
    'fas fa-bell',
    'fas fa-umbrella',
    'fas fa-anchor',
    'fas fa-glasses',
    'fas fa-binoculars',
    'fas fa-tshirt',
    
    // Fantasy & Fun
    'fas fa-ghost',
    'fas fa-hat-wizard',
    
    // Gestures & Actions
    'fas fa-smile',
    'fas fa-thumbs-up',
    'fas fa-hand-paper',
    ],

    // Color palette for icons
    COLORS: [
        '#ff6b6b', // Red
        '#4ecdc4', // Teal
        '#45b7d1', // Blue
        '#f9ca24', // Yellow
        '#f0932b', // Orange
        '#eb4d4b', // Dark Red
        '#6c5ce7', // Purple
        '#a29bfe', // Light Purple
        '#fd79a8', // Pink
        '#00b894', // Green
        '#00cec9', // Cyan
        '#fdcb6e', // Light Orange
        '#e17055', // Coral
        '#74b9ff', // Light Blue
        '#0984e3', // Dark Blue
        '#00a085', // Dark Green
        '#e84393', // Magenta
        '#fd63a3', // Hot Pink
        '#636e72', // Gray
        '#2d3436'  // Dark Gray
    ],

    // Rainbow colors (in order)
    RAINBOW_COLORS: [
        '#ff0000', // Red
        '#ff8000', // Orange  
        '#ffff00', // Yellow
        '#80ff00', // Yellow-Green
        '#00ff00', // Green
        '#00ff80', // Green-Cyan
        '#00ffff', // Cyan
        '#0080ff', // Blue-Cyan
        '#0000ff', // Blue
        '#8000ff'  // Purple
    ],

    // Game mechanics
    QUESTIONS_PER_LEVEL: 3,
    CONSECUTIVE_WRONG_TO_DROP: 2,
    RAINBOW_PIECES: 10,

    // Icon positioning for split areas
    ICON_MARGIN: 60, // Margin from edges of each side
    MIN_ICON_DISTANCE: 100, // Minimum distance between icons
    MIDDLE_SECTION_WIDTH: 0.1, // 10% of total width for middle section
    SIDE_WIDTH: 0.45, // 45% of total width for each side

    // Animation timings
    FLASH_DURATION: 800,
    ICON_FADE_DURATION: 500,
    NEXT_QUESTION_DELAY: 1500,

    // Addition specific settings - UPDATED: Capped at 10
    MIN_ICONS_PER_SIDE: 1,
    MAX_ICONS_PER_SIDE: 10,
    MAX_TOTAL_ICONS: 10 // Changed from 12 to 10
};
