# Variabilité & Scénarios

## 1. Liste des paramètres de variabilité

| Nom du paramètre | Type | Domaine | CT / RT | Valeur par défaut | Contraintes / Effet |
|------------------|------|----------|----------|-------------------|---------------------|
| **board_size** | entier | [4–20] | CT | 10 | Taille du plateau (carré N×N). |
| **piece_colors** | tuple | {(noir, blanc), (rouge, bleu)} | CT | (noir, blanc) | Couleurs des camps. |
| **piece_quantity** | entier | [1–30] | CT | 20 | Nombre de pions par camp. |
| **dice_enabled** | booléen | {true, false} | CT | true | Active le lancer de dés dans les règles. |
| **dice_faces** | entier | [2–12] | CT | 6 | Nombre de faces du dé ; influe sur les probabilités. |
| **first_player** | enum | {blanc, noir, aléatoire} | CT | blanc | Définit qui commence la partie. |
| **can_move_back** | booléen | {true, false} | CT | false | Interdit ou autorise les mouvements arrière. |
| **capture_allowed** | booléen | {true, false} | CT | true | Active la capture d’adversaires. |
| **chain_allowed** | booléen | {true, false} | CT | true | Permet des enchaînements de captures. |
| **goal_type** | enum | {WinByCapture, WinBySolitaire, WinByForfeit} | CT | WinByCapture | Définit la condition de victoire. |
| **theme** | enum | {classique, bois, futuriste} | RT | classique | Thème graphique du damier. |
| **show_hints** | booléen | {true, false} | RT | false | Active les indications de coups légaux. |
| **animation_speed** | entier | [1–5] | RT | 3 | Vitesse d’animation à l’écran. |
| **ai_difficulty** | entier | [1–5] | RT | 2 | Profondeur de recherche pour l’IA. |

---

## 2. Presets (combinaisons typiques CT)

### **Preset 1 — Dames classiques**
- Plateau : 10×10  
- Pièces : noir/blanc, 20 par camp  
- Dé : désactivé  
- Règles : alternance, capture autorisée, chaînes autorisées  
- Objectif : WinByCapture  

**Effet :** jeu de dames standard sans hasard.

---

### **Preset 2 — Dames à Dé**
- Plateau : 10×10  
- Pièces : noir/blanc  
- Dé : activé, 6 faces, mode = move_range  
- Règles : capture autorisée, mouvement arrière uniquement en capture  
- Objectif : WinByCapture  

**Effet :** la valeur du dé détermine la portée du mouvement — le hasard influence la stratégie.

---

### **Preset 3 — Mode Solitaire**
- Plateau : 8×8  
- Pièces : une seule couleur, 20 pions  
- Dé : activé  
- Règles : capture obligatoire, chaînes autorisées  
- Objectif : WinBySolitaire  

**Effet :** adaptation en jeu solo, objectif de réduire les pions à un seul.

---

## 3. Scénarios d’usage

### **Scénario 1 — Modification Compile-time**
Un concepteur modifie `board_size` de 10 à 8.  
→ Le DSL régénère automatiquement la configuration du plateau, la position initiale des pièces et les limites de déplacement.  
→ Les règles de capture et de mouvement s’adaptent à la nouvelle taille, modifiant la durée moyenne et la complexité du jeu.

---

### **Scénario 2 — Ajustement Run-time**
Pendant une partie, le joueur change `theme` de “classique” à “futuriste”.  
→ L’affichage est rechargé avec un nouveau skin, sans affecter la logique de jeu ni l’état en cours.

---

### **Scénario 3 — Variation du dé**
Le paramètre `dice_effect_mode` passe de `move_range` à `special_action`.  
→ Le résultat du dé déclenche des effets (bonus, captures forcées, double déplacement).  
→ Le comportement des tours change, mais la structure du plateau reste identique.

---