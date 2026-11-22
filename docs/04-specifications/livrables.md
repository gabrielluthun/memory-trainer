# S14 — Livrables par lot

Amont : [périmètre et lots](../02-projet/perimetre.md), [planning](../02-projet/planning.md), [user stories](../01-besoin/user-stories.md), [MCD, vue cible](bdd/mcd.md#6-vue-cible-de-la-v10-indicative), [mock-ups](maquettes/mockups.md).

## En bref

- **Chaque lot se termine par une version en production** : 0.1 à 0.5, puis 1.0 et 1.1. Le sprint 0 livre le socle, sans version fonctionnelle.
- **Chaque livraison contient les mêmes 8 éléments** (section 1) : l'application en ligne, la base migrée, la spécification du lot, les tests, le procès-verbal de recette, une restauration testée, les notes de version et les ADR du lot.
- **Notes de version** : un `CHANGELOG.md` dans le repo, recopié dans la release GitHub de la version.
- **Le lot 1 est détaillé** (section 4), car il est spécifié. Les lots suivants restent au niveau des user stories, comme le veut la spécification progressive : leur tableau sera complété avant leur développement.

## 1. Ce que contient chaque livraison

| Livrable | Contenu | Où | Règles |
|---|---|---|---|
| **Application en production** | La version du lot, publiée par la CI après fusion de la branche `release/X.Y.0` dans `main`, avec son tag `vX.Y.0` | Cloudflare Pages | P7, SEQ07 |
| **Base migrée** | Les migrations du lot, versionnées, testées en local, appliquées par la CI après une sauvegarde | Neon | ES19 |
| **Spécification du lot** | Les mises à jour des parties 4 et 5 pour le lot (dictionnaire, MCD, MLD, MPD, accès, maquettes, séquences), validées **avant** le code | `docs/` | Spécification progressive |
| **Tests** | Tests unitaires, d'intégration et de bout en bout des US du lot, verts dans la CI | Repo, CI | Q1 |
| **Procès-verbal de recette** | Vérification des critères d'acceptation de chaque US du lot, et des tests de recette | `docs/06-qualite-deploiement/recette.md` | Q2 |
| **Restauration testée** | Une sauvegarde R2 restaurée dans une base locale, sans perte | Poste du développeur | ES17 |
| **Notes de version** | Ce qui change pour le pratiquant, rédigé dans `CHANGELOG.md` puis recopié dans la release GitHub du tag | Repo, GitHub | Décision S14 |
| **ADR du lot** | Une fiche par décision structurante prise pendant le lot | `docs/04-specifications/adr/` | Process |

Un lot n'est livré que lorsque **les 8 éléments sont là**. Le suivant ne commence qu'ensuite ([planning](../02-projet/planning.md)).

## 2. Sprint 0 — le socle (jalon J4)

Pas de version fonctionnelle : il prépare tout ce dont le lot 1 a besoin.

| Livrable | Contenu | Règles |
|---|---|---|
| **Repo et branches** | Gitflow initialisé, `main` protégée sur GitHub, scan des secrets actif | P7, ES09 |
| **Environnement** | Outils installés, `.env` local ignoré par git, branche Neon de dev | P6, S2 |
| **CI/CD** | Lint, tests, audit des dépendances et scan des secrets sur chaque pull request ; migrations puis publication après fusion dans `main` | Q3, SEQ07 |
| **Cadre de tests** | Outils de test installés, un premier test par couche | Q1 |
| **Base** | Première migration tirée de `bdd/schema.sql`, compte autorisé créé par la CI depuis un secret, rôles et règles RLS | S10, S11 |
| **Comptes de service** | Projet Hanko (inscription fermée), Data API de Neon branchée sur Hanko, rôle `backup_reader`, Worker et R2 | ES01, S3, S11 |
| **Premier déploiement** | Une page vide publiée de bout en bout, jusqu'à Cloudflare Pages | J4 |
| **Points à vérifier** | Ceux listés dans S3, S10 et S11 (`auth.user_id()`, JWKS de Hanko, volume réel d'un essai, délais de réveil) | S3, S10, S11 |

## 3. Livrables par lot

| Lot | Version | User stories | Ce que le pratiquant reçoit | Base de données | Contenus |
|---|---|---|---|---|---|
| **1** : Socle et Numbers | **0.1** | US01, US07 à US12, US19 à US21, US23 | Numbers en standard et en personnalisé, de bout en bout, hors ligne, synchronisé entre appareils (détail en section 4) | 6 tables, 2 fonctions, déclencheurs, règles RLS | Aucun |
| **2** : Cards, Images, Words | **0.2** | US02, US03, US04 | Trois nouvelles disciplines, avec la langue du contenu pour Words | Sous-tables d'éléments pour Cards, Images et Words ; langue du contenu sur l'essai | Banque d'images et listes de mots FR et EN, sous licence libre (A1) |
| **3** : Names, International Names | **0.3** | US05, US06 | Deux disciplines à visages et prénoms | Sous-table d'éléments pour Names | Visages générés par IA, prénoms FR, EN et internationaux, sous licence libre (A1) |
| **4** : Statistiques et erreurs | **0.4** | US13, US15 | Records, moyenne récente, courbes de progression, analyse des erreurs | Aucune table nouvelle prévue | Aucun |
| **5** : Systèmes d'images | **0.5** | US16, US17, US18 | Saisie et révision des systèmes, erreurs reliées aux images | Systèmes et leurs entrées, lien entre une erreur et une image | Images des systèmes, si le téléversement est retenu (A1) |
| **6** : Points IAM | **1.0** | US14 | Équivalents en points IAM, dans deux onglets | Versions des standards, épreuves et niveaux IAM | Standards IAM en vigueur (RG17) |
| **Finalisation** | — | — | Documentation et maintenance finalisées en production (jalon J11) | — | — |
| **7** : Application de bureau | **1.1** | US22 | Installation sur ordinateur, dans sa propre fenêtre | Aucune | Icônes et manifeste de l'application |

La colonne « Base de données » reprend la [vue cible du MCD](bdd/mcd.md#6-vue-cible-de-la-v10-indicative) : elle sera précisée avant chaque lot. Chaque nouvelle table recevra ses règles RLS et sa règle de lecture pour la sauvegarde ([ADR 0018](adr/0018-roles-et-regles-acces.md)).

## 4. Lot 1 en détail (version 0.1)

| Livrable | Contenu | Spécifié dans |
|---|---|---|
| **12 écrans** | Accueil, lancement, pause, mémorisation, rappel, abandon, résultat, historique, essai interrompu, paramètres, connexion, rappel d'installation ; sur ordinateur et mobile, en clair et en sombre | [Mock-ups](maquettes/mockups.md) |
| **Essai Numbers** | Formats standard et personnalisé, deux pauses, carrousel de mémorisation, saisie avec insertion et suppression, correction et score | RG01, RG02, RG08 à RG12, RG15, RG21, RG25 ; [SEQ02](uml/sequences.md) |
| **Abandon et interruption** | Les trois choix, statuts « abandonné » et « erreur externe », essai en cours enregistré toutes les 2 s | RG23, RG24 ; [SEQ03](uml/sequences.md) |
| **Historique et détail** | Liste filtrable par discipline et par mode, copie corrigée de chaque essai | RG18, RG19 |
| **Paramètres** | Langue FR ou EN, motif d'affichage, dernières pauses, synchronisés | EF20, RG11, ADR 0012 |
| **Hors ligne et synchronisation** | Application en cache, base locale Dexie.js, file d'envoi, envoi par `submit_trial`, réception par numéro d'ordre | ENF02, RG22 ; [SEQ01, SEQ05](uml/sequences.md) ; ADR 0010, 0011 |
| **Connexion** | Passkey Hanko, compte unique | ES01 à ES03 ; [SEQ04](uml/sequences.md) |
| **Installation** | PWA installable, rappel d'installation sur iPhone et iPad, stockage persistant | CU18, S3 |
| **Base de données** | 6 tables, contrôles différés, essais immuables, 2 fonctions, 4 rôles et règles RLS | [MPD](bdd/mpd.md), [accès](acces.md) |
| **Sauvegarde** | Worker quotidien vers R2, incrémental par numéro d'ordre | ES17 ; [SEQ06](uml/sequences.md) ; ADR 0009, 0011 |
| **Première note de version** | `CHANGELOG.md` créé, section 0.1.0, recopiée dans la release GitHub `v0.1.0` | Section 1 |

## Points ouverts

| Point | Pourquoi | Quand |
|---|---|---|
| **Forme du procès-verbal de recette** | Fixée avec la recette. | Q2 |
| **Détail du pipeline** (outils de lint, sauvegarde avant migration, compatibilité des anciennes versions) | Fixés avec le déploiement. | Q3 |
| **Sources des contenus** des lots 2 et 3 | Critères de licence fixés en A1, choix des sources avant chaque lot. | Avant les lots 2 et 3 |
