# Cartographie de l’existant et originalité

## Références

### 1. GDL (Game Description Language) — DSL / Règles
- **Catégorie :** DSL / Règles de jeu  
- **Langage/Runtime :** Programmation logique (type Prolog)  
- **Licence :** Ouverte  
- **Familles de jeux :** Jeux de plateau à information parfaite  
- **Expressivité des règles :**
  - État : Oui  
  - Hasard : Non (Oui dans GDL-II avec le mot-clé `random`)  
  - Information cachée : Non (Oui dans GDL-II avec le mot-clé `sees`)  
- **Variabilité :** À la compilation (différentes définitions de jeu)  
- **Interopérabilité :** Protocole texte, plateforme Stanford GGP  
- **Maturité et activité :** Mature (depuis 2000), largement utilisée dans la recherche académique  
- **URL :** [http://games.stanford.edu/games/gdl.html](http://games.stanford.edu/games/gdl.html)

---

### 2. Ludii — DSL / Système de jeu
- **Catégorie :** DSL / Système de jeu / Cadre IA  
- **Langage/Runtime :** Java, langage basé sur les "ludemes"  
- **Licence :** Open source  
- **Familles de jeux :** Plus de 1000 jeux de plateau traditionnels (dames, échecs, go, etc.)  
- **Expressivité des règles :**
  - État : Très complet  
  - Hasard : Oui  
  - Information cachée : Oui  
- **Variabilité :** Élevée (à la compilation via les ludemes, à l’exécution via des paramètres)  
- **Interopérabilité :** Ludii Game Logic Language (L-GDL), intégration IA  
- **Maturité et activité :** Très actif (depuis 2019), financé par le projet ERC Digital Ludeme  
- **URL :** [https://ludii.games/](https://ludii.games/)

---

### 3. Pygame / Bibliothèques de jeux Python — Cadre d’interface
- **Catégorie :** Interface utilisateur / Cadre de jeu  
- **Langage/Runtime :** Python (multi-plateforme)  
- **Licence :** LGPL  
- **Familles de jeux :** Jeux 2D (jeux de plateau, arcade, plateformes)  
- **Expressivité des règles :** Implémentation purement programmatique  
- **Variabilité :** À l’exécution (dans le code)  
- **Interopérabilité :** Écosystème Python, intégrable à toute autre bibliothèque Python  
- **Maturité et activité :** Très mature (plus de 20 ans), grande communauté  
- **URL :** [https://www.pygame.org/](https://www.pygame.org/)

---

### 4. UCI (Universal Chess Interface) — Protocole / Format
- **Catégorie :** Protocole / Format  
- **Langage/Runtime :** Protocole texte (indépendant du langage)  
- **Licence :** Ouverte  
- **Familles de jeux :** Échecs et variantes  
- **Expressivité des règles :** Représentation des positions et communication des coups  
- **Variabilité :** Paramètres spécifiques au moteur via `setoption`  
- **Interopérabilité :** Protocole standard entre moteurs et interfaces graphiques (plus de 300 moteurs compatibles)  
- **Maturité et activité :** Très mature (depuis 2000), norme industrielle  
- **URL :** [https://www.chessprogramming.org/UCI](https://www.chessprogramming.org/UCI)

---

### 5. MCTS (Monte Carlo Tree Search) — Cadre IA
- **Catégorie :** IA / Algorithme de recherche  
- **Langage/Runtime :** Implémentations multiples (Python, Java, C++)  
- **Licence :** Variable selon les implémentations (souvent open source)  
- **Familles de jeux :** Jeux de plateau à grand facteur de branchement (Go, Échecs, Hex, etc.)  
- **Expressivité des règles :** Nécessite une interface d’état de jeu et une génération de coups  
- **Variabilité :** Paramètres de l’algorithme (itérations, constante d’exploration)  
- **Interopérabilité :** Intégrable à tout moteur de jeu disposant d’une API d’état/action  
- **Maturité et activité :** Domaine de recherche très actif (depuis 2006), utilisé dans AlphaGo  
- **URL :** [https://en.wikipedia.org/wiki/Monte_Carlo_tree_search](https://en.wikipedia.org/wiki/Monte_Carlo_tree_search)

---

### 6. Python Arcade Library — Moteur d’interface
- **Catégorie :** Interface utilisateur / Moteur de jeu  
- **Langage/Runtime :** Python (basé sur OpenGL)  
- **Licence :** MIT  
- **Familles de jeux :** Jeux 2D (arcade, plateformes, plateau)  
- **Expressivité des règles :** Implémentation programmatique  
- **Variabilité :** À l’exécution via les paramètres du code  
- **Interopérabilité :** Écosystème Python, système de sprites, moteur physique  
- **Maturité et activité :** Actif (depuis les années 2010), bien documenté  
- **URL :** [https://api.arcade.academy/](https://api.arcade.academy/)

---

## Tableau comparatif

| Nom | Catégorie | Langage/Runtime | Familles de jeux | Expressivité des règles (état / hasard / info cachée) | Variabilité (compilation / exécution) | Interopérabilité (formats / protocoles) | Maturité et activité | URL |
|------|------------|----------------|------------------|--------------------------------------------------------|----------------------------------------|------------------------------------------|------------------------|-----|
| **GDL** | DSL / Règles | Logique (type Prolog) | Jeux de plateau à information parfaite | État : Oui, Hasard : Non (Oui dans GDL-II), Info cachée : Non (Oui dans GDL-II) | À la compilation | Protocole texte, Stanford GGP | Mature (2000+), standard académique | [Lien](http://games.stanford.edu) |
| **Ludii** | DSL / Système / IA | Java, L-GDL | 1000+ jeux de plateau | État : Oui, Hasard : Oui, Info cachée : Oui | À la compilation et à l’exécution | L-GDL, API IA, export | Très actif (2019+), financé ERC | [Lien](https://ludii.games) |
| **Pygame** | Cadre d’interface | Python | Jeux 2D, plateau | Implémentation programmatique | À l’exécution | Écosystème Python | Très mature (20+ ans) | [Lien](https://pygame.org) |
| **UCI** | Protocole | Protocole texte | Variantes d’échecs | Position / coups uniquement | À l’exécution (`setoption`) | Protocole standard moteur/interface | Très mature (2000+), norme industrielle | [Lien](https://chessprogramming.org/UCI) |
| **MCTS** | Algorithme IA | Langages multiples | Jeux à fort facteur de branchement | Nécessite interface de jeu | À l’exécution (paramètres algorithmiques) | API indépendante du jeu | Recherche très active (2006+) | [Lien](https://en.wikipedia.org/wiki/MCTS) |
| **Python Arcade** | Moteur d’interface | Python | Jeux 2D | Implémentation programmatique | À l’exécution | Python, sprites, physique | Actif (années 2010+) | [Lien](https://api.arcade.academy) |

---

## Note d’originalité

### Existe-t-il un langage externe très proche de votre idée ?
Oui et non.  
Ludii est le plus proche conceptuellement, car il modélise également des jeux de plateau avec variabilité.  
Cependant, aucun DSL existant ne combine spécifiquement :

- Les **jeux de dames (checkers)** comme domaine principal  
- **L’ajout de dés** comme élément de hasard dans un jeu traditionnellement déterministe  
- Une **syntaxe simple et lisible** inspirée de **Langium**  
  (exemple : `direction diagonal`, `chaining captures true`)  
- Une **variabilité explicite**, distinguant les paramètres à la compilation et à l’exécution  
- Une **intégration de services** (mode texte, graphique, IA, complexité, LLM) dès la conception

---

## Axes différenciants

1. **Domaine ciblé et accessible**  
   Le DSL se concentre spécifiquement sur les jeux de plateau en damier (type dames), ce qui le rend plus simple et accessible que des systèmes généraux comme GDL ou Ludii qui tentent de couvrir tous les types de jeux.

2. **Innovation de gameplay**  
    L'ajout de dés aux jeux de dames traditionnels est une innovation ludique. Aucun des DSLs étudiés ne propose spécifiquement cette combinaison de jeu déterministe + élément de hasard dans le domaine des dames.

3. **Syntaxe moderne et lisible**  
   Inspirée de Langium, la syntaxe est claire et proche du langage naturel, contrairement au style Prolog de GDL ou aux structures complexes de Ludii.

4. **Variabilité explicite**  
   Séparation nette entre la structure du jeu (paramètres à la compilation) et les réglages d’exécution (paramètres dynamiques) ce qui n'est pas toujours explicite dans les autres systèmes.

5. **Intégration des services**  
   Conçu dès le départ pour supporter différents modes et services : mode texte, interface graphique, IA, analyse de complexité et intégration LLM alors que les autres systèmes ont évolué de manière plus organique.

---
