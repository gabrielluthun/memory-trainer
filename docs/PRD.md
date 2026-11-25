# PRD résumé pour `memory-trainer`

## 1. Contexte et problème

Le développeur pratique la mémorisation (systèmes d'images pour les chiffres et les cartes) et s'entraîne au format **Memory League**, sans compétition, de façon occasionnelle avec des pauses.

Il veut un outil **gratuit, à lui**, qui relie ses **erreurs** aux **images de ses systèmes** et offre des statistiques poussées.

La plateforme devient **polyvalente** : exercices autour des systèmes dès la v1.0, puis épreuves officielles **IAM**.

→ [Contexte](01-besoin/contexte.md), [besoins](01-besoin/besoins.md)

## 2. Objectifs et indicateurs de succès

- **O1** : progresser aux formats Memory League et IAM (courbes de progression orientées à la hausse).
- **O2** : application en ligne et gratuite.
- **O3** : règles de score RG12 à RG17, puis RG26 à RG36, couvertes par des tests automatisés.
- **O4** : process de conception suivi jusqu'au bout.

→ [Objectifs](02-projet/objectifs.md)

## 3. Utilisateurs

Un seul : **le pratiquant** (le développeur), sur ordinateur, téléphone et tablette.

Quatre contextes d'usage :

- reprise après une pause ;
- séance sur ordinateur ;
- séance tactile, éventuellement hors connexion ;
- épreuve longue au format IAM (jusqu'à 3 h).

D'autres utilisateurs sont envisagés plus tard : le projet passerait alors en version Complète du process.

→ [Persona](01-besoin/persona.md)

## 4. Périmètre et hors périmètre

**v1.0** = US01 à US21, US23 et US35 à US37, livrée en **7 lots** mis en production un par un :

- **0.1** : socle et Numbers (dont hors ligne et synchronisation) ;
- **0.2** : Cards, Images, Words ;
- **0.3** : Names, International Names ;
- **0.4** : statistiques et erreurs ;
- **0.5** : systèmes d'images ;
- **0.6** : exercices, soit système majeur, révision rapide et carte manquante (lot 8) ;
- **1.0** : points IAM.

Après la v1.0 :

- **1.1** : application de bureau (lot 7, US22) ;
- **1.2** : IAM chiffres et cartes (lot 9) ;
- **1.3** : IAM images, mots, visages, dates (lot 10) ;
- **1.4** : Spoken Numbers (lot 11).

**Hors périmètre** : autres jeux d'entraînement, multi-utilisateurs, match contre soi-même, palais mentaux.

→ [Périmètre et lots](02-projet/perimetre.md)

## 5. Exigences clés

- **Disciplines Memory League** : EF01 à EF06, formats et scores identiques à Memory League (RG01 à RG14), mode personnalisé EF07.
- **Déroulé d'un essai** : temps de préparation avant la mémorisation et avant le rappel (EF23, RG25), chronomètre, navigation et saisie du rappel (EF08, EF09), correction (EF10), abandon (EF11).
- **Suivi** : historique immuable (EF13, RG18), progression (EF14), points IAM (EF15), analyse des erreurs (EF16), lien erreurs → images (EF19).
- **Format IAM** : Numbers, Cards, Images, Words, Names and Faces (EF24), Binary Digits (EF25), Speed Cards (EF26), Dates (EF27), Spoken Numbers (EF28), aux niveaux National, International et World, selon le règlement IAM (RG26 à RG35) ; points IAM réels (EF29, RG36).
- **Exercices** : système majeur (EF30), révision rapide avec répétition espacée (EF31), carte manquante (EF32), sans trace dans l'historique (RG42).
- **Transverses** : interface FR/EN (EF20), synchronisation (EF21), application de bureau (EF22).
- **Non fonctionnelles** : chronomètre à la ms (ENF01), **hors ligne** (ENF02), multi-appareils (ENF03), FR/EN (ENF05), **gratuit** (ENF06), aucune perte de données (ENF07), moins de 100 ms de latence (ENF08).

→ [Exigences](01-besoin/exigences.md), [règles de gestion](01-besoin/regles-de-gestion.md), [user stories](01-besoin/user-stories.md)

## 6. Priorisation

- **Must** : les 4 disciplines sans visages, temps de préparation, navigation, saisie, mode personnalisé, détail, historique, hors ligne, multi-appareils.
- **Should** : Names, International Names, abandon, progression, analyse des erreurs, systèmes.
- **Could** : points IAM, révision des systèmes, interface FR/EN, application de bureau.
- **Should, ajouts du lot 1** : exercices (lot 8, en 0.6), puis format IAM après la v1.0 (lots 9 à 11).

En cas de manque de temps, on reporte d'abord les Could.

→ [Priorisation](02-projet/priorisation.md)

## 7. Contraintes

- Temps de développement très variable, sans échéance.
- Offres gratuites uniquement.
- Hors ligne.
- Français et anglais.
- Contenus libres de droits (visages IA, images, mots, prénoms).
- Règles Memory League non publiques, fournies en captures ; règlement IAM public (version de 2019).
- Pile technique choisie au benchmark : Svelte, Neon, Hanko, Dexie.js, Cloudflare Pages.

→ [Contraintes](01-besoin/contraintes.md), [outils et environnement](02-projet/outils-environnement.md), [conventions](02-projet/conventions.md)

## 8. Risques

Principaux :

- abandon ou démotivation (R1) ;
- dérive du périmètre (R2) ;
- lot 1 trop gros (R3) ;
- limites des offres gratuites (R4) ;
- épreuve longue interrompue (R9).

→ [Risques](02-projet/risques.md)

## 9. Questions ouvertes

- **Sources de contenus** (prénoms, visages IA, images, mots, puis noms de famille, événements fictifs, prononciations) : critères de licence fixés en [A1](03-analyse-securite/rgpd.md#5-licences-des-contenus) ; choix des sources juste avant les lots 2, 3, 8 et 10.
- **Voix de Spoken Numbers** : voix du navigateur ou enregistrements, à choisir avant le lot 11 (R10).
- **Tailles de groupe** par épreuve et **équivalents tactiles** des raccourcis clavier (partie 4, maquettes).
- ~~**Pile technique**~~ : tranchée au [benchmark](04-specifications/benchmark.md#7-choix-du-développeur) (ADR 0001 à 0006).
