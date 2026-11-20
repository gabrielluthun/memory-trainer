# ADR 0006 — Application de bureau : PWA installée

- Statut : accepté
- Date : 2026-11-20

## Contexte

Le développeur veut aussi utiliser memory-trainer comme une application de bureau. C'est un besoin ajouté pendant le benchmark. Il faut garder les passkeys (ES02), le hors ligne (ENF02) et la gratuité (ENF06).

## Options envisagées

PWA installée (39/40), Electron (32), Tauri 2 (31), Wails (28), Neutralinojs (27). Détail : [benchmark, section 6](../benchmark.md#6-application-de-bureau).

## Décision

**PWA installée** sur l'ordinateur, depuis Chrome, Edge ou Safari. Elle est livrée dans un **lot 7, après la version 1.0**, choisi par le développeur.

## Conséquences

| Positives | Négatives |
|---|---|
| Aucun code en plus : la même application que sur le web. | Pas une application native : elle dépend du navigateur, sans accès natif (fichiers, barre de menus). |
| Mêmes passkeys et même hors ligne que sur le web. | Firefox ne permet pas l'installation. |
| Aucun coût de signature d'application. | — |

Tauri a été écarté surtout pour les passkeys : elles demandent une application signée avec un compte développeur Apple payant sur macOS, et ne fonctionnent pas sous Linux.

Ce nouveau besoin modifie les parties 1 et 2 (besoins, ENF03, user stories, périmètre, priorisation, planning, PRD), qui devront être revalidées.
