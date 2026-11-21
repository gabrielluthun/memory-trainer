# S12 — Wireframes

Amont : [cas d'utilisation](../uml/cas-utilisation.md), [user stories](../../01-besoin/user-stories.md), [séquences](../uml/sequences.md). Aval : [mock-ups](mockups.md).

## En bref

- **12 écrans du lot 1**, chacun en version **ordinateur** (1280 × 800) et **mobile** (390 × 844) : 24 PNG dans [`wireframes/`](wireframes/).
- **Basse fidélité** : des blocs étiquetés par leur rôle (« Bouton Lancer un essai », « Champ nombre de chiffres »), des zones barrées d'une croix pour les contenus riches (aperçus, groupe courant, score, clavier du système). Aucun vrai texte, aucune couleur : la mise en forme vient avec les mock-ups (S13).
- Chaque écran cite les **user stories** et le **cas d'utilisation** qu'il couvre (tableau ci-dessous).
- **Mémorisation de Numbers en carrousel** : une bande de groupes qui glisse sous un cadre fixe.

## Décisions prises pour S12 (2026-11-21)

| Décision | Choix du développeur | Règles |
|---|---|---|
| **Formats** | Ordinateur et mobile pour chaque écran. Le rappel d'installation est dessiné sur iPad, puisqu'il ne concerne que l'iPhone et l'iPad. | ENF03 |
| **Mémorisation de Numbers** | **Carrousel** : une bande de groupes de même taille glisse sous un **cadre fixe** au centre. Le groupe dans le cadre est le groupe courant, les voisins restent lisibles. → et ← font glisser la bande d'un groupe. Le compteur « Groupe 12 sur 40 » reste dans la barre du haut. | RG09, RG11 |
| **Mémorisation au toucher** | Boutons **Début**, **←**, **→** et **Finished** en bas de l'écran, à portée du pouce | RG09 |
| **Rappel au toucher** | **Clavier numérique du système**, avec **+ Insérer** et **− Supprimer** en boutons sous la grille | RG10 |
| **Taille des groupes** | **2 chiffres** par défaut pour Numbers, réglable de 1 à 10 dans les paramètres. Point ouvert de CU15 et du dictionnaire (S7) fermé. | RG11 |
| **Style** | Wireframes en basse fidélité (version 1, comparée à une version 2 au langage visuel plus marqué). | — |

## Écrans

| Écran | Ordinateur | Mobile | User stories | Cas d'utilisation |
|---|---|---|---|---|
| **01** : Accueil | [PNG](wireframes/01-accueil-ordinateur.png) | [PNG](wireframes/01-accueil-mobile.png) | US01, US20 | — |
| **02** : Lancement d'un essai | [PNG](wireframes/02-lancement-ordinateur.png) | [PNG](wireframes/02-lancement-mobile.png) | US01, US09, US23 | CU01 |
| **03** : Pause | [PNG](wireframes/03-pause-ordinateur.png) | [PNG](wireframes/03-pause-mobile.png) | US23 | CU01, CU02 |
| **04** : Mémorisation | [PNG](wireframes/04-memorisation-ordinateur.png) | [PNG](wireframes/04-memorisation-mobile.png) | US07 | CU02 |
| **05** : Rappel | [PNG](wireframes/05-rappel-ordinateur.png) | [PNG](wireframes/05-rappel-mobile.png) | US08 | CU03 |
| **06** : Abandon | [PNG](wireframes/06-abandon-ordinateur.png) | [PNG](wireframes/06-abandon-mobile.png) | US10 | CU05 |
| **07** : Résultat | [PNG](wireframes/07-resultat-ordinateur.png) | [PNG](wireframes/07-resultat-mobile.png) | US11 | CU04 |
| **08** : Historique | [PNG](wireframes/08-historique-ordinateur.png) | [PNG](wireframes/08-historique-mobile.png) | US12 | CU07 |
| **09** : Essai interrompu | [PNG](wireframes/09-essai-interrompu-ordinateur.png) | [PNG](wireframes/09-essai-interrompu-mobile.png) | US10 | CU06 |
| **10** : Paramètres | [PNG](wireframes/10-parametres-ordinateur.png) | [PNG](wireframes/10-parametres-mobile.png) | US19, US07 | CU15 |
| **11** : Connexion | [PNG](wireframes/11-connexion-ordinateur.png) | [PNG](wireframes/11-connexion-mobile.png) | US21 | CU16 |
| **12** : Rappel d'installation | [PNG iPad](wireframes/12-installation-ordinateur.png) | [PNG iPhone](wireframes/12-installation-mobile.png) | — | CU18 |

## Choix de disposition

| Écran | Choix |
|---|---|
| **Accueil** | Carte Numbers avec ses deux boutons, aperçu de chiffres, derniers essais. Les disciplines des lots 2 et 3 sont visibles mais inactives. Le statut de synchronisation est toujours visible en haut. |
| **Navigation** | Sur mobile, une barre d'onglets en bas : Accueil, Historique, Paramètres. Sur ordinateur, des liens dans la barre du haut. |
| **Lancement** | Mode, champs du mode personnalisé, puis les deux pauses, préremplies avec les dernières valeurs de la discipline (RG25). Sur ordinateur, un récapitulatif du déroulé de l'essai, avec le bouton Commencer dessous. |
| **Pause** | Compte à rebours au centre, chiffres cachés, bouton pour commencer tout de suite. |
| **Mémorisation** | Carrousel sous cadre fixe (décision ci-dessus). Les raccourcis clavier sont rappelés sous les boutons. |
| **Rappel** | Ordinateur : 4 lignes de 20 cases. Mobile : 8 lignes de 10, au-dessus du clavier du système. La case sélectionnée a un trait épais. |
| **Résultat** | Score entouré, temps, puis la grille de correction ; les cases en erreur sont marquées. |
| **Abandon** et **essai interrompu** | Fenêtre avec les 3 choix, sans bouton Annuler (décision CU05). |
| **Connexion** | Bouton passkey, et possibilité de continuer hors connexion : les essais attendent dans la file d'envoi. |

## Pour les lots suivants

Présentation pendant la mémorisation, donnée par le développeur (comportement de Memory League), à reporter dans les règles de gestion avant le lot concerné :

| Discipline | Présentation | Lot |
|---|---|---|
| **Words** | Mots affichés en colonnes de 15 | 2 |
| **Names**, **International Names** | Visage courant en grand avec son prénom, et la colonne des visages suivants à droite | 3 |

## Source

Les PNG sont exportés depuis des pages HTML/CSS par Chrome sans interface, en résolution double. Les pages sources ne sont pas versionnées.
