// Plus One game configuration settings
const CONFIG = {
    // Level definitions with number sets
    LEVELS: {
        1: { numbers: [1, 2, 3, 4], name: 'Level 1' },
        2: { numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9], name: 'Level 2' },
        3: { numbers: [10, 11, 12, 13, 14, 15, 16, 17, 18], name: 'Level 3' },
        4: { numbers: [20, 30, 40, 50, 60, 70, 80, 90], name: 'Level 4' },
        5: { numbers: [9, 19, 29, 39, 49, 59, 69, 79, 89], name: 'Level 5' },
        6: { numbers: Array.from({length: 79}, (_, i) => i + 20), name: 'Level 6' }, // 20-98
        7: { numbers: Array.from({length: 11}, (_, i) => i + 99), name: 'Level 7' }, // 99-109
        8: { numbers: Array.from({length: 889}, (_, i) => i + 110), name: 'Level 8' }, // 110-998
        9: { numbers: Array.from({length: 8001}, (_, i) => i + 999), name: 'Level 9' }, // 999-9999
        10: { numbers: Array.from({length: 9000000}, (_, i) => i + 1000000), name: 'Level 10' } // 1000000-9999999
    },
    
    // Font Awesome icons suitable for nursery age children (levels 1-2 only)
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
    
    // Number to word conversion for levels 3+
    NUMBER_TO_WORD: {
        1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
        6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
        11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
        16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
        21: 'twenty-one', 22: 'twenty-two', 23: 'twenty-three', 24: 'twenty-four', 25: 'twenty-five',
        26: 'twenty-six', 27: 'twenty-seven', 28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty',
        31: 'thirty-one', 32: 'thirty-two', 33: 'thirty-three', 34: 'thirty-four', 35: 'thirty-five',
        36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight', 39: 'thirty-nine', 40: 'forty',
        41: 'forty-one', 42: 'forty-two', 43: 'forty-three', 44: 'forty-four', 45: 'forty-five',
        46: 'forty-six', 47: 'forty-seven', 48: 'forty-eight', 49: 'forty-nine', 50: 'fifty',
        51: 'fifty-one', 52: 'fifty-two', 53: 'fifty-three', 54: 'fifty-four', 55: 'fifty-five',
        56: 'fifty-six', 57: 'fifty-seven', 58: 'fifty-eight', 59: 'fifty-nine', 60: 'sixty',
        61: 'sixty-one', 62: 'sixty-two', 63: 'sixty-three', 64: 'sixty-four', 65: 'sixty-five',
        66: 'sixty-six', 67: 'sixty-seven', 68: 'sixty-eight', 69: 'sixty-nine', 70: 'seventy',
        71: 'seventy-one', 72: 'seventy-two', 73: 'seventy-three', 74: 'seventy-four', 75: 'seventy-five',
        76: 'seventy-six', 77: 'seventy-seven', 78: 'seventy-eight', 79: 'seventy-nine', 80: 'eighty',
        81: 'eighty-one', 82: 'eighty-two', 83: 'eighty-three', 84: 'eighty-four', 85: 'eighty-five',
        86: 'eighty-six', 87: 'eighty-seven', 88: 'eighty-eight', 89: 'eighty-nine', 90: 'ninety',
        91: 'ninety-one', 92: 'ninety-two', 93: 'ninety-three', 94: 'ninety-four', 95: 'ninety-five',
        96: 'ninety-six', 97: 'ninety-seven', 98: 'ninety-eight', 99: 'ninety-nine', 100: 'one hundred'
        // For numbers above 100, we'll generate them dynamically
    },
    
    // Game mechanics
    TOTAL_QUESTIONS: 10,
    RAINBOW_PIECES: 10,
    
    // Icon positioning for split areas (levels 1-2)
    ICON_MARGIN: 60,
    MIN_ICON_DISTANCE: 100,
    MIDDLE_SECTION_WIDTH: 0.1,
    SIDE_WIDTH: 0.45,
    
    // Animation timings
    FLASH_DURATION: 800,
    ICON_FADE_DURATION: 500,
    NEXT_QUESTION_DELAY: 1500,
    
    // Audio settings
    AUDIO_ENABLED: true
};

// Generate number to word conversions for larger numbers
function generateNumberToWord(num) {
    if (CONFIG.NUMBER_TO_WORD[num]) {
        return CONFIG.NUMBER_TO_WORD[num];
    }
    
    if (num <= 1000) {
        const hundreds = Math.floor(num / 100);
        const remainder = num % 100;
        
        let result = '';
        if (hundreds > 0) {
            result += CONFIG.NUMBER_TO_WORD[hundreds] + ' hundred';
            if (remainder > 0) {
                result += ' ';
            }
        }
        
        if (remainder > 0) {
            if (remainder <= 20 || remainder % 10 === 0) {
                result += CONFIG.NUMBER_TO_WORD[remainder] || remainder.toString();
            } else {
                const tens = Math.floor(remainder / 10) * 10;
                const ones = remainder % 10;
                result += (CONFIG.NUMBER_TO_WORD[tens] || tens.toString()) + '-' + 
                         (CONFIG.NUMBER_TO_WORD[ones] || ones.toString());
            }
        }
        
        return result || num.toString();
    }
    
    // For very large numbers, just return the number as string
    return num.toString();
}

// Extend the NUMBER_TO_WORD object dynamically
CONFIG.getNumberWord = generateNumberToWord;
