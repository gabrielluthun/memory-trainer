# P6 — Outils et environnement

Amont : [contraintes](../01-besoin/contraintes.md), [planning](planning.md).

## Outils

| Domaine             | Outil                                                            |
| ------------------- | ---------------------------------------------------------------- |
| Poste de travail    | MacBook Pro M1 Pro 14" 2021 (16 Go RAM + 1 To)                   |
| Éditeur             | Cursor                                                           |
| Gestion de versions | git, avec **git-flow** (voir [conventions](conventions.md))      |
| Documentation       | Markdown dans `/docs`, diagrammes **Mermaid**, maquettes **PNG** |

## Environnements

| Environnement                                                             | Rôle                                            | Données                        |
| ------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------ |
| **Dev en local**                                                          | Poste local : développement et tests            | Données de test uniquement     |
| **Prod ** **Vercel pour le front** **Supabase + PostgreSQL pour le back** | Application en ligne, utilisée pour s'entraîner | Données réelles du développeur |
