# PokéGames

PokéGames est une application web de mini-jeux sur le thème Pokémon, pensée pour tester les connaissances des joueurs de manière rapide, ludique et compétitive.

Projet portfolio développé par Anthony DINH.

## Vision du projet

PokéGames centralise plusieurs expériences de jeu dans une seule plateforme:

- gameplay accessible en quelques clics
- identité visuelle inspirée de l'univers Pokémon
- architecture full stack moderne et évolutive

L'objectif est de proposer une base solide pour enrichir progressivement le catalogue de mini-jeux.

## Mini-jeux disponibles

### 1) PokéDesc
Le joueur doit deviner le Pokémon à partir d'une description censurée et d'indices.
<img width="1851" height="907" alt="Capture d&#39;écran 2026-05-02 155210" src="https://github.com/user-attachments/assets/140d2b94-3927-4263-8de9-8979ec78ded3" />

### 2) Quel est ce type ?
Mini-jeu orienté connaissances de la table des types Pokémon.
<img width="1849" height="825" alt="Capture d&#39;écran 2026-05-02 154940" src="https://github.com/user-attachments/assets/19d1ddc1-777a-4f1c-a35a-22d7f43e7461" />

### 3) Dézoom
Le joueur identifie un Pokémon à partir d'une image progressivement dézoomée. Aurez-vous la chance de rencontrez des Pokémon chromatiques lors de vos parties ?
<img width="1853" height="816" alt="Capture d&#39;écran 2026-05-02 155324" src="https://github.com/user-attachments/assets/9a4baf51-cd3a-49c1-bb4f-b25227b69801" />

## Mode multijoueur pour affrontez vos amis !
<img width="1320" height="629" alt="Capture d&#39;écran 2026-05-02 155931" src="https://github.com/user-attachments/assets/38bce3d3-74f2-464c-ab5b-ccf085e4bf35" />


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
- déploiement public de la plateforme
- amélioration de l'expérience multijoueur temps réel
- optimisation UX/UI et animations de jeu

## Déploiement

Ce projet est configuré en **CI/CD** (Intégration et Déploiement Continus) pour automatiser les mises en production :
- **Frontend :** Déployé sur Vercel
- **Backend :** Déployé sur Render

## Auteur

Anthony DINH
