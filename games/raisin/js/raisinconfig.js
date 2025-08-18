/**
 * Raisin Game Configuration
 * Contains all game settings, difficulty levels, audio messages, and timing configurations
 */
const CONFIG = {
    // Game progression
    RAINBOW_PIECES: 10,
    TOTAL_QUESTIONS: 10,
    
    // Simplified level system
    LEVEL_SYSTEM: {
        LEVEL_1: {
            TOTAL_RAISINS: 5,
            CONSECUTIVE_CORRECT_NEEDED: 3, // 3 questions in a row must be answered right first time
            POSSIBLE_MISSING: [1, 2, 3, 4, 5], // Set of missing raisins (now includes 5)
            name: 'Level 1'
        },
        LEVEL_2: {
            TOTAL_RAISINS: 10,
            POSSIBLE_MISSING: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Set of missing raisins
            name: 'Level 2'
        }
    },
    
    // Guinea pig sizes (relative to game area height - simpler system)
    GUINEA_PIG_SIZES: {
        GP3: 24,  // 24% of game area height (16% * 1.5)
        GP2: 60,  // 60% of game area height (40% * 1.5)
        GP1: 60   // 60% of game area height (40% * 1.5)
    },
    
    // Timing configurations
    FLASH_DURATION: 800,
    NEXT_QUESTION_DELAY: 2000,
    GUINEA_PIG_3_INITIAL_DISPLAY: 4000,
    INITIAL_INSTRUCTION_DELAY: 1000,
    RAISIN_STAGGER_START: 1000,
    RAISIN_STAGGER_WINDOW: 3000,
    RAISIN_FADE_DURATION: 500,
    GUINEA_PIG_ANIMATION_DURATION: 2000,
    GUINEA_PIG_PAUSE_DURATION: 500,
    
    // Raisin settings
    RAISIN_SIZE: 0.08,
    RAISIN_MIN_DISTANCE: 0.12,
    
    // Missing raisin markers (red circles with crosses)
    MISSING_MARKER_OPACITY: 0.7,
    MISSING_MARKER_CROSS_COLOR: '#dc143c',
    MISSING_MARKER_CIRCLE_COLOR: 'rgba(255, 0, 0, 0.3)',
    
    // Game area exclusions - area to avoid placing raisins (for Guinea Pig 3)
    GUINEA_PIG_3_EXCLUSION: {
        x: 0,
        y: 0,
        width: 0.25,
        height: 0.25
    },
    
    // Audio settings
    AUDIO: {
        GUINEA_PIG_EATING_SOUND: '../../assets/raisin/guineapigeating.mp3',
        GUINEA_PIG_SOUND_VOLUME: 0.7,
        
        LEVEL_1_MESSAGES: {
            FIRST_QUESTION: '', // Removed "Watch the hungry guinea pig"
            FIRST_INSTRUCTION: 'There are 5 raisins. The hungry guinea pig is going to eat some of them.',
            QUESTION: 'How many raisins did the guinea pig eat?',
            SUBSEQUENT_QUESTION: 'There are 5 raisins. Watch the guinea pig.',
            WRONG_ANSWER_HINT: 'Count the missing raisins.'
        },
        
        LEVEL_2_MESSAGES: {
            FIRST_QUESTION: '', // Removed "Watch the hungry guinea pig"
            FIRST_INSTRUCTION: 'There are 10 raisins. The hungry guinea pig is going to eat some of them.',
            QUESTION: 'How many raisins did the guinea pig eat?',
            SUBSEQUENT_QUESTION: 'There are 10 raisins. Watch the guinea pig.',
            WRONG_ANSWER_HINT: 'Count the missing raisins.'
        },
        
        ENCOURAGEMENTS: [
            'Well done!', 
            'Excellent!', 
            'Perfect!', 
            'Great counting!',
            'Super!',
            'Brilliant!'
        ],
        
        HINTS: [
            'Try counting how many more will make 5.',
            'Try counting how many more will make 10.',
            'Count how many raisins are left.',
            'Think about how many the guinea pig ate.'
        ],
        
        COMPLETION_MESSAGE: 'Well done! You have correctly counted how many raisins the guinea pig ate in all of the questions. Play again or return to the home page.',
        
        // Choice modal messages after completing 5-raisin questions
        CHOICE_MODAL: {
            TITLE: 'Great job!',
            MESSAGE: '', // Removed text message - only audio
            AUDIO_MESSAGE: 'Great job! You have completed the 5 raisin questions. Would you like to continue with 5 raisins or try the harder 10 raisin questions?',
            CONTINUE_5_BUTTON: 'Continue with 5 raisins',
            TRY_10_BUTTON: 'Try 10 raisins'
        }
    },
    
    // Button colors for the game
    COLORS: [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
        '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'
    ],
    
    // Helper functions for simplified level system
    isLevel1: function(currentLevel) {
        return currentLevel === 1;
    },
    
    getTotalRaisins: function(currentLevel) {
        return currentLevel === 1 ? 
            this.LEVEL_SYSTEM.LEVEL_1.TOTAL_RAISINS : 
            this.LEVEL_SYSTEM.LEVEL_2.TOTAL_RAISINS;
    },
    
    getButtonCount: function(currentLevel) {
        // Return appropriate button count based on level
        return currentLevel === 1 ? 5 : 10;
    },
    
    getAudioMessages: function(currentLevel) {
        return currentLevel === 1 ? 
            this.AUDIO.LEVEL_1_MESSAGES : 
            this.AUDIO.LEVEL_2_MESSAGES;
    },
    
    getHintMessage: function(currentLevel) {
        // For inactivity hints, use level-appropriate messages
        if (currentLevel === 1) {
            // Level 1 (5 raisins) - rotate through these hints
            const level1Hints = [
                'Try counting how many more will make 5.',
                'Count how many raisins are left.',
                'Think about how many the guinea pig ate.'
            ];
            return level1Hints[Math.floor(Math.random() * level1Hints.length)];
        } else {
            // Level 2 (10 raisins) - rotate through these hints  
            const level2Hints = [
                'Try counting how many more will make 10.',
                'Count how many raisins are left.',
                'Think about how many the guinea pig ate.'
            ];
            return level2Hints[Math.floor(Math.random() * level2Hints.length)];
        }
    }
};
