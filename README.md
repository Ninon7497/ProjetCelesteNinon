## 🕵️‍♀️ Nuit de Pluie — Aventure textuelle en JavaScript

### 🎯 Description

**Nuit de Pluie** est une aventure textuelle inspirée des “livres dont vous êtes le héros”, réalisée dans le cadre du module **Structure de la donnée**.

Le joueur incarne un enquêteur menant une investigation dans un motel isolé, où un meurtre vient d’être commis.

Les choix, les jets de dés et les compétences du personnage influencent la progression et la fin de l’histoire.

L’aventure utilise des **fichiers JSON** pour la structure narrative, un **fichier XML** pour la sauvegarde, et génère un **rapport Markdown** retraçant l’enquête terminée.

## ⚙️ Installation

### 1️⃣ Prérequis

-   [Node.js](https://nodejs.org/)
(version 18 ou plus)
-   Un terminal (ex : PowerShell, Terminal macOS, VS Code intégré)

### 2️⃣ Cloner le projet

```git clone https://github.com/Ninon7497/ProjetCelesteNinon.git```
### 3️⃣ Installer les dépendances

```npm install```

## 🚀 Lancer le jeu

### 1️⃣ Depuis le terminal :

```npm run play```



### 2️⃣ Choisir une option :

-   🆕 Nouvelle enquête → commence une nouvelle partie
-   📂 Reprendre la dernière enquête → charge la sauvegarde (`src/game.xml`)

## 🧠 Fonctionnement du jeu

### Structure des données :

-   `src/data/story.json` → contient toute l’histoire (textes, choix, conditions)
-   `src/data/images/` → contient les images associées aux scènes
-   `src/game.xml` → sauvegarde la progression du joueur (personnage, scène, historique)
-   `src/export/rapport-AAAA-MM-JJ_HH-mm.md` → rapport final de la partie au format Markdown


## 🎲 Fonctionnalités

-   Choix multiples influençant l’histoire
-   Jets de dés aléatoires (inspirés du d20)
-   Sauvegarde automatique après chaque scène
-   Reprise de partie possible
-   Export automatique d’un **rapport Markdown** illustré
-   Plusieurs fins possibles : victoire, défaite ou erreur d’enquête

## 📂 Organisation du projet
```
src/
 ├─ engine/
 │   ├─ dice.js
 │   ├─ game.js
 │   ├─ renderMarkdown.js
 │   └─ save.js
 ├─ data/
 │   ├─ story.json
 │   └─ images/
 │        ├─ motel\_nuit.png
 │        ├─ chambre\_corps.png
 │        ├─ receptionniste.png
 │        ├─ mort\_detective.jpg
 │        ├─fin\_victoire.jpg
 │        └─ echec\inspecteur.png
 ├─ export/
 │   └─ rapport-AAAA-MM-JJ\_HH-mm.md (généré)
 ├─ game.xml (sauvegarde)
 └─ index.js
```
## 🧾 Sauvegarde & rapport

-   Le fichier `**src/game.xml**` est mis à jour automatiquement pendant la partie.
-   À la fin de l’aventure, un fichier Markdown est généré dans `**src/export/**` retraçant tout le déroulement.

## 👩‍💻 Auteurs

Projet réalisé par :

-   **Ninon ROCHE**
-   **Céleste COLLETTI**

Dans le cadre du module **Structure de la donnée** — DN MADE Numérique 2eme année.
