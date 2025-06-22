const CONFIG = {
    NUMBERS_TO_COMPLETE: 10,
    RAINBOW_PIECES: 10,
    
    SLIDER_SIZE: 40,
    PATH_TOLERANCE: 8, // Much stricter tolerance for precise coordinate following
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
                startPoint: { x: 140, y: 200 }, // Scaled start point (flipped Y)
                coordinates: [
                    { x: 0, y: 100 }, { x: 1, y: 120 }, { x: 2, y: 128 }, { x: 4, y: 139 }, 
                    { x: 6, y: 147 }, { x: 8, y: 154 }, { x: 10, y: 160 }, { x: 15, y: 171 }, 
                    { x: 20, y: 180 }, { x: 25, y: 187 }, { x: 30, y: 192 }, { x: 35, y: 195 }, 
                    { x: 40, y: 198 }, { x: 45, y: 199 }, { x: 50, y: 200 }, { x: 55, y: 199 }, 
                    { x: 60, y: 198 }, { x: 65, y: 195 }, { x: 70, y: 192 }, { x: 75, y: 187 }, 
                    { x: 80, y: 180 }, { x: 85, y: 171 }, { x: 90, y: 160 }, { x: 92, y: 154 }, 
                    { x: 94, y: 147 }, { x: 96, y: 139 }, { x: 98, y: 128 }, { x: 99, y: 120 }, 
                    { x: 100, y: 100 }, { x: 99, y: 80 }, { x: 98, y: 72 }, { x: 96, y: 61 }, 
                    { x: 94, y: 53 }, { x: 92, y: 46 }, { x: 90, y: 40 }, { x: 85, y: 29 }, 
                    { x: 80, y: 20 }, { x: 75, y: 13 }, { x: 70, y: 8 }, { x: 65, y: 5 }, 
                    { x: 60, y: 2 }, { x: 55, y: 1 }, { x: 50, y: 0 }, { x: 45, y: 1 }, 
                    { x: 40, y: 2 }, { x: 35, y: 5 }, { x: 30, y: 8 }, { x: 25, y: 13 }, 
                    { x: 20, y: 20 }, { x: 15, y: 29 }, { x: 10, y: 40 }, { x: 8, y: 46 }, 
                    { x: 6, y: 53 }, { x: 4, y: 61 }, { x: 2, y: 72 }, { x: 1, y: 80 }, 
                    { x: 0, y: 100 }
                ],
                description: 'Draw 0 using precise coordinates',
                type: 'coordinates'
            }]
        },
        1: {
            strokes: [{
                id: 'line',
                startPoint: { x: 200, y: 100 },
                path: 'M 200 100 L 200 300',
                description: 'Draw down'
            }]
        },
        2: {
            strokes: [{
                id: 'complete_two_coords',
                startPoint: { x: 140, y: 250 }, // Scaled start point
                coordinates: [
                    { x: 0, y: 150 }, { x: 1, y: 160 }, { x: 2, y: 164 }, { x: 4, y: 170 }, 
                    { x: 6, y: 174 }, { x: 8, y: 177 }, { x: 10, y: 180 }, { x: 15, y: 186 }, 
                    { x: 20, y: 190 }, { x: 25, y: 193 }, { x: 30, y: 196 }, { x: 35, y: 198 }, 
                    { x: 40, y: 199 }, { x: 45, y: 200 }, { x: 50, y: 200 }, { x: 55, y: 200 }, 
                    { x: 60, y: 199 }, { x: 65, y: 198 }, { x: 70, y: 196 }, { x: 75, y: 193 }, 
                    { x: 80, y: 190 }, { x: 85, y: 186 }, { x: 90, y: 180 }, { x: 92, y: 177 }, 
                    { x: 94, y: 174 }, { x: 96, y: 170 }, { x: 98, y: 164 }, { x: 99, y: 160 }, 
                    { x: 100, y: 150 }, { x: 99, y: 140 }, { x: 98, y: 136 }, { x: 96, y: 130 }, 
                    { x: 94, y: 126 }, { x: 92, y: 123 }, { x: 90, y: 120 }, { x: 0, y: 0 }, 
                    { x: 100, y: 0 }
                ],
                description: 'Draw 2 using precise coordinates',
                type: 'coordinates'
            }]
        },
        3: {
            strokes: [{
                id: 'curves',
                startPoint: { x: 140, y: 100 },
                path: 'M 140 100 C 165 100 200 100 200 100 C 235 100 260 105 260 130 C 260 155 235 160 215 180 C 235 200 260 205 260 230 C 260 255 235 300 200 300 C 165 300 140 295 140 285',
                description: 'Draw 3'
            }]
        },
        4: {
            strokes: [{
                id: 'angle',
                startPoint: { x: 140, y: 100 },
                path: 'M 140 100 L 190 250 L 260 250',
                description: 'Draw angle'
            }, {
                id: 'vertical',
                startPoint: { x: 210, y: 100 },
                path: 'M 210 100 L 210 300',
                description: 'Draw line'
            }]
        },
        5: {
            strokes: [{
                id: 'top',
                startPoint: { x: 140, y: 100 },
                path: 'M 140 100 L 260 100',
                description: 'Draw top'
            }, {
                id: 'curve',
                startPoint: { x: 140, y: 100 },
                path: 'M 140 100 L 140 200 C 140 200 165 200 200 200 C 235 200 260 210 260 240 C 260 270 235 280 200 280 C 165 280 140 270 140 240',
                description: 'Draw curve'
            }]
        },
        6: {
            strokes: [{
                id: 'curve',
                startPoint: { x: 240, y: 120 },
                path: 'M 240 120 C 240 110 220 100 200 100 C 180 100 160 110 160 120 C 160 130 160 140 160 150 L 160 250 C 160 270 180 280 200 280 C 220 280 240 270 240 250 C 240 230 220 220 200 220 C 180 220 160 230 160 240',
                description: 'Draw 6 avoiding overlap'
            }]
        },
        7: {
            strokes: [{
                id: 'line',
                startPoint: { x: 140, y: 100 },
                path: 'M 140 100 L 260 100 L 180 300',
                description: 'Draw 7'
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
