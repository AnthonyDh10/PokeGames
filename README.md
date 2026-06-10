# PokéMini Games

PokéMini Games est une application web de mini-jeux sur le thème Pokémon, pensée pour tester les connaissances des joueurs de manière rapide et ludique, seul ou entre amis.
Testez l'application ici : https://poke-minigames.vercel.app

## Origine et Vision du projet

À force de faire des quizz entre amis en se lisant la page Poképédia d'un pokémon aléatoire, j'ai eu l'envie de donner vie à ce concept avec une application et pouvoir y jouer de manière plus simple et surtout dès que j'ai envie.

PokéMini Games centralise plusieurs expériences de jeu dans une seule plateforme:

- gameplay accessible en quelques clics
- identité visuelle inspirée de l'univers Pokémon
- architecture full stack moderne et évolutive

L'objectif est de proposer une base solide pour enrichir progressivement le catalogue de mini-jeux.

## Mini-jeux disponibles

### 1) PokéDesc
Le joueur doit deviner le Pokémon à partir d'une description censurée et d'indices.
<img width="2492" height="1267" alt="image" src="https://github.com/user-attachments/assets/9a6b73ee-8217-4bd1-9781-c2308f7119df" />

### 2) Typuzzle
Mini-jeu orienté connaissances de la table des types Pokémon.
<img width="2488" height="1267" alt="image" src="https://github.com/user-attachments/assets/6ddd0c42-559c-491a-8108-56bc54b9e236" />

### 3) Dézoom
Le joueur identifie un Pokémon à partir d'une image progressivement dézoomée. Aurez-vous la chance de rencontrez des Pokémon chromatiques lors de vos parties ?
<img width="2490" height="1266" alt="image" src="https://github.com/user-attachments/assets/1a4a141c-1feb-4e9a-ab6b-670e7963710b" />

## Mode multijoueur pour affrontez vos amis ! Discutez avec eux lors de vos parties ! 
<img width="2494" height="1274" alt="image" src="https://github.com/user-attachments/assets/b2d7aabe-df0b-4550-9617-c0bf5e19a1d8" />


## Stack technique

### Frontend

- React + TypeScript (Vite)
- Tailwind CSS
- Zustand (state management)
- Axios
- React Router

### Backend

- ASP.NET Core 8 Web API
- Architecture en couches (Domain / Data / Business / API)
- Données Pokémon via fichiers JSON statiques extraites de PokéAPI

### DevOps

- Docker (conteneurisation du frontend et du backend)
- Docker Compose (orchestration locale)

## Architecture du repository

```text
PokeGames/
|- FrontEnd/            # Application React + TypeScript
|- PokéDesc.API/        # API ASP.NET Core
|- PokéDesc.Business/   # Logique métier
|- PokéDesc.Data/       # Accès données
|- PokéDesc.Domain/     # Modèles et entités
|- docker-compose.yml
|- Dockerfile.backend
```

## Roadmap

- ajout de nouveaux mini-jeux
- ajout d'un mode multijoueur à plus de deux
- optimisation UX/UI et animations de jeu

## Déploiement

Ce projet est configuré en **CI/CD** (Intégration et Déploiement Continus) pour automatiser les mises en production :
- **Frontend :** Déployé sur Vercel
- **Backend :** Déployé sur Render

## Auteur

Anthony DINH
