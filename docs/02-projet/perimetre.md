# P2 — Périmètre et lots

Amont : [objectifs](objectifs.md), [user stories](../01-besoin/user-stories.md), [contraintes](../01-besoin/contraintes.md).

## Périmètre de la v1

La **v1.0 est la première version fonctionnelle complète** (le « MVP » au sens du développeur). Elle couvre **l'intégralité des user stories US01 à US21**, ainsi que **US23** (temps de préparation) et les exercices **US35 à US37** (ajoutés pendant le lot 1).

Elle est construite en **7 lots de développement**. Chaque lot terminé est **mis en production** (release Gitflow versions 0.1 à 0.6, puis 1.0) : l'application reste utilisable à la fin de chaque lot, conformément à la contrainte de temps de B4.

## Lots

| Lot | Version | Contenu | User stories |
|---|---|---|---|
| 1 — Socle et Numbers | 0.1 | Numbers de bout en bout : format standard et personnalisé, temps de préparation, navigation et chronomètre, saisie du rappel, score, détail d'un essai, historique, abandon et interruption, interface FR/EN, **hors ligne et synchronisation** entre appareils | US01, US07, US08, US09, US10, US11, US12, US19, US20, US21, US23 |
| 2 — Cards, Images, Words | 0.2 | Les trois disciplines sans visages ni prénoms | US02, US03, US04 |
| 3 — Names, International Names | 0.3 | Visages générés par IA, bases de prénoms FR, EN et internationaux | US05, US06 |
| 4 — Statistiques et erreurs | 0.4 | Courbes de progression, analyse des erreurs | US13, US15 |
| 5 — Systèmes d'images | 0.5 | Saisie et révision des systèmes, lien erreurs → images | US16, US17, US18 |
| 8 — Exercices | 0.6 | Système majeur, révision rapide, carte manquante | US35, US36, US37 |
| 6 — Points IAM | 1.0 | Équivalents en points IAM dans les statistiques | US14 |
| 7 — Application de bureau | 1.1 | Installation sur ordinateur comme application de bureau ([ADR 0006](../04-specifications/adr/0006-bureau-pwa-installee.md)) | US22 |
| 9 — IAM chiffres et cartes | 1.2 | Choix du format et du niveau, Numbers, Cards, Speed Cards et Binary Digits au format IAM, points IAM réels | US24, US25, US26, US30, US31, US34 |
| 10 — IAM images, mots, visages, dates | 1.3 | Images, Words, Names and Faces au format IAM, Dates (événements fictifs) | US27, US28, US29, US32 |
| 11 — Spoken Numbers | 1.4 | Chiffres dictés par une voix, hors connexion compris | US33 |

Le **lot 7** a été ajouté pendant le benchmark. Il vient **après la v1.0** : la v1.0 reste définie par les user stories US01 à US21, US23 et US35 à US37.

Les **lots 8 à 11** ont été ajoutés pendant le développement du lot 1, pour une plateforme polyvalente. Les numéros des lots 1 à 7 ne changent pas : l'**ordre de livraison suit les versions**.

- Le **lot 8 (exercices)** est livré en **0.6**, juste après les systèmes d'images (lot 5), dont il a besoin : le système majeur complète un système, la révision rapide révise ses images. Il fait partie de la v1.0.
- Les **lots 9 à 11 (format IAM)** viennent **après la v1.0**, qu'ils ne retardent pas. Ils sont **groupés par famille** : chaque lot réutilise le code des disciplines Memory League du même type (lots 1 à 3). Spoken Numbers a son propre lot, car la voix est une technique nouvelle.

Les user stories transverses du lot 1 (US07 navigation, US08 saisie du rappel, US09 mode personnalisé, US10 abandon, US23 temps de préparation) sont livrées pour Numbers au lot 1, puis **étendues à chaque nouvelle discipline** dans les lots 2 et 3, puis à chaque épreuve IAM dans les lots 9 à 11.

Conformément à la spécification progressive, seul le **lot en cours** est spécifié en détail (partie 4) ; les lots suivants restent au niveau des user stories jusqu'à leur tour.

## Hors périmètre

| Élément | Raison |
|---|---|
| Autres jeux d'entraînement (séquences de cartes qui s'allongent, jeux d'arcade, quiz de culture générale) | Écartés quand le format IAM et les exercices ont été ajoutés : seuls le système majeur, la révision rapide et la carte manquante ont été retenus. |
| Multi-utilisateurs (comptes pour d'autres personnes, matchs contre d'autres joueurs, carte manquante à plusieurs) | Usage personnel ; ferait basculer le projet en version Complète du process (voir [profil](../00-cadrage/profil-projet.md)). D'autres utilisateurs sont envisagés plus tard, sans échéance. |
| Match contre ses propres essais passés (format match Memory League) | Idée évoquée, non retenue. |
| Palais mentaux (saisie des palais et des lieux, introduction interactive à la méthode) | Un palais est mental : rien d'utile à saisir ; écarté en partie 1 (RG20), puis de nouveau quand le format IAM a été ajouté. |
