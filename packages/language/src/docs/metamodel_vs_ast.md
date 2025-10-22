# Comparaison Métamodèle vs AST TypeScript

## 1. Table de Correspondance

### Concepts Principaux

| Métamodèle (PlantUML) | AST Langium (Grammaire) | Type de Relation | Commentaires |
|----------------------|------------------------|------------------|--------------|
| **Game** | **Damier** | Renommage | Meilleur reflet du domaine |
| Game.name | Damier.name | Direct
| Game.demarrer() | Non présent | Suppression | Les méthodes ne sont pas dans l'AST (logique runtime à implémenter ailleurs) |
| Game.verifierVictoire() | Non présent | Suppression | A implémenter ailleurs également |

### Structure de Jeu (Compile-time)

| Métamodèle | AST Langium | Type | Commentaires |
|------------|-------------|------|--------------|
| **Damier** | **Board** | Renommage | L'ancien Damier est renommé en Board dans la grammaire |
| Damier.tailleX, tailleY | Board.size (INT) | Fusion | Ajout de la contrainte d'un plateau carré |
| Damier.cases[][] | Non présent | Suppression | Structure générée dynamiquement au runtime |
| **Case** | Non présent | Suppression | Cases créées à l'exécution, pas dans l'AST |
| Case.x, y, pion | Non présent | Suppression | État du jeu, pas structure |

### Pièces et Joueurs

| Métamodèle | AST Langium | Type | Commentaires |
|------------|-------------|------|--------------|
| **Pion** | **Piece** | Renommage | Terme anglais adopté |
| Pion.couleur | Piece.color | Direct | Correspondance directe |
| Pion.position | Non présent | Suppression | Position = état runtime |
| **Player** | Non présent | Ajout | Les joueurs sont implicites via les couleurs dans les règles |
| Player.id, couleur, nbJetons | Piece.color, quantity | Fusion partielle | Quantité dans Piece, identification par couleur |
| **Couleur** (enum) | ID (terminal) | Transformation | Flexible - accepte n'importe quel identifiant de couleur |

### Règles et Mouvements

| Métamodèle | AST Langium | Type | Commentaires |
|------------|-------------|------|--------------|
| **Rule** (when/then) | **Rules** { rule[] } | Restructuration | Approche déclarative avec types de règles spécifiques |
| Rule.when, then | Non présent | Suppression | Remplacé par des règles typées |
| **Move** | **MoveRule** | Spécialisation | Plus structuré et spécifique |
| Non présent | **CaptureRule** | Ajout | Séparation explicite capture/mouvement |
| Non présent | **ActionRule** | Ajout | Distinction claire des types d'actions |
| Move.description | MoveRule (propriétés) | Éclatement | Structure plus fine (direction, alternating, etc.) |

### Objectifs

| Métamodèle | AST Langium | Type | Commentaires |
|------------|-------------|------|--------------|
| **Goal** | **Objective** { goal[] } | Renommage | Terme plus formel |
| Goal.kind, description | **WinByCapture** / **WinBySolitaire** / **WinByForfeit** | Spécialisation | Types d'objectifs explicites au lieu d'un champ "kind" |
| Non présent | WinByCapture.target | Ajout | Précision sur la pièce à capturer |
| Non présent | WinBySolitaire.removeOwn, movesLeft | Ajout | Paramètres spécifiques au solitaire |

### État et Randomisation

| Métamodèle | AST Langium | Type | Commentaires |
|------------|-------------|------|--------------|
| **State** | Non présent | Suppression | État runtime, pas dans la définition du jeu |
| State.tourActuel, nbTours | Non présent | Suppression | Géré par le moteur de jeu |
| **Randomness** | **Dice** (optionnel) | Renommage | Plus spécifique - dés au lieu de randomness générique |
| Randomness.source | Dice.faces | Transformation | Nombre de faces au lieu de description textuelle |
| Randomness.lancerDe() | Non présent | Suppression | Méthode implémentée côté runtime |

### UI et Paramètres

| Métamodèle | AST Langium | Type | Commentaires |
|------------|-------------|------|--------------|
| **Parameter** (compile/run) | Séparation **UI** / **Settings** | Restructuration majeure | Distinction claire compile-time vs runtime |
| Parameter.kind | Implicite (UI=skin, Settings=runtime) | Transformation | Structure architecturale vs métadonnée |
| Non présent | **Theme** (lightSquares, darkSquares, highlight) | Ajout | Personnalisation visuelle détaillée |
| Non présent | **Sprites** | Ajout | Support des sprites personnalisés |
| Non présent | **Layout** (showCaptured) | Ajout | Options de disposition |
| Non présent | **Settings** (animationSpeed, showLegalMoves, aiDifficulty) | Ajout | Paramètres UX détaillés |
| **Preset** | Non présent | Suppression | Presets gérables via fichiers .damdam séparés |

---

## 2. Arbitrages et Justifications

### Fusions

1. **Damier.tailleX/Y → Board.size**
   - **Pourquoi** : La grammaire cible les jeux de damier carrés (8×8, 10×10)
   - **Impact** : Simplifie la syntaxe, mais limite à des plateaux carrés
   - **Alternative considérée** : Garder width/height pour plateaux rectangulaires

2. **Player + Pion → Piece avec quantity**
   - **Pourquoi** : Dans un DSL déclaratif, on définit des types de pièces (ex: "12 pions noirs")
   - **Impact** : Les instances de joueurs sont créées au runtime
   - **Avantage** : Plus proche de la façon dont on décrit un jeu ("le jeu a 12 pions blancs")

### Renommages

1. **Game → Damier**
   - **Pourquoi** : Ancrage dans le domaine métier (jeux de damier)
   - **Impact** : Plus explicite mais moins générique

2. **Pion → Piece**
   - **Pourquoi** : Convention anglaise, interopérabilité
   - **Impact** : Cohérence avec une codebase internationale

3. **Goal → Objective / Goal types**
   - **Pourquoi** : Clarté terminologique + spécialisation
   - **Impact** : AST plus expressif avec types distincts

### Suppressions

1. **Case, Position, State**
   - **Pourquoi** : Ce sont des structures **runtime**, pas des définitions de jeu
   - **Impact** : L'AST reste focalisé sur la **définition** du jeu
   - **Justification** : Séparation claire définition (DSL) vs exécution (moteur)

2. **Méthodes (demarrer, verifierVictoire, lancerDe)**
   - **Pourquoi** : Un AST représente des **données**, pas du comportement
   - **Impact** : Les méthodes seront implémentées dans l'interpréteur/compilateur
   - **Justification** : Principe MDE - le métamodèle décrit, le générateur implémente

3. **Preset**
   - **Pourquoi** : Peut être géré par plusieurs fichiers `.damdam` (ex: `checkers.damdam`, `chess-variant.damdam`)
   - **Impact** : Simplifie la grammaire, favorise la modularité
   - **Alternative** : Imports entre fichiers DSL

### Ajouts

1. **UI / Settings avec sous-structures détaillées**
   - **Pourquoi** : Besoin exprimé dans le commentaire grammaire (COMPILE-TIME vs RUN-TIME)
   - **Impact** : Permet de configurer finement l'apparence et l'expérience
   - **Valeur** : Rend le DSL utilisable pour des jeux complets, pas juste des règles

2. **Spécialisation des Rules (MoveRule, CaptureRule, ActionRule)**
   - **Pourquoi** : Les règles when/then étaient trop génériques
   - **Impact** : AST plus typé, validation plus forte
   - **Valeur** : Erreurs détectées à la compilation, pas au runtime

3. **Spécialisation des Goals (WinByCapture, etc.)**
   - **Pourquoi** : Idem - remplace un champ `kind: String`
   - **Impact** : Meilleure completion IDE, validation stricte
   - **Valeur** : Expérience développeur améliorée

### Transformations Majeures

1. **Parameter.kind → Architecture UI/Settings**
   - **Avant** : Liste plate de paramètres avec un flag "compile" ou "run"
   - **Après** : Structure hiérarchique claire (Board/Pieces = compile, Settings = run, UI = skin)
   - **Justification** : Meilleure séparation des préoccupations, plus maintenable

2. **Couleur enum → ID terminal**
   - **Avant** : Énumération fixe BLANC/NOIR
   - **Après** : Identifiants libres (ex: "red", "blue", "green")
   - **Justification** : Flexibilité pour jeux multi-joueurs ou thématiques