
## Récapitulatif des Variantes

| Variant | Board Size | Pièces/camp | Dé | Capture Oblig. | Thème UI | Animation | IA |
|---------|------------|-------------|----|-----------|--------------------|----------|-----------|-----|
| 1. Classiques | 8 | 12 | Non | Oui | Beige/Marron | 2 | 2 |
| 2. Royal | 10 | 12 | Oui | Non | Gold/Purple | 3 | 3 |
| 3. Limited | 8 | 8  | Non | Non | Gris/Bleu | 3 | 4 |
| 4. FastDark | 8 | 12 | Non | Non | Jaune/Vert | 2 | 1 |
| 5. Solitaire | 6 | 35 (1 joueur) | Non | Oui | Ivoire/BleuClair | 2 | 0 |

## Validation des Contraintes TP

# Au moins 3 différences CT :

Variant 2 – Royal : ajout d’un dé et direction de déplacement libre (any), captures facultatives.

Variant 3 – Limited : plateau réduit et mouvements orthogonaux, moins de pièces.

Variant 5 – SolitaireLight : un seul joueur, plateau 7×7, objectif totalement différent (solitaire).

# Au moins 2 différences RT :

Variant 4 – FastDark : animation rapide (5), coups légaux désactivés (false), IA moyenne (3).

Variant 5 – SolitaireLight : animation lente (2), coups légaux affichés (true), IA désactivée (0).

# UI/skin adaptée dans chaque variant :

Variant 1 – Classic : Thème beige/marron, ambiance traditionnelle.

Variant 2 – Royal : Thème or/violet, style luxueux.

Variant 3 – Limited : Thème gris/noir/rouge, minimaliste et froid.

Variant 4 – FastDark : Thème gris foncé/crimson, ambiance “ombre” rapide.

Variant 5 – SolitaireLight : Thème ivoire/bleu clair/vert, visuel apaisant et lumineux.

## Différences Clés Entre les Variants
# Compile-Time (Structure du jeu) :

Taille plateau : varie de 6 à 10 cases (plus petit = plus rapide, plus grand = plus stratégique).

Nombre de pions : de 8 à 48 selon la variante (1 joueur pour Solitaire).

Dés : présents (variant 2 – Royal), absents (variants 1, 3, 4, 5).

Capture obligatoire : oui (variants 1, 3, 4, 5), non (variants 2).

Objectif :

winByCapture → variants 1, 2, 3, 4

winBySolitaire → variant 5

winByForfeit -> 2, 3, 4