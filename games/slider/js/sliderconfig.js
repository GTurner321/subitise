const CONFIG = {
    // Current level tracking
    currentLevel: 1,
    maxLevels: 4,
    
    // Level definitions - each level has its own configuration
    levels: {
        1: { // Counting in 2s (original game)
            name: "twos",
            increment: 2,
            buttonNumbers: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
            buttonCount: 10,
            maxQuestions: 10,
            nextLevelName: "threes"
        },
        2: { // Counting in 3s
            name: "threes", 
            increment: 3,
            buttonNumbers: [3, 6, 9, 12, 15, 18],
            buttonCount: 6,
            maxQuestions: 6,
            nextLevelName: "fours"
        },
        3: { // Counting in 4s
            name: "fours",
            increment: 4,
            buttonNumbers: [4, 8, 12, 16, 20],
            buttonCount: 5,
            maxQuestions: 5,
            nextLevelName: "fives"
        },
        4: { // Counting in 5s
            name: "fives",
            increment: 5,
            buttonNumbers: [5, 10, 15, 20],
            buttonCount: 4,
            maxQuestions: 4,
            nextLevelName: null // Last level
        }
    },
    
    // Audio message templates with placeholders
    audioTemplates: {
        intro: "We're going to count in {levelName}. Start by sliding {increment} beads to the right side",
        continue: "Slide {increment} more beads across",
        firstButton: "Select the button underneath for the number of beads on the right side",
        subsequentButton: "Select the matching button underneath",
        inactivityBase: "You need to put {increment} beads on the right side in total, with no beads left in the middle",
        inactivityContinue: "You had {previous} beads on the right side, now you need {increment} more. Make sure no beads are left in the middle",
        buttonHelp: "Carefully count the total number of beads on the right sides of both of the bars, then select the matching button",
        completionNext: "{celebration} Play the next level, or return to the home page.",
        completionFinal: "{celebration} You've completed all levels! Play again or return to the home page."
    },
    
    // Custom celebration messages for each level
    celebrationMessages: {
        1: "2, 4, 6, 8, who do we appreciate?",
        2: "3, 6, 9, this sounds like a rhyme!",
        3: "4, 8, 12, you worked it out yourself!",
        4: "5, 10, 15, what a clever bean!"
    },
    
    // Helper methods to get current level config
    getCurrentLevel() {
        return this.levels[this.currentLevel];
    },
    
    isLastLevel() {
        return this.currentLevel >= this.maxLevels;
    },
    
    advanceLevel() {
        if (this.currentLevel < this.maxLevels) {
            this.currentLevel++;
            return true;
        }
        return false;
    },
    
    resetToFirstLevel() {
        this.currentLevel = 1;
    },
    
    // Get button configuration for current level
    getButtonConfig() {
        const level = this.getCurrentLevel();
        return {
            numbers: level.buttonNumbers,
            count: level.buttonCount,
            width: 8, // Keep consistent button sizing
            height: 8
        };
    },
    
    // Calculate expected beads for current question
    getExpectedBeadsForQuestion(questionNumber) {
        const level = this.getCurrentLevel();
        return questionNumber * level.increment;
    },
    
    // Get increment for current level
    getCurrentIncrement() {
        return this.getCurrentLevel().increment;
    },
    
    // Generate counting sequence for current level (for completion message)
    getCurrentSequence() {
        const level = this.getCurrentLevel();
        const sequence = [];
        for (let i = 1; i <= level.maxQuestions; i++) {
            sequence.push(i * level.increment);
        }
        return sequence.join(', ');
    },
    
    // Get adaptive audio message
    getAudioMessage(messageType, context = {}) {
        const level = this.getCurrentLevel();
        const template = this.audioTemplates[messageType];
        
        if (!template) {
            console.warn(`Audio template '${messageType}' not found`);
            return '';
        }
        
        // Create replacement object with level data and context
        const replacements = {
            levelName: level.name,
            increment: level.increment,
            nextLevelName: level.nextLevelName,
            sequence: this.getCurrentSequence(),
            celebration: this.celebrationMessages[this.currentLevel] || this.getCurrentSequence(),
            ...context // Allow overriding with passed context
        };
        
        // Replace all placeholders in the template
        let message = template;
        Object.keys(replacements).forEach(key => {
            const placeholder = `{${key}}`;
            if (replacements[key] !== null && replacements[key] !== undefined) {
                message = message.replace(new RegExp(placeholder, 'g'), replacements[key]);
            }
        });
        
        return message;
    },
    
    // Get completion message (handles both next level and final level)
    getCompletionMessage() {
        if (this.isLastLevel()) {
            return this.getAudioMessage('completionFinal');
        } else {
            return this.getAudioMessage('completionNext');
        }
    },
    
    // Get modal button configuration
    getModalConfig() {
        if (this.isLastLevel()) {
            return {
                text: 'PLAY AGAIN',
                icon: 'fas fa-redo-alt' // Refresh/retry icon
            };
        } else {
            return {
                text: 'NEXT LEVEL',
                icon: 'fas fa-arrow-right' // Right arrow icon
            };
        }
    },
    
    // Static game properties (unchanged from original)
    RAINBOW_PIECES: 10,
    RAINBOW_COLORS: [
        '#ff0000', // Red
        '#ff8000', // Orange  
        '#ffff00', // Yellow
        '#00ff00', // Green
        '#0000ff', // Blue
        '#4b0082', // Indigo
        '#9400d3', // Violet
        '#ff1493', // Deep Pink
        '#00ced1', // Dark Turquoise
        '#ffd700'  // Gold
    ],
    
    // Bead properties
    BEADS_PER_BAR: 10,
    TOTAL_BEADS: 20,
    BEAD_COLORS: {
        BLUE: '#4285f4',
        RED: '#ea4335'
    },
    
    // Physics and interaction
    SNAP_DISTANCE: 5,
    DRAG_THRESHOLD: 3,
    SNAP_SPEED: 200,
    MAGNETIC_RANGE: 15,
    
    // Layout (percentages of container)
    TOP_BAR_POSITION: 34,
    BOTTOM_BAR_POSITION: 60,
    BAR_LEFT_MARGIN: 6,
    BAR_RIGHT_MARGIN: 8,
    BAR_THICKNESS: 5,
    
    // Audio
    AUDIO_ENABLED: true,
    
    // Timing
    FLASH_DURATION: 800,
    NEXT_QUESTION_DELAY: 2000
};
