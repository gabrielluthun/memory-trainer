# S13 — Mock-ups

Amont : [wireframes](wireframes.md), [user stories](../../01-besoin/user-stories.md), [règles de gestion](../../01-besoin/regles-de-gestion.md), [exigences](../../01-besoin/exigences.md).

## En bref

- **Les 12 écrans des wireframes**, avec l'identité visuelle finale, chacun **sur ordinateur et sur mobile, en clair et en sombre** : 48 PNG dans [`mockups/`](mockups/).
- **Direction « Cahier de correction »** : l'entraînement vu comme une copie. Ton rappel est écrit au **stylo bleu**, les erreurs sont corrigées au **stylo rouge**, et le score est entouré comme sur une copie rendue.
- **Atkinson Hyperlegible** partout : une police conçue pour que les chiffres ne se confondent jamais (1 et 7, 3 et 8, 0 et 6).
- **Mode sombre** pour chaque écran (ENF04) : une nuit bleue, pas un gris neutre, avec les mêmes rôles de couleur.

## Décisions prises pour S13

| Décision | Choix du développeur |
|---|---|
| **Direction visuelle** | « Cahier de correction », parmi trois propositions (avec « Chronomètre de piste » et « Palais de mémoire ») |
| **Thèmes exportés** | Tous les écrans en clair et en sombre (48 PNG) |
| **Fond** | Uni. Le papier réglé et la marge rouge d'un cahier, essayés, ne sont pas retenus. |

## Identité visuelle

### Couleurs

Chaque couleur a un rôle fixe, dans les deux thèmes.

| Rôle | Clair | Sombre | Utilisée pour |
|---|---|---|---|
| **Encre** | `#1B2A4A` | `#E4EAF5` | Texte, bouton principal |
| **Papier** | `#F4F7FB` | `#0E1525` | Fond des écrans |
| **Feuille** | `#FFFFFF` | `#152036` | Cartes, grilles, fenêtres |
| **Stylo bleu** | `#2350C8` | `#93B2FF` | Réponses saisies, case sélectionnée, cadre du carrousel, étape en cours |
| **Correction** | `#C42B2B` | `#FF7B7B` | Erreurs, score entouré, notes de ligne |
| **Juste** | `#1C7A4E` | `#62D49C` | « Compté », « Synchronisé » |
| **Personnalisé** | `#5E45A8` | `#BBA8F7` | Étiquette du mode personnalisé (code couleur, RG15) |
| **Attente** | `#8F5B00` | `#F0B85E` | « En attente d'envoi », « Erreur externe » |

### Typographie

| Usage | Police |
|---|---|
| Interface, titres, heures, durées, scores | Atkinson Hyperlegible Next, chiffres alignés |
| Chiffres à mémoriser et à saisir | Atkinson Hyperlegible Mono : chaque chiffre occupe la même place, zéro barré |
| Corrections et score | Kalam, écriture manuscrite, réservée au stylo rouge |

Dans l'application, ces polices sont **auto-hébergées** ([ADR 0020](../adr/0020-polices-auto-hebergees.md)). Google Fonts n'a servi qu'à l'export des PNG.

## Écrans

| Écran | Ordinateur clair | Ordinateur sombre | Mobile clair | Mobile sombre | User stories |
|---|---|---|---|---|---|
| **01** : Accueil | [PNG](mockups/01-accueil-ordinateur-clair.png) | [PNG](mockups/01-accueil-ordinateur-sombre.png) | [PNG](mockups/01-accueil-mobile-clair.png) | [PNG](mockups/01-accueil-mobile-sombre.png) | US01, US20 |
| **02** : Lancement d'un essai | [PNG](mockups/02-lancement-ordinateur-clair.png) | [PNG](mockups/02-lancement-ordinateur-sombre.png) | [PNG](mockups/02-lancement-mobile-clair.png) | [PNG](mockups/02-lancement-mobile-sombre.png) | US01, US09, US23 |
| **03** : Pause | [PNG](mockups/03-pause-ordinateur-clair.png) | [PNG](mockups/03-pause-ordinateur-sombre.png) | [PNG](mockups/03-pause-mobile-clair.png) | [PNG](mockups/03-pause-mobile-sombre.png) | US23 |
| **04** : Mémorisation | [PNG](mockups/04-memorisation-ordinateur-clair.png) | [PNG](mockups/04-memorisation-ordinateur-sombre.png) | [PNG](mockups/04-memorisation-mobile-clair.png) | [PNG](mockups/04-memorisation-mobile-sombre.png) | US07 |
| **05** : Rappel | [PNG](mockups/05-rappel-ordinateur-clair.png) | [PNG](mockups/05-rappel-ordinateur-sombre.png) | [PNG](mockups/05-rappel-mobile-clair.png) | [PNG](mockups/05-rappel-mobile-sombre.png) | US08 |
| **06** : Abandon | [PNG](mockups/06-abandon-ordinateur-clair.png) | [PNG](mockups/06-abandon-ordinateur-sombre.png) | [PNG](mockups/06-abandon-mobile-clair.png) | [PNG](mockups/06-abandon-mobile-sombre.png) | US10 |
| **07** : Résultat | [PNG](mockups/07-resultat-ordinateur-clair.png) | [PNG](mockups/07-resultat-ordinateur-sombre.png) | [PNG](mockups/07-resultat-mobile-clair.png) | [PNG](mockups/07-resultat-mobile-sombre.png) | US11 |
| **08** : Historique | [PNG](mockups/08-historique-ordinateur-clair.png) | [PNG](mockups/08-historique-ordinateur-sombre.png) | [PNG](mockups/08-historique-mobile-clair.png) | [PNG](mockups/08-historique-mobile-sombre.png) | US12 |
| **09** : Essai interrompu | [PNG](mockups/09-essai-interrompu-ordinateur-clair.png) | [PNG](mockups/09-essai-interrompu-ordinateur-sombre.png) | [PNG](mockups/09-essai-interrompu-mobile-clair.png) | [PNG](mockups/09-essai-interrompu-mobile-sombre.png) | US10 |
| **10** : Paramètres | [PNG](mockups/10-parametres-ordinateur-clair.png) | [PNG](mockups/10-parametres-ordinateur-sombre.png) | [PNG](mockups/10-parametres-mobile-clair.png) | [PNG](mockups/10-parametres-mobile-sombre.png) | US19, US07 |
| **11** : Connexion | [PNG](mockups/11-connexion-ordinateur-clair.png) | [PNG](mockups/11-connexion-ordinateur-sombre.png) | [PNG](mockups/11-connexion-mobile-clair.png) | [PNG](mockups/11-connexion-mobile-sombre.png) | US21 |
| **12** : Rappel d'installation | [PNG iPad](mockups/12-installation-ordinateur-clair.png) | [PNG iPad](mockups/12-installation-ordinateur-sombre.png) | [PNG iPhone](mockups/12-installation-mobile-clair.png) | [PNG iPhone](mockups/12-installation-mobile-sombre.png) | — |

## Ce que les mock-ups ajoutent aux wireframes

| Écran | Ajout |
|---|---|
| **En-tête d'essai** | Le fil des 4 étapes (Pause, Mémorisation, Pause, Rappel), avec l'étape en cours au stylo bleu et les étapes passées cochées. |
| **Mémorisation** | La bande du carrousel s'estompe sur les bords pour montrer qu'elle glisse. Le cadre fixe est au stylo bleu. |
| **Rappel** | La grille est posée sur une feuille « Votre rappel », avec les actions en bas de la feuille. |
| **Résultat** | **Copie corrigée** : réponse fausse barrée, bon chiffre écrit à la main en rouge, case vide remplie en rouge, score entouré « 72 sur 80 ». Chaque ligne reçoit sa **note dans la marge** (17/20 sur ordinateur, 9/10 sur mobile), qui montre où se concentrent les erreurs. Elle se calcule à partir de la correction (RG12). |
| **Historique** | Une petite jauge sous chaque score, et les statuts en étiquettes de couleur (abandonné, erreur externe, personnalisé). |
| **Accueil** | Message d'accueil, aperçu des chiffres, derniers essais avec leur mode. |
| **Paramètres** (ajout d'US23) | Une section « Pauses de préparation » par épreuve, avec les mêmes boutons 0, 5, 10 et 20 s que l'écran de lancement. Elle n'existe pas sur les PNG : ajoutée pendant le développement ([CU15](../uml/cas-utilisation.md)). |

## Source

Les PNG sont exportés depuis des pages HTML/CSS par Chrome sans interface, en résolution double, avec les polices Google Fonts. Les pages sources ne sont pas versionnées.
