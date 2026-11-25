# ADR 0027 — Motif d'affichage des groupes

- Statut : accepté
- Date : 2026-11-22

## Contexte

RG11 prévoyait une **taille de groupe** unique par épreuve, de 1 à 10 éléments : chaque appui sur → avance d'un groupe ([règles de gestion](../../01-besoin/regles-de-gestion.md)). Pendant le développement du lot 1, le développeur a signalé que chaque pratiquant mémorise avec **son propre découpage**, lié à son système d'images : des paires (« 45 83 »), des triplets (« 427 912 ») ou un mélange (« 42 791 »). L'affichage doit suivre ce découpage, pendant la mémorisation comme au rappel.

Le développeur a fixé le besoin : le **motif entier** avance d'un cran avec → ; il compte **1 à 3 sous-groupes de 1 à 5 éléments** ; la grille de rappel suit le même découpage ; « 2 » reste la valeur par défaut de Numbers. Restaient deux choix : comment le régler, et comment le stocker.

## Options envisagées

**Réglage dans Paramètres**

| Option | Points forts | Points faibles |
|---|---|---|
| **Construire le motif** (jusqu'à 3 listes, avec aperçu) | Tous les motifs possibles | Un peu plus long à régler |
| **Liste de motifs courants** | Un clic | Un motif absent de la liste est impossible |
| **Saisie libre** (« 2 3 ») | Rapide si on sait ce qu'on veut | Erreurs de saisie, moins pratique au toucher |

**Stockage dans `discipline_settings`**

| Option | Points forts | Points faibles |
|---|---|---|
| **Tableau d'entiers** (`smallint[]`, ex. `{2,3}`) | Un seul champ typé, lisible tel quel en JSON | Contrôle un peu plus long à écrire en SQL |
| **Texte** (« 2 3 ») | Lisible tel quel | À découper à chaque lecture, moins typé |
| **Trois colonnes** | SQL très simple | Rigide, vide dans la plupart des cas |

## Décision

Choix du développeur : on **construit le motif** dans Paramètres, avec jusqu'à 3 listes de 1 à 5 et un aperçu ; il est stocké en **tableau d'entiers** `group_pattern smallint[]`, qui remplace `group_size`. La base contrôle qu'il a 1 à 3 valeurs, chacune de 1 à 5 (ES07).

## Conséquences

| Positives | Négatives |
|---|---|
| Chacun retrouve à l'écran le découpage de son système d'images, à la mémorisation comme au rappel. | Une migration remplace `group_size` par `group_pattern` ; `save_settings` change de format. |
| La navigation reste simple : un groupe = la somme du motif (« 2 3 » : 5 éléments). | Les paramètres déjà enregistrés sur un appareil (taille unique, seulement en développement : la production n'en a aucun) sont convertis : une taille de 1 à 5 devient le motif correspondant, une taille plus grande revient au motif par défaut « 2 ». |
| Le motif sert aussi de base au rattachement des erreurs aux images du système (RG20, lot 5). | Les mock-ups des écrans 04, 05 et 10 ne montrent pas le motif : l'écart est noté dans les [mock-ups](../maquettes/mockups.md). |
