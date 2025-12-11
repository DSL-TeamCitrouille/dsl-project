# How to generate the code and play the different variants available
```
npm install
npm run langium:generate
npm run build
```
## Environment Setup

### Required Environment Variables
Create a `.env` file in the root directory with the following variables:
```
# OpenRouter API Key (required for LLM bot)
OPENROUTER_API_KEY=your_api_key_here
```
### LLM Backend Setup
Install Python dependencies:
```
pip install flask flask-cors flask-limiter python-dotenv requests
```
If you encounter an "externally managed environment" error:
```
python3 -m venv venv 
source /your/path/to/project/venv/bin/activate
pip install flask flask-cors flask-limiter python-dotenv requests
```
**Start the LLM server:**
```
python3 ./packages/cli/src/scripts/LLM/LLM_connection.py
```

⚠️ **Important:** The Flask server must be running for LLM bot functionality. Keep it running in a separate terminal while testing variants.

---

## Game Modes
The game supports multiple player configurations, which can be modified at runtime
| Mode | Description | 
|------|-------------|
| **pvp** | player vs player | 
| **pvb** | Human vs AI Bot | 
| **pvl** | Human vs LLM Bot | 
| **bvb** | AI Bot vs AI Bot |
| **lvl** | LLM Bot vs AI Bot | 
*player is used as short for human player

---

## Launching Variants
### Basic Command Structure
```
node packages/cli/bin/cli.js generate \
  packages/language/src/examples/[variantX]/[variantX].dam \
  packages/language/src/outputGenerator/[variantX].html \
  [OPTIONS]
```
### Available Options
| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `--firstPlayer` | string/number | Override first player | `--firstPlayer white` or `--firstPlayer 1` |
| `--mandatoryCapture` | boolean | Override mandatory capture rule | `--mandatoryCapture true` |
| `--message` | string | Override capture message | `--message "MiamMiamMiam!"` |
| `--moveBackward` | boolean | Allow backward movement | `--moveBackward true` |
| `--botDifficulty` | string | AI difficulty (random/greedy/heuristic) | `--botDifficulty greedy` |
| `--seed`  | integer | Deterministic seed to reproduce randomness | `--seed=42` |
| `--headless` | integer : [0,1] | Launches game with or without UI | `--headless=1` |

---

### Example Commands
```
node packages/cli/bin/cli.js generate \
  packages/language/src/examples/variante1/variante1.dam \
  packages/language/src/outputGenerator/variante1.html \
  --mandatoryCapture false \
  --moveBackward true \
  --message "Gotcha!"
  --botDifficulty "greedy"
```
---

### Open the generated HTML file in your browser
open packages/language/src/outputGenerator/varianteX.html

---

## Headless Mode
**BLABALBALBALBALABALBALBAABALB**

---

# Testing

## Validation Tests
Test variant validation rules:
```
npx tsx packages/language/src/test/validation-test.ts
```
## Generation Tests
Test HTML generation for all variants:
```
npx tsx packages/language/src/test/generation-test.ts 
```
⚠️ **Important:** Generated HTML files must be in `packages/language/src/outputGenerator/` for validation tests to work.

---

# Project hierarchy

```
.
├── packages/
|   ├── cli/
|   │   ├── bin/
|   |   |   ├── cli.js      
|   │   ├── src/
|   |   |   ├── scripts/  
|   |   |   |   ├── LLM/
|   |   |   |   |   ├── LLM_connection.py
|   |   |   |   |   └── LLMBot.ts
|   |   |   |   ├── app.ts
|   |   |   |   ├── game.ts
|   |   |   |   ├── ui.ts
|   |   |   |   └── ...
|   |   |   ├── generator.js
|   |   |   ├── htmlGeneratorPlayable.js    
|   |   |   └── main.js
|   ├── extension/...
│   ├── language/
|   |   ├── src/
|   |   |   ├── docs/      
|   |   |   |   ├── metamodel_vs_ast.md
|   |   |   |   ├── services_notes.md
|   |   |   |   ├── state_of_the_art.md
|   |   |   |   └── variability.md
|   |   |   ├── examples/      
|   |   |   |   ├── variante1/
|   |   |   |   |   ├── variante_preview
|   |   |   |   |   ├── variante1.dam
|   |   |   |   |   └── NOTESV1.md
|   |   |   |   ├── variante2/...
|   |   |   |   └── ...
|   |   |   ├── model/...
|   |   |   ├── outputGenerator/
|   |   |   |   ├── variante1.html
|   |   |   |   └── ...
|   |   |   ├── test/
|   |   |   |   ├── generation-test.ts
|   |   |   |   └── validation-test.ts
│   │   |   ├── dam-dam.langium
│   │   |   ├── dam-dam-validator.ts
|   |   |   ├── dam-dam-generation.ts
|   |   |   ├── README.md
|   |   |   └── ...
|   ├── package.json
|   ├── README.md
│   └── ...

```

# Summary of Variants and Tests

| Variant | Board Size | Pieces/side | Movements | Dice | Mandatory Capture | Theme UI | Test : AI | Test : Seed |
|---------|------------|-------------|----|------------|--------------------|----------|---------------|-----------|
| 1. Classic | 8 | 12 | Diagonal, no return | No | Yes | Beige/Brown | heuristic | blabla |
| 2. Royal | 10 | 10 | All directions + return | Yes | Yes | Gold/Purple | random | balbalb |
| 3. Limited | 8 | 8  | Orthogonal, no return | No | Yes | Gray/Blue | heuristic | blabalba |
| 4. FastDark | 8 | 12 | Diagonal + return | No | Yes | Yellow/Green | greedy | blabla |
| 5. Solitaire | 6 | 35 (1 player) | Orthogonal, no return | No | Yes | Ivory/Light Blue | random | balbal |
| 6. BubbleGum | 10 | 20 | Orthogonal + return | Yes | No | Pink/Light Blue | random | blabla |

*Each test was only extended to 10 moves so there was never any winner

# Validation of Constraints

## At least 3 CT differences:

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

## At least 2 RT differences:

Variant 4 – FastDark: 
- Legal moves not displayed 
- mode is pvp
- darkMode is one

Variant 5 – SolitaireLight: 
- Legal moves displayed
- mode is lvl
- darkMode is off

## UI/skin adapted in each variant:

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

Variant 5 – BubbleGum: 
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

AI difficulty: random / heuristic / greedy
