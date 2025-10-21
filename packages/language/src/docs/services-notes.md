# Services – Notes de conception du DSL



## 1. Légalité & Coups

Le DSL doit permettre de décrire des règles de jeu suffisantes pour déterminer la légalité d’un coup, la fin de partie et la validité des séquences d’actions.  
Chaque coup doit pouvoir être validé ou refusé automatiquement en fonction des règles définies (mouvements autorisés, captures, interdictions, bornes du damier).  
Le système doit aussi pouvoir expliquer, en langage clair, pourquoi une action est illégale ou pourquoi la partie se termine.

---

## 2. Complexité

Le langage devra exposer les paramètres nécessaires pour analyser la complexité d’une variante : facteur de branchement (nombre moyen de coups possibles), profondeur de partie moyenne, résolubilité (éventuellement bornée).  
L’utilisateur doit pouvoir évaluer et comparer la difficulté ou la richesse stratégique de différentes variantes définies dans le DSL.  
Ces mesures doivent pouvoir être calculées automatiquement à partir des définitions de règles et d’état.

---

## 3. Mode Texte

Le DSL doit permettre une représentation textuelle stable des états du jeu et des coups.  
Il doit définir une notation claire pour les déplacements, les captures et les configurations initiales, afin de pouvoir jouer en ligne de commande ou via des scripts.  
Des commandes simples doivent permettre de jouer, d’annuler un coup, de rejouer une partie ou de charger une configuration sauvegardée.

---

## 4. Mode Graphique / Skin

Le DSL doit pouvoir être lié à un moteur graphique capable de rendre le damier, les pions et leurs états (actif, capturé, promu, etc.).  
Les thèmes visuels (couleurs, textures, disposition du damier) et les styles d’interface (classique, moderne, abstrait) doivent être paramétrables.  
L’objectif est que le même code de règles puisse être visualisé avec différents rendus, sans modification de la logique du jeu.

---

## 5. IA Basique

Le langage doit prévoir la génération automatique d’un adversaire simple basé sur des heuristiques de base (choix aléatoire parmi les coups légaux, ou préférence pour les captures).  
Cette IA doit pouvoir jouer contre un humain dans n’importe quelle variante décrite par le DSL.  
L’objectif est de fournir un outil minimal pour tester rapidement la validité et la jouabilité des règles.

---

## 6. IA Plus Forte (ex. MCTS)

Le DSL doit inclure des points d’intégration permettant de brancher des algorithmes de recherche plus avancés tels que le **Monte Carlo Tree Search (MCTS)** ou d’autres méthodes d’apprentissage par renforcement.  
Ces intégrations ne sont pas obligatoires à implémenter dans un premier temps, mais le langage doit permettre d’exposer les informations nécessaires (états, coups légaux, transitions, récompenses).  
Ainsi, toute variante écrite dans le DSL pourra être utilisée pour des expérimentations d’IA avancée sans adaptation spécifique.

---

## 7. Jeu avec LLM

Le DSL doit pouvoir interagir avec un modèle de langage (LLM) capable de comprendre et jouer selon les règles décrites.  
Chaque variante définie doit pouvoir être traduite en un format interprétable par le LLM, avec un vocabulaire cohérent pour les actions et les états.  
Le but est de permettre à un LLM de commenter, expliquer ou même participer à une partie en suivant les règles générées par le DSL.

---

## 8. Comparaison / Évaluation de variantes

Le système doit permettre de définir, charger et comparer plusieurs variantes issues du même modèle de base.  
Des métriques (durée moyenne d’une partie, équilibre, diversité stratégique, complexité) pourront être extraites pour évaluer les différences.  
L’objectif est de rendre possible une analyse automatique ou semi-automatique de la richesse des variantes créées avec le DSL.
