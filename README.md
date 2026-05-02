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

### 2) Quel est ce type ?
Mini-jeu orienté connaissances de la table des types Pokémon.

### 3) Dézoom
Le joueur identifie un Pokémon à partir d'une image progressivement dézoomée. Rencontrez même des Pokémon chromatiques lors de vos parties !

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

## Statut

Projet en évolution active.

## Auteur

Anthony DINH
