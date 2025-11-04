# Variabilité & Scénarios

## 1. Liste des paramètres de variabilité

| Nom du paramètre | Type | Domaine | CT / RT / UI | Valeur par défaut | Contraintes / Effet |
|------------------|------|----------|--------------|-------------------|---------------------|
| **board_size** | entier | [4–20] | CT | 10 | Taille du plateau carré (NxN) ; modifie la topologie. |
| **piece_color** (logical) | enum | {white, black, red, blue} | CT | {white, black} | Identifiant logique des camps (joueurs). |
| **piece_quantity** | entier | [1–30] | CT | 20 | Nombre de pions par camp. |
| **can_promote** | booléen | {true, false} | CT | false | Active la promotion des pions en dames. |
| **dice_enabled** | booléen | {true, false} | CT | true | Active le lancer de dés dans les règles. |
| **dice_faces** | entier | [2–12] | CT | 6 | Nombre de faces du dé ; influe sur les probabilités. |
| **dice_quantity** | entier | [1–3] | CT | 1 | Nombre de dés à lancer simultanément. |
| **first_player** | enum | {white, black, random} | CT | white | Définit qui commence la partie. |
| **can_move_backward** | booléen | {true, false} | CT | false | Interdit ou autorise les mouvements arrière. |
| **mandatory_capture** | booléen | {true, false} | CT | true | Oblige à capturer si capture disponible. |
| **capture_allowed** | booléen | {true, false} | CT | true | Active la capture d'adversaires. |
| **goal_type** | enum | {WinByCapture, WinBySolitaire, WinByForfeit} | CT | WinByCapture | Définit la condition de victoire. |
| **light_squares_color** | string (hex) | couleur | UI | #F0D9B5 | Couleur des cases claires du damier. |
| **dark_squares_color** | string (hex) | couleur | UI | #B58863 | Couleur des cases sombres du damier. |
| **highlight_color** | string (hex) | couleur | UI | #FFFF00 | Couleur de surbrillance pour coups légaux. |
| **piece_sprites** | map | {color → path} | UI | {} | Chemins vers images des pions (apparence visuelle). |
| **board_style** | enum | {grid, isometric, 3d} | UI | grid | Style de rendu du plateau. |
| **show_captured** | booléen | {true, false} | UI | true | Affiche les pièces capturées à l'écran. |
| **animation_speed** | entier | [1–5] | RT | 3 | Vitesse d'animation à l'écran. |
| **show_legal_moves** | booléen | {true, false} | RT | false | Active les indications de coups légaux. |
| **sound_enabled** | booléen | {true, false} | RT | true | Active les sons du jeu. |
| **ai_difficulty** | entier | [1–5] | RT | 2 | Profondeur de recherche pour l'IA. |

---

## 2. Presets (combinaisons typiques CT)

### **Preset 1 — Dames classiques**
- Plateau : 10×10 (taille 10)
- Pièces : white/black, 20 par camp
- Promotion : activée (canPromote: true)
- Dé : désactivé
- Règles : alternance, capture obligatoire (mandatoryCapture: true), mouvement arrière interdit
- Objectif : WinByCapture

**Effet :** jeu de dames standard sans hasard.

---

### **Preset 2 — Dames à Dé**
- Plateau : 10×10
- Pièces : white/black, 20 par camp
- Dé : activé, 6 faces, 1 dé
- Règles : capture autorisée mais non obligatoire, mouvement arrière autorisé
- Objectif : WinByCapture

**Effet :** le résultat du dé influence les tours — le hasard s'ajoute à la stratégie.

---

### **Preset 3 — Mode Solitaire**
- Plateau : 8×8
- Pièces : une seule couleur (white), 20 pions
- Dé : activé, 6 faces
- Règles : capture obligatoire
- Objectif : WinBySolitaire (removeOwn: true, movesLeft: 0)

**Effet :** adaptation en jeu solo, objectif de réduire les pions à un seul.

---

### **Preset 4 — Mini Dames**
- Plateau : 6×6
- Pièces : white/black, 6 par camp
- Promotion : désactivée
- Dé : désactivé
- Règles : capture non obligatoire
- Objectif : WinByCapture

**Effet :** version rapide et simplifiée pour débutants.

---

## 3. Scénarios d'usage

### **Scénario 1 — Modification Compile-time (Structure du jeu)**
Un concepteur change `board_size` de 10 à 8 et `piece_quantity` de 20 à 12.
→ La structure du plateau est régénérée en 8×8.
→ Chaque joueur commence avec 12 pions au lieu de 20.
→ Les positions initiales sont recalculées.

**Impact :** Changement fondamental de la structure du jeu, nécessite une nouvelle compilation/génération.

---

### **Scénario 2 — Modification UI (Apparence visuelle)**
Un joueur change le thème visuel :
- `light_squares_color`: `#F0D9B5` → `#E8E8E8` (blanc cassé)
- `dark_squares_color`: `#B58863` → `#2C3E50` (bleu foncé)
- `piece_sprites`: remplace les images par des sprites futuristes

→ L'affichage est rechargé avec le nouveau thème.
→ La logique de jeu, l'état des pions et les règles restent identiques.
→ Aucun impact sur le déroulement de la partie en cours.

**Impact :** Changement purement cosmétique, aucune recompilation nécessaire.

---

### **Scénario 3 — Ajustement Run-time (Expérience utilisateur)**
Pendant une partie, le joueur modifie :
- `animation_speed`: 3 → 5 (accélère les animations)
- `show_legal_moves`: false → true (active les aides visuelles)
- `ai_difficulty`: 2 → 4 (IA plus forte)

→ Les animations deviennent plus rapides immédiatement.
→ Les coups légaux sont désormais surlignés.
→ L'IA prend plus de temps pour calculer (recherche plus profonde).
→ L'état du jeu et les règles ne changent pas.

**Impact :** Ajustement de l'expérience en temps réel, sans affecter la logique.

---

### **Scénario 4 — Variation avec Dés (Compile-time)**
Le paramètre `dice_enabled` passe de `false` à `true`, avec `dice_faces: 6` et `dice_quantity: 1`.
→ Les règles du jeu incluent désormais un lancer de dé avant chaque tour.
→ Le résultat du dé peut affecter le nombre de cases déplaçables.
→ La structure de tour change fondamentalement (tour = lancer dé + mouvement).

**Impact :** Changement structurel majeur, nouvelle variante du jeu.

---

## 4. Séparation des responsabilités

### **Compile-Time (CT) — Structure du jeu**
Définit ce qu'est le jeu :
- Taille du plateau
- Nombre et type de pièces
- Règles de mouvement et de capture
- Conditions de victoire
- Présence ou non de hasard (dés)

**Ces paramètres nécessitent une recompilation/régénération car ils changent la logique fondamentale.**

### **UI/Skin — Apparence visuelle**
Définit comment le jeu apparaît :
- Couleurs du plateau (cases claires/sombres)
- Sprites des pièces
- Style de rendu (grille 2D, isométrique, 3D)
- Éléments d'affichage (pièces capturées, etc.)

**Ces paramètres sont purement cosmétiques et ne modifient pas la logique.**

### **Run-Time (RT) — Expérience utilisateur**
Définit comment le jeu est ressenti :
- Vitesse des animations
- Aides visuelles (coups légaux)
- Sons activés/désactivés
- Difficulté de l'IA

**Ces paramètres sont ajustables pendant le jeu sans affecter l'état ou les règles.**

---

## 5. Cohérence des couleurs

**Distinction importante :**

### Couleur logique (CT - dans `Pieces`)
```
piece Player1 {
    color white      // ← Identifiant logique du joueur
    quantity 12
}
```
Cette couleur identifie le joueur dans la logique du jeu. C'est une propriété structurelle.

### Couleur visuelle (UI - dans `Theme` et `Sprites`)
```
ui {
    theme {
        lightSquares: "#F0D9B5"    // ← Apparence des cases
        darkSquares: "#B58863"
    }
    sprites {
        white: "assets/white.png"  // ← Apparence des pions blancs
        black: "assets/black.png"
    }
}
```
Ces couleurs/images définissent l'apparence visuelle. Un pion logiquement "white" peut être rendu avec n'importe quelle couleur ou sprite.

**Exemple :** Un joueur "white" (logique) peut avoir des pions rouges visuellement (UI).

---