# Comment générer le code 
```
npm install
npm run langium:generate
npm run build
```
## Pour lancer les variantes avec X étant l'index de la variantes: 
```
node packages/cli/bin/cli.js generate packages/language/src/examples/[varianteX/varianteX.dam] packages/language/src/outputGenerator/[varianteX].html
node packages/cli/bin/cli.js generate packages/language/src/examples/variante1/variante1.dam packages/language/src/outputGenerator/variante1.html
node packages/cli/bin/cli.js generate packages/language/src/examples/variante2/variante2.dam packages/language/src/outputGenerator/variante2.html
node packages/cli/bin/cli.js generate packages/language/src/examples/variante3/variante3.dam packages/language/src/outputGenerator/variante3.html
node packages/cli/bin/cli.js generate packages/language/src/examples/variante4/variante4.dam packages/language/src/outputGenerator/variante4.html
node packages/cli/bin/cli.js generate packages/language/src/examples/variante5/variante5.dam packages/language/src/outputGenerator/variante5.html
node packages/cli/bin/cli.js generate packages/language/src/examples/variante6/variante6.dam packages/language/src/outputGenerator/variante6.html

```

## Pour lancer les tests
```
npx tsx packages/language/src/test/validation-test.ts
npx tsx packages/language/src/test/generation-test.ts 
```
/!\ Pour que la validation des fichiers générés fonctionnnent, il faut que ceux-ci soient placés dans le dossier packages/language/src/outputGenerator/* comme expliqué précédemment

---

# Hiérarchie du projet

```
.
├── packages/
|   ├── cli/
|   │   ├── bin/
|   |   |   ├── cli.js      
|   │   ├── src/
|   |   |   ├── generator.js
|   |   |   ├── htmlGenerator.js    
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

# Summary of Variants

| Variant | Board Size | Pieces/side | Movements | Dice | Capture Oblig. | Theme UI | Visual Aids | AI |
|---------|------------|-------------|----|------------|--------------------|----------|-----------|-----|
| 1. Classic | 8 | 12 | Diagonal, no return | No | Yes | Beige/Brown | Yes | 2 |
| 2. Royal | 10 | 10 | All directions + return | Yes | Yes | Gold/Purple | No | 3 |
| 3. Limited | 8 | 8  | Orthogonal, no return | No | Yes | Gray/Blue | No | 4 |
| 4. FastDark | 8 | 12 | Diagonal + return | No | Yes | Yellow/Green | No | 3 |
| 5. Solitaire | 6 | 35 (1 player) | Orthogonal, no return | No | Yes | Ivory/Light Blue | Yes | 0 |
| 6. BubbleGum | 10 | 20 | Orthogonal + return | Yes | No | Pink/Light Blue | Yes | 3 |


# Validation of TP Constraints

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
- Average AI (3)

Variant 5 – SolitaireLight: 
- Legal moves displayed
- AI disabled (0)

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
