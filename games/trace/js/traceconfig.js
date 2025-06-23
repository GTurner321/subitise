const CONFIG = {
    NUMBERS_TO_COMPLETE: 10,
    RAINBOW_PIECES: 10,
    
    SLIDER_SIZE: 40,
    PATH_TOLERANCE: 50, // Large capture zone for easy dragging
    FILL_COLOR: '#90EE90',
    OUTLINE_COLOR: '#333333',
    SLIDER_COLOR: '#FF6B6B',
    ARROW_COLOR: '#4ECDC4',
    PATH_WIDTH: 8,
    OUTLINE_WIDTH: 3,
    ARROW_OFFSET: 50,
    ARROW_SIZE: 20,
    
    SVG_WIDTH: 400,
    SVG_HEIGHT: 400,
    NUMBER_RECT_HEIGHT: 200,
    NUMBER_RECT_WIDTH: 120,
    NUMBER_CENTER_X: 200,
    NUMBER_CENTER_Y: 200,
    
    COMPLETION_DELAY: 2000,
    SLIDER_TRANSITION_SPEED: '0.1s',
    
    AUDIO_ENABLED: true,
    
    NUMBER_WORDS: {
        0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four',
        5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine'
    },
    
    STROKE_DEFINITIONS: {
        0: {
            strokes: [{
                id: 'oval_coords',
                startPoint: { x: 140, y: 200 },
                coordinates: [
                    { x: 0, y: 100 }, { x: 5, y: 120 }, { x: 10, y: 135 }, { x: 15, y: 150 }, 
                    { x: 20, y: 160 }, { x: 25, y: 170 }, { x: 30, y: 178 }, { x: 35, y: 185 }, 
                    { x: 40, y: 190 }, { x: 45, y: 194 }, { x: 50, y: 197 }, { x: 55, y: 199 }, 
                    { x: 60, y: 200 }, { x: 65, y: 199 }, { x: 70, y: 197 }, { x: 75, y: 194 }, 
                    { x: 80, y: 190 }, { x: 85, y: 185 }, { x: 90, y: 178 }, { x: 95, y: 170 }, 
                    { x: 98, y: 160 }, { x: 100, y: 150 }, { x: 100, y: 135 }, { x: 98, y: 120 }, 
                    { x: 95, y: 105 }, { x: 90, y: 90 }, { x: 85, y: 78 }, { x: 80, y: 68 }, 
                    { x: 75, y: 60 }, { x: 70, y: 54 }, { x: 65, y: 50 }, { x: 60, y: 47 }, 
                    { x: 55, y: 46 }, { x: 50, y: 45 }, { x: 45, y: 46 }, { x: 40, y: 47 }, 
                    { x: 35, y: 50 }, { x: 30, y: 54 }, { x: 25, y: 60 }, { x: 20, y: 68 }, 
                    { x: 15, y: 78 }, { x: 10, y: 90 }, { x: 5, y: 105 }, { x: 0, y: 120 },
                    { x: 0, y: 100 }
                ],
                description: 'Draw 0 using precise coordinates',
                type: 'coordinates'
            }]
        },
        1: {
            strokes: [{
                id: 'line_coords',
                startPoint: { x: 200, y: 100 },
                coordinates: [
                    { x: 0, y: 0 }, { x: 0, y: 20 }, { x: 0, y: 40 }, { x: 0, y: 60 },
                    { x: 0, y: 80 }, { x: 0, y: 100 }, { x: 0, y: 120 }, { x: 0, y: 140 },
                    { x: 0, y: 160 }, { x: 0, y: 180 }, { x: 0, y: 200 }
                ],
                description: 'Draw 1 straight down',
                type: 'coordinates'
            }]
        },
        2: {
            strokes: [{
                id: 'complete_two_coords',
                startPoint: { x: 140, y: 150 },
                coordinates: [
                    { x: 0, y: 50 }, { x: 5, y: 45 }, { x: 10, y: 42 }, { x: 15, y: 40 },
                    { x: 20, y: 38 }, { x: 25, y: 37 }, { x: 30, y: 36 }, { x: 35, y: 35 },
                    { x: 40, y: 35 }, { x: 45, y: 35 }, { x: 50, y: 35 }, { x: 55, y: 35 },
                    { x: 60, y: 36 }, { x: 65, y: 37 }, { x: 70, y: 38 }, { x: 75, y: 40 },
                    { x: 80, y: 42 }, { x: 85, y: 45 }, { x: 90, y: 50 }, { x: 95, y: 55 },
                    { x: 98, y: 60 }, { x: 100, y: 65 }, { x: 98, y: 70 }, { x: 95, y: 75 },
                    { x: 90, y: 80 }, { x: 80, y: 90 }, { x: 70, y: 100 }, { x: 60, y: 110 },
                    { x: 50, y: 120 }, { x: 40, y: 130 }, { x: 30, y: 140 }, { x: 20, y: 150 },
                    { x: 10, y: 160 }, { x: 0, y: 170 }, { x: 0, y: 175 }, { x: 10, y: 175 },
                    { x: 20, y: 175 }, { x: 30, y: 175 }, { x: 40, y: 175 }, { x: 50, y: 175 },
                    { x: 60, y: 175 }, { x: 70, y: 175 }, { x: 80, y: 175 }, { x: 90, y: 175 },
                    { x: 100, y: 175 }
                ],
                description: 'Draw 2 using precise coordinates',
                type: 'coordinates'
            }]
        },
        3: {
            strokes: [{
                id: 'three_coords',
                startPoint: { x: 140, y: 110 },
                coordinates: [
                    { x: 0, y: 90 }, { x: 10, y: 85 }, { x: 20, y: 82 }, { x: 30, y: 80 },
                    { x: 40, y: 80 }, { x: 50, y: 80 }, { x: 60, y: 80 }, { x: 70, y: 82 },
                    { x: 80, y: 85 }, { x: 90, y: 90 }, { x: 95, y: 95 }, { x: 98, y: 100 },
                    { x: 100, y: 105 }, { x: 98, y: 110 }, { x: 95, y: 115 }, { x: 90, y: 120 },
                    { x: 80, y: 125 }, { x: 70, y: 128 }, { x: 60, y: 130 }, { x: 50, y: 130 },
                    { x: 40, y: 130 }, { x: 50, y: 130 }, { x: 60, y: 130 }, { x: 70, y: 132 },
                    { x: 80, y: 135 }, { x: 90, y: 140 }, { x: 95, y: 145 }, { x: 98, y: 150 },
                    { x: 100, y: 155 }, { x: 98, y: 160 }, { x: 95, y: 165 }, { x: 90, y: 170 },
                    { x: 80, y: 175 }, { x: 70, y: 178 }, { x: 60, y: 180 }, { x: 50, y: 180 },
                    { x: 40, y: 180 }, { x: 30, y: 180 }, { x: 20, y: 178 }, { x: 10, y: 175 },
                    { x: 0, y: 170 }
                ],
                description: 'Draw 3 using precise coordinates',
                type: 'coordinates'
            }]
        },
        4: {
            strokes: [
                {
                    id: 'angle_line_coords',
                    startPoint: { x: 176, y: 100 },
                    coordinates: [
                        { x: 30, y: 0 }, { x: 25, y: 20 }, { x: 20, y: 40 }, { x: 15, y: 60 },
                        { x: 10, y: 80 }, { x: 5, y: 100 }, { x: 0, y: 120 }, { x: 20, y: 120 },
                        { x: 40, y: 120 }, { x: 60, y: 120 }, { x: 80, y: 120 }, { x: 100, y: 120 }
                    ],
                    description: 'Draw the angled line and horizontal line',
                    type: 'coordinates'
                },
                {
                    id: 'vertical_line_coords',
                    startPoint: { x: 212, y: 160 },
                    coordinates: [
                        { x: 60, y: 40 }, { x: 60, y: 20 }, { x: 60, y: 0 }
                    ],
                    description: 'Draw the vertical line',
                    type: 'coordinates'
                }
            ]
        },
        5: {
            strokes: [{
                id: 'five_coords',
                startPoint: { x: 140, y: 100 },
                coordinates: [
                    { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 40, y: 0 }, { x: 60, y: 0 },
                    { x: 80, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 20 }, { x: 80, y: 20 },
                    { x: 60, y: 20 }, { x: 40, y: 20 }, { x: 20, y: 20 }, { x: 0, y: 20 },
                    { x: 0, y: 40 }, { x: 0, y: 60 }, { x: 0, y: 80 }, { x: 0, y: 100 },
                    { x: 20, y: 100 }, { x: 40, y: 100 }, { x: 60, y: 102 }, { x: 80, y: 105 },
                    { x: 90, y: 110 }, { x: 95, y: 115 }, { x: 98, y: 120 }, { x: 100, y: 125 },
                    { x: 100, y: 130 }, { x: 98, y: 135 }, { x: 95, y: 140 }, { x: 90, y: 145 },
                    { x: 80, y: 150 }, { x: 70, y: 153 }, { x: 60, y: 155 }, { x: 50, y: 155 },
                    { x: 40, y: 155 }, { x: 30, y: 153 }, { x: 20, y: 150 }, { x: 10, y: 145 },
                    { x: 0, y: 140 }
                ],
                description: 'Draw 5 using precise coordinates',
                type: 'coordinates'
            }]
        },
        6: {
            strokes: [{
                id: 'six_coords',
                startPoint: { x: 218, y: 100 }, // Starting at coordinate (65,200) scaled
                coordinates: [
                    { x: 65, y: 200 }, { x: 60, y: 199 }, { x: 55, y: 197 }, { x: 50, y: 194 }, 
                    { x: 45, y: 191 }, { x: 40, y: 186 }, { x: 35, y: 181 }, { x: 30, y: 175 }, 
                    { x: 25, y: 167 }, { x: 20, y: 158 }, { x: 15, y: 147 }, { x: 10, y: 132 }, 
                    { x: 8, y: 125 }, { x: 6, y: 117 }, { x: 4, y: 107 }, { x: 2, y: 93 }, 
                    { x: 1, y: 84 }, { x: 0, y: 60 }, { x: 1, y: 48 }, { x: 2, y: 43 }, 
                    { x: 4, y: 36 }, { x: 6, y: 32 }, { x: 8, y: 27 }, { x: 10, y: 24 }, 
                    { x: 15, y: 17 }, { x: 20, y: 12 }, { x: 25, y: 8 }, { x: 30, y: 5 }, 
                    { x: 35, y: 3 }, { x: 40, y: 1 }, { x: 45, y: 0 }, { x: 50, y: 0 }, 
                    { x: 55, y: 0 }, { x: 60, y: 1 }, { x: 65, y: 3 }, { x: 70, y: 5 }, 
                    { x: 75, y: 8 }, { x: 80, y: 12 }, { x: 85, y: 17 }, { x: 90, y: 24 }, 
                    { x: 92, y: 27 }, { x: 94, y: 32 }, { x: 96, y: 36 }, { x: 98, y: 43 }, 
                    { x: 99, y: 48 }, { x: 100, y: 60 }, { x: 99, y: 72 }, { x: 98, y: 77 }, 
                    { x: 96, y: 84 }, { x: 94, y: 88 }, { x: 92, y: 93 }, { x: 90, y: 96 }, 
                    { x: 85, y: 103 }, { x: 80, y: 108 }, { x: 75, y: 112 }, { x: 70, y: 115 }, 
                    { x: 65, y: 117 }, { x: 60, y: 119 }, { x: 55, y: 120 }, { x: 50, y: 120 }, 
                    { x: 45, y: 120 }, { x: 40, y: 119 }, { x: 35, y: 117 }, { x: 30, y: 115 }, 
                    { x: 25, y: 112 }, { x: 20, y: 108 }, { x: 15, y: 103 }, { x: 10, y: 96 }, 
                    { x: 8, y: 93 }, { x: 6, y: 88 }, { x: 4, y: 84 }, { x: 2, y: 77 }, 
                    { x: 1, y: 72 }, { x: 0, y: 60 }
                ],
                description: 'Draw 6 using precise coordinates',
                type: 'coordinates'
            }]
        },
        7: {
            strokes: [{
                id: 'seven_coords',
                startPoint: { x: 140, y: 100 }, // Starting at coordinate (0,200) scaled
                coordinates: [
                    { x: 0, y: 200 }, { x: 10, y: 200 }, { x: 20, y: 200 }, { x: 30, y: 200 },
                    { x: 40, y: 200 }, { x: 50, y: 200 }, { x: 60, y: 200 }, { x: 70, y: 200 },
                    { x: 80, y: 200 }, { x: 90, y: 200 }, { x: 100, y: 200 }, { x: 95, y: 180 },
                    { x: 90, y: 160 }, { x: 85, y: 140 }, { x: 80, y: 120 }, { x: 75, y: 100 },
                    { x: 70, y: 80 }, { x: 65, y: 60 }, { x: 60, y: 40 }, { x: 55, y: 20 },
                    { x: 50, y: 10 }, { x: 45, y: 5 }, { x: 40, y: 2 }, { x: 35, y: 1 },
                    { x: 33, y: 0 }
                ],
                description: 'Draw 7 using precise coordinates - horizontal line then diagonal',
                type: 'coordinates'
            }]
        },
        8: {
            strokes: [{
                id: 'figure_eight_continuous',
                startPoint: { x: 240, y: 130 },
                path: 'M 240 130 C 240 115 225 100 200 100 C 175 100 160 115 160 130 C 160 145 175 160 200 160 C 225 160 240 175 240 200 C 240 225 225 240 200 240 C 175 240 160 255 160 270 C 160 285 175 300 200 300 C 225 300 240 285 240 270 C 240 255 225 240 200 240 C 175 240 160 225 160 200 C 160 175 175 160 200 160 C 225 160 240 145 240 130',
                description: 'Draw figure-8 in one continuous motion, crossing in middle'
            }]
        },
        9: {
            strokes: [{
                id: 'nine',
                startPoint: { x: 250, y: 140 },
                path: 'M 250 140 C 250 115 225 100 200 100 C 175 100 150 115 150 140 C 150 165 175 180 200 180 C 225 180 250 165 250 140 L 250 300',
                description: 'Draw 9'
            }]
        }
    },
    
    RAINBOW_COLORS: [
        '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00',
        '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff'
    ],
    
    NUMBERS_SEQUENCE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    DEBUG_MODE: false,
    SHOW_START_POINTS: true
};
