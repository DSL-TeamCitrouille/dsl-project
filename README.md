# Comment générer le code 
```
npm install
npm run langium:generate
npm run build
```
## Pour lancer les variantes avec X étant l'index de la variantes: 
```
node packages/cli/bin/cli.js generate packages/language/src/examples/[varianteX/varianteX.dam] packages/language/src/outputGenerator/[varianteX].html
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

# Récapitulatif des Variantes

| Variant | Board Size | Pièces/camp | Dé | Capture Oblig. | Thème UI | Animation | IA |
|---------|------------|-------------|----|-----------|--------------------|----------|-----------|
| 1. Classiques | 8 | 12 | Non | Oui | Beige/Marron | 2 | 2 |
| 2. Royal | 10 | 12 | Oui | Non | Gold/Purple | 3 | 3 |
| 3. Limited | 8 | 8  | Non | Non | Gris/Bleu | 3 | 4 |
| 4. FastDark | 8 | 12 | Non | Non | Jaune/Vert | 2 | 1 |
| 5. SolitaireLight | 6 | 35 (1 joueur) | Non | Oui | Ivoire/BleuClair | 2 | 0 |

## Validation des Contraintes TP

### Au moins 3 différences CT :

Variant 2 – Royal : ajout d’un dé et direction de déplacement libre (any), captures facultatives.

Variant 3 – Limited : plateau réduit et mouvements orthogonaux, moins de pièces.

Variant 5 – SolitaireLight : un seul joueur, plateau 7×7, objectif totalement différent (solitaire).

### Au moins 2 différences RT :

Variant 4 – FastDark : animation rapide (5), coups légaux désactivés (false), IA moyenne (3).

Variant 5 – SolitaireLight : animation lente (2), coups légaux affichés (true), IA désactivée (0).

## UI/skin adaptée dans chaque variant :

Variant 1 – Classic : Thème beige/marron, ambiance traditionnelle.

Variant 2 – Royal : Thème or/violet, style luxueux.

Variant 3 – Limited : Thème gris/noir/rouge, minimaliste et froid.

Variant 4 – FastDark : Thème gris foncé/crimson, ambiance “ombre” rapide.

Variant 5 – SolitaireLight : Thème ivoire/bleu clair/vert, visuel apaisant et lumineux.

## Différences Clés Entre les Variants
### Compile-Time (Structure du jeu) :

Taille plateau : varie de 6 à 10 cases (plus petit = plus rapide, plus grand = plus stratégique).

Nombre de pions : de 8 à 48 selon la variante (1 joueur pour Solitaire).

Dés : présents (variant 2 – Royal), absents (variants 1, 3, 4, 5).

Capture obligatoire : oui (variants 1, 3, 4, 5), non (variants 2).

Objectif :

- winByCapture → variants 1, 2, 3, 4
- winBySolitaire → variant 5
- winByForfeit -> 2, 3, 4

