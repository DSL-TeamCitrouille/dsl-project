
## Summary of Variants

| Variant | Board Size | Pieces/side | Movements | Dice | Capture Oblig. | Theme UI | Visual Aids | AI |
|---------|------------|-------------|----|------------|--------------------|----------|-----------|-----|
| 1. Classic | 8 | 12 | Diagonal, no return | No | Yes | Beige/Brown | Yes | 2 |
| 2. Royal | 10 | 10 | All directions + return | Yes | Yes | Gold/Purple | No | 3 |
| 3. Limited | 8 | 8  | Orthogonal, no return | No | Yes | Gray/Blue | No | 4 |
| 4. FastDark | 8 | 12 | Diagonal + return | No | Yes | Yellow/Green | No | 3 |
| 5. Solitaire | 6 | 35 (1 player) | Orthogonal, no return | No | Yes | Ivory/Light Blue | Yes | 0 |
| 6. BubbleGum | 10 | 20 | Orthogonal + return | Yes | No | Pink/Light Blue | Yes | 3 |


## Validation of TP Constraints

# At least 3 CT differences:

Variant 2 – Royal 
- 6-sided dice added
- Direction “any” + backward allowed
- 10×10 board

Variant 3 – Limited
- Orthogonal only
- Fewer pieces (8)
- No backward

Variant 5 – SolitaireLight
- Single player
- 6×6 board
- Completely different objective (solitaire)

# At least 2 RT differences:

Variant 4 – FastDark: 
- Legal moves not displayed 
- Average AI (3)

Variant 5 – SolitaireLight: 
- Legal moves displayed
- AI disabled (0)

# UI/skin adapted in each variant:

Variant 1 – Classic: 
- Beige/brown theme.

Variant 2 – Royal: 
- Gold/purple theme.

Variant 3 – Limited: 
- Gray/black theme.

Variant 4 – FastDark: 
- Dark gray/crimson theme.

Variant 5 – SolitaireLight: 
- Ivory/light blue/green theme.

Variant 6 – BubbleGum: 
- Very colorful pink/light blue theme.


## Key Differences Between Variants
### Compile-Time (Game Structure):

Board size: 6 → 10

Number of pieces: 8 → 35, 1 player possible

Dice: present (Royal, BubbleGum) / absent

Movements: diagonal, orthogonal, any

Backward: depending on variant

Mandatory capture: yes/no

Objectives: capture / forfeit / solitaire