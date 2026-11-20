# PRD résumé pour `memory-trainer`

## 1. Contexte et problème

Le développeur pratique la mémorisation (systèmes d'images pour les chiffres et les cartes) et s'entraîne au format **Memory League**, sans compétition, de façon occasionnelle avec des pauses.

Il veut un outil **gratuit, à lui**, qui relie ses **erreurs** aux **images de ses systèmes** et offre des statistiques poussées.

→ [Contexte](01-besoin/contexte.md), [besoins](01-besoin/besoins.md)

## 2. Objectifs et indicateurs de succès

- **O1** : progresser (courbes de progression orientées à la hausse).
- **O2** : application en ligne et gratuite.
- **O3** : règles de gestion RG12 à RG17 couvertes par des tests automatisés.
- **O4** : process de conception suivi jusqu'au bout.

→ [Objectifs](02-projet/objectifs.md)

## 3. Utilisateurs

Un seul : **le pratiquant** (le développeur), sur ordinateur, téléphone et tablette.

Trois contextes d'usage :

- reprise après une pause ;
- séance sur ordinateur ;
- séance tactile, éventuellement hors connexion.

→ [Persona](01-besoin/persona.md)

## 4. Périmètre et hors périmètre

**v1.0** = toutes les user stories (US01 à US21), livrée en **6 lots** mis en production un par un :

- **0.1** : socle et Numbers (dont hors ligne et synchronisation) ;
- **0.2** : Cards, Images, Words ;
- **0.3** : Names, International Names ;
- **0.4** : statistiques et erreurs ;
- **0.5** : systèmes d'images ;
- **1.0** : points IAM.

**Hors périmètre** : autres épreuves IAM, multi-utilisateurs, match contre soi-même, palais mentaux.

→ [Périmètre et lots](02-projet/perimetre.md)

## 5. Exigences clés

- **Disciplines Memory League** : EF01 à EF06, formats et scores identiques à Memory League (RG01 à RG14), mode personnalisé EF07.
- **Déroulé d'un essai** : chronomètre, navigation et saisie du rappel (EF08, EF09), correction (EF10), abandon (EF11).
- **Suivi** : historique immuable (EF13, RG18), progression (EF14), points IAM (EF15), analyse des erreurs (EF16), lien erreurs → images (EF19).
- **Non fonctionnelles** : chronomètre à la ms (ENF01), **hors ligne** (ENF02), multi-appareils (ENF03), FR/EN (ENF05), **gratuit** (ENF06), aucune perte de données (ENF07), moins de 100 ms de latence (ENF08).

→ [Exigences](01-besoin/exigences.md), [règles de gestion](01-besoin/regles-de-gestion.md), [user stories](01-besoin/user-stories.md)

## 6. Priorisation

- **Must** : les 4 disciplines sans visages, navigation, saisie, mode personnalisé, détail, historique, hors ligne, multi-appareils.
- **Should** : Names, International Names, abandon, progression, analyse des erreurs, systèmes.
- **Could** : points IAM, révision des systèmes, interface FR/EN.

En cas de manque de temps, on reporte d'abord les Could.

→ [Priorisation](02-projet/priorisation.md)

## 7. Contraintes

- Temps de développement très variable, sans échéance.
- Offres gratuites uniquement.
- Hors ligne.
- Français et anglais.
- Contenus libres de droits (visages IA, images, mots, prénoms).
- Règles Memory League non publiques, fournies en captures.
- Pile technique choisie au benchmark (partie 4).

→ [Contraintes](01-besoin/contraintes.md), [outils et environnement](02-projet/outils-environnement.md), [conventions](02-projet/conventions.md)

## 8. Risques

Principaux :

- abandon ou démotivation (R1) ;
- dérive du périmètre (R2) ;
- lot 1 trop gros (R3) ;
- limites des offres gratuites (R4).

→ [Risques](02-projet/risques.md)

## 9. Questions ouvertes

- **Base de prénoms** (Names et International Names) : provenance, taille et licence (parties 3 et 4).
- **Licences** des visages IA, des images et des listes de mots (partie 3, A1).
- **Tailles de groupe** par épreuve et **équivalents tactiles** des raccourcis clavier (partie 4, maquettes).
- **Pile technique** : front, back, base de données, hébergement, solution hors ligne (partie 4, benchmark).
