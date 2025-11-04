# **Sous-domaine : Jeu de plateau en damier**

## **Périmètre**

### **Concepts Objets**
- **Jetons :**  
  - 20 jetons noirs  
  - 20 jetons blancs  
  - Variante : possibilité de changer les couleurs  
- **Damier :**  
  - Plateau 10 × 10 cases  

### **Hasard**
- Dé à 6 faces utilisé pour influencer les déplacements ou les actions  

---

## **Coups / Règles**

1. **Tour de jeu :**
   - Les déplacements se font en alternance entre les joueurs noir et blanc.    

2. **Déplacements :**
   - Interdiction de sortir du damier.  
   - Un seul lancé de dé par tour.  
   - Interdiction de revenir en arrière, sauf pour manger un pion adverse.  

3. **Actions possibles :**
   - À chaque tour, un joueur peut :
     - Effectuer un déplacement, ou
     - Manger un pion adverse.  

4. **Manger :** 
   - Il est possible d’enchaîner plusieurs prises (manger plusieurs pions à la suite).  
   - Les enchaînements de déplacements vides (sans manger) sont interdits.  

---

## **Objectifs de victoire**

- Manger tous les jetons adverses.
- Manger tous ses propres jetons sauf un (mode solitaire).  
- Victoire par forfait de l’adversaire.  

---

## **Familles de jeux visées / non visées**

### **Jeux visés**
- Jeux de plateau à 2 joueurs  
- Jeux de plateau à 1 joueur (mode solitaire) 
- Jeux de dés  
- Tournois de dames possibles  

### **Jeux non visés**
- Pas de 3D
- Pas de tournois multi-tables  

---

## **Pourquoi c’est atteignable et fécond en variantes**

- Grand nombre de variantes de dames déjà existantes, adaptables avec le dé.  
- Possibilité de transformer en jeu solitaire (objectif : ne garder qu’un pion).  
- Ajout du hasard et de la stratégie via le dé → renouvellement du gameplay.  
- Variantes simples à inventer :  
  - Règles spéciales selon le résultat du dé  
  - Pions spéciaux ou pouvoirs  
  - Modes de jeu alternatifs 



---

# Comment générer le code 
```
npm install
npm run langium:generate
npm run build
```
## Pour lancer les variantes avec X étant l'index de la variantes: 
```
node packages/cli/bin/cli.js generate packages/language/src/examples/[varianteX/varianteX.dam] packages/language/src/examples/[varianteX/preview/variante_res]
```

## Pour lancer les tests
```
```
---

# Hiérarchie du projet

```
.
├── src/
│   ├── language/
|   |   ├── src/
|   |   |   ├── docs/      
|   |   |   |   ├── metamodel_vs_ast.md
|   |   |   |   ├── services_notes.md
|   |   |   |   ├── state_of_the_art.md
|   |   |   |   └── variability.md
│   │   |   ├── dam-dam.langium
│   │   |   ├── dam-dam-validator.ts
│   │   |   ├── generator/
|   |   |   ├── examples/      
|   |   |   |   ├── variante1/
|   |   |   |   |   ├── preview/
|   |   |   |   |   |   ├── variante_res
|   |   |   |   |   ├── variante1.dam
|   |   |   |   |   └── NOTESV1.md
|   |   |   |   ├── variante2/...
|   |   |   |   └── ...
|   |   |   ├── README.md
|   |   |   ├── tests/
|   |   |   │   └── generation-test.ts
|   |   |   └── ...
|   ├── package.json
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

