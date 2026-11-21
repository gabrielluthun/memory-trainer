# P2 — Périmètre et lots

Amont : [objectifs](objectifs.md), [user stories](../01-besoin/user-stories.md), [contraintes](../01-besoin/contraintes.md).

## Périmètre de la v1

La **v1.0 est la première version fonctionnelle complète** (le « MVP » au sens du développeur). Elle couvre **l'intégralité des user stories US01 à US21**, ainsi que **US23** (temps de préparation).

Elle est construite en **6 lots de développement**. Chaque lot terminé est **mis en production** (release Gitflow versions 0.1 à 0.5, puis 1.0) : l'application reste utilisable à la fin de chaque lot, conformément à la contrainte de temps de B4.

## Lots

| Lot | Version | Contenu | User stories |
|---|---|---|---|
| 1 — Socle et Numbers | 0.1 | Numbers de bout en bout : format standard et personnalisé, temps de préparation, navigation et chronomètre, saisie du rappel, score, détail d'un essai, historique, abandon et interruption, interface FR/EN, **hors ligne et synchronisation** entre appareils | US01, US07, US08, US09, US10, US11, US12, US19, US20, US21, US23 |
| 2 — Cards, Images, Words | 0.2 | Les trois disciplines sans visages ni prénoms | US02, US03, US04 |
| 3 — Names, International Names | 0.3 | Visages générés par IA, bases de prénoms FR, EN et internationaux | US05, US06 |
| 4 — Statistiques et erreurs | 0.4 | Courbes de progression, analyse des erreurs | US13, US15 |
| 5 — Systèmes d'images | 0.5 | Saisie et révision des systèmes, lien erreurs → images | US16, US17, US18 |
| 6 — Points IAM | 1.0 | Équivalents en points IAM dans les statistiques | US14 |
| 7 — Application de bureau | 1.1 | Installation sur ordinateur comme application de bureau ([ADR 0006](../04-specifications/adr/0006-bureau-pwa-installee.md)) | US22 |

Le **lot 7** a été ajouté pendant le benchmark. Il vient **après la v1.0** : la v1.0 reste définie par les user stories US01 à US21 et US23.

Les user stories transverses du lot 1 (US07 navigation, US08 saisie du rappel, US09 mode personnalisé, US10 abandon, US23 temps de préparation) sont livrées pour Numbers au lot 1, puis **étendues à chaque nouvelle discipline** dans les lots 2 et 3.

Conformément à la spécification progressive, seul le **lot en cours** est spécifié en détail (partie 4) ; les lots suivants restent au niveau des user stories jusqu'à leur tour.

## Hors périmètre

| Élément | Raison |
|---|---|
| Autres épreuves IAM (Binary, Spoken Numbers, Dates, épreuves longues de 5 à 60 minutes) | Entraînement au format Memory League uniquement. Les formules IAM ne servent qu'aux équivalents de points (RG16). |
| Multi-utilisateurs (comptes pour d'autres personnes, matchs contre d'autres joueurs) | Usage personnel ; ferait basculer le projet en version Complète du process (voir [profil](../00-cadrage/profil-projet.md)). |
| Match contre ses propres essais passés (format match Memory League) | Idée évoquée, non retenue. |
| Palais mentaux (saisie des palais et des lieux) | Un palais est mental : rien d'utile à saisir ; écarté en partie 1 (RG20). |
