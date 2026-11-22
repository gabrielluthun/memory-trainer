# B8 — User stories

Amont : [persona](persona.md), [exigences](exigences.md), [règles de gestion](regles-de-gestion.md). La priorisation MoSCoW et le découpage en lots viendront en partie 2.

Format : *En tant que pratiquant, je veux… afin de…*, suivi de critères d'acceptation testables (CA).

## Disciplines

### US01 — S'entraîner à Numbers
Je veux mémoriser puis restituer une suite de chiffres au format standard, afin de m'entraîner comme sur Memory League.
Couvre : EF01, EF08, EF10 · RG01, RG02, RG08, RG12, RG13, RG21
- CA1 : un essai standard présente 80 chiffres aléatoires, une nouvelle suite à chaque essai.
- CA2 : la mémorisation s'arrête automatiquement au bout d'1 minute ; le rappel, au bout de 4 minutes.
- CA3 : à la fin du rappel, le score vaut le nombre de chiffres corrects à la bonne position.
- CA4 : le temps de mémorisation utilisé s'affiche au centième de seconde.

### US02 — S'entraîner à Cards
Je veux mémoriser puis restituer l'ordre d'un jeu de cartes mélangé, afin de m'entraîner comme sur Memory League.
Couvre : EF02, EF08, EF10 · RG01, RG03, RG08, RG12, RG13, RG21
- CA1 : un essai standard présente les 52 cartes d'un jeu, chacune une seule fois, dans un ordre aléatoire.
- CA2 : au rappel, je reconstitue l'ordre en choisissant les cartes ; une carte déjà placée n'est plus proposée.
- CA3 : le score vaut le nombre de cartes à la bonne position.

### US03 — S'entraîner à Images
Je veux mémoriser une suite d'images puis la remettre dans l'ordre, afin de m'entraîner comme sur Memory League.
Couvre : EF03, EF08, EF10 · RG01, RG04, RG08, RG12, RG13, RG21
- CA1 : un essai standard présente 30 images différentes, tirées au hasard.
- CA2 : au rappel, les 30 images sont proposées dans le désordre et je les réordonne.
- CA3 : le score vaut le nombre d'images à leur place d'origine.
- CA4 : toutes les images sont chargées avant le début du chronomètre (ENF08).

### US04 — S'entraîner à Words
Je veux mémoriser puis restituer une liste de mots dans la langue de mon choix, afin de m'entraîner comme sur Memory League.
Couvre : EF04, EF08, EF10 · RG01, RG05, RG08, RG12, RG13, RG21
- CA1 : avant l'essai, je choisis le français ou l'anglais ; l'essai présente 50 mots de cette langue, tous différents.
- CA2 : au rappel, je saisis les mots dans l'ordre.
- CA3 : le score vaut le nombre de mots corrects à la bonne position.

### US05 — S'entraîner à Names
Je veux associer des visages à des prénoms de la langue de mon choix, puis les retrouver, afin de m'entraîner comme sur Memory League.
Couvre : EF05, EF08, EF10 · RG01, RG06, RG08, RG12, RG13, RG14, RG21
- CA1 : un essai standard présente 30 visages générés par IA, chacun avec un prénom de la langue choisie.
- CA2 : au rappel, les 30 visages réapparaissent dans un ordre différent et je saisis un prénom pour chacun.
- CA3 : « Jose » est compté faux pour « José » (accents stricts) ; « josé » est compté juste (casse ignorée), de même que « José » suivi d'un espace.

### US06 — S'entraîner à International Names
Je veux associer des visages à des prénoms internationaux puis les retrouver, afin de m'entraîner aux prénoms qui ne me sont pas familiers.
Couvre : EF06, EF08, EF10 · RG01, RG07, RG08, RG12, RG13, RG14, RG21
- CA1 : un essai standard présente 30 visages générés par IA, avec des prénoms issus de plusieurs cultures et écrits en alphabet latin.
- CA2 : le déroulé et la correction sont ceux d'US05.

## Déroulé d'un essai

### US07 — Naviguer et terminer la mémorisation plus tôt
Je veux parcourir les éléments à mon rythme et passer au rappel dès que je suis prêt, afin que mon temps de mémorisation reflète ma vitesse réelle.
Couvre : EF08 · RG08, RG09, RG11, RG13 · ENF01
- CA1 : dans toutes les disciplines, → avance d'un groupe, ← recule d'un groupe, barre d'espace ou ↑ revient au début.
- CA1bis : le motif d'affichage se règle dans les paramètres (ex. « 2 2 » ou « 2 3 » chiffres, « 2 » cartes) et s'applique aux essais suivants ; la grille de rappel suit le même découpage.
- CA2 : → deux fois rapidement à la fin des éléments, le bouton Finished ou la touche Entrée arrêtent le chronomètre et lancent le rappel.
- CA3 : le temps enregistré est le temps réellement écoulé, mesuré à la milliseconde.
- CA4 : à score égal, l'essai au temps le plus court est classé devant ; un score plus élevé l'emporte toujours (10 éléments en 60 s battent 9 en 30 s).

### US08 — Saisir et corriger mon rappel comme sur Memory League
Je veux retrouver les mêmes gestes de saisie que sur Memory League, dont l'insertion et la suppression, afin de rattraper un oubli sans tout décaler à la main.
Couvre : EF09 · RG10
- CA1 : chaque discipline propose la saisie décrite dans le détail de RG10.
- CA2 : dans Numbers, Cards, Images et Words, + insère un élément vide à la position sélectionnée et décale la suite d'un cran ; − supprime l'élément sélectionné et ramène la suite.
- CA3 : dans Cards et Images, un élément placé disparaît de la réserve du bas ; le renvoyer en bas le rend de nouveau disponible.

### US09 — S'entraîner en mode personnalisé
Je veux régler la durée de mémorisation et le nombre d'éléments, afin de travailler à mon niveau ou sur un point précis.
Couvre : EF07 · RG15
- CA1 : pour chaque discipline, je peux régler la durée de mémorisation et le nombre d'éléments avant de lancer l'essai.
- CA2 : je peux démarrer avec très peu d'éléments (ex. 10 chiffres) et augmenter par paliers.
- CA3 : un essai personnalisé figure dans l'historique et les statistiques avec les essais standard, mais il se reconnaît à un code couleur.

### US10 — Abandonner un essai
Je veux pouvoir abandonner un essai et décider de ce qu'il devient, afin que mon historique et mes statistiques reflètent ce que je veux mesurer.
Couvre : EF11 · RG18, RG23, RG24
- CA1 : à l'abandon, l'application me propose trois choix : « Garder hors statistiques », « Compter tel quel » ou « Ne pas garder ».
- CA2 : « Garder hors statistiques » enregistre l'essai comme « abandonné » ; il apparaît dans l'historique mais pas dans les statistiques.
- CA3 : « Compter tel quel » corrige l'essai avec les réponses déjà saisies et le compte comme un essai normal.
- CA4 : « Ne pas garder » n'enregistre rien.
- CA5 : un essai interrompu sans que je puisse répondre (onglet fermé, batterie vide) est enregistré avec le statut « Erreur externe à l'application ».
- CA6 : à la réouverture de l'application, elle me propose les trois choix de CA1 pour cet essai interrompu.

### US11 — Voir le détail d'un essai
Je veux voir, après un essai, chaque élément attendu face à ma réponse, afin de comprendre mes erreurs tout de suite.
Couvre : EF12 · RG19
- CA1 : l'écran de résultat affiche le score, le temps de mémorisation, le temps de rappel et la liste des éléments, où les erreurs sont mises en évidence avec la réponse donnée.

### US23 — Me préparer avant la mémorisation et avant le rappel
Je veux une courte pause avant la mémorisation et avant le rappel, afin de me préparer mentalement ou de faire ma pré-mémorisation.
Couvre : EF23 · RG25
- CA1 : au lancement d'un essai, je choisis la durée de chaque pause : 0, 5, 10 ou 20 s. Les dernières durées utilisées pour cette épreuve sont proposées.
- CA2 : pendant une pause, seul un compte à rebours s'affiche ; aucun élément n'est visible.
- CA3 : je peux écourter une pause : la phase suivante démarre aussitôt.
- CA4 : avec 0 s, la phase suivante démarre directement, sans compte à rebours.
- CA5 : les pauses ne comptent ni dans le temps de mémorisation ni dans le temps de rappel.
- CA6 : si j'abandonne pendant la pause avant la mémorisation, rien n'est enregistré et aucune question n'est posée. Pendant la pause avant le rappel, les trois choix d'US10 me sont proposés.

## Suivi

### US12 — Consulter mon historique
Je veux retrouver tous mes essais passés, afin de savoir où j'en suis, notamment après une pause.
Couvre : EF13 · RG18, RG19
- CA1 : l'historique liste tous les essais, du plus récent au plus ancien, filtrables par discipline et par mode.
- CA2 : chaque essai ouvre son détail (US11).
- CA3 : aucun essai terminé ne peut être modifié ni supprimé.

### US13 — Suivre ma progression
Je veux voir mes statistiques et mes courbes par discipline, afin de mesurer mes progrès.
Couvre : EF14 · RG13, RG15
- CA1 : pour chaque discipline, j'obtiens ma meilleure performance, ma moyenne récente et une courbe score / temps dans le temps.
- CA2 : sur les courbes et dans les listes, les essais personnalisés se distinguent des essais standard par un code couleur.

### US14 — Voir mes équivalents en points IAM
Je veux voir ce que mes essais vaudraient en points IAM, aux niveaux National, International et World, afin de comparer mes disciplines sur une même échelle et de me situer.
Couvre : EF15 · RG16, RG17
- CA1 : pour chaque essai et dans les statistiques de chaque discipline, j'obtiens les équivalents National, International et World, dans deux onglets : « épreuve la plus courte » et « épreuve emblématique » (RG16).
- CA2 : dans l'onglet « épreuve la plus courte », 80 chiffres corrects en Numbers donnent 80 ÷ 649 × 1000 = 123,27 points aux trois niveaux (standard 5-min Numbers de 649 au 2026-11-20).
- CA3 : un jeu de 52 cartes correct, mémorisé en 30,00 s, donne 6862 ÷ 30^0,75 = 535,32 points.
- CA4 : quand je mets à jour un standard, les équivalents sont recalculés et la version des standards utilisée est affichée.

### US15 — Analyser mes erreurs
Je veux voir quels éléments je rate le plus souvent, et à quelles positions, afin de cibler mon entraînement.
Couvre : EF16 · RG19
- CA1 : pour chaque discipline, j'obtiens les éléments les plus souvent ratés, les positions les plus fautives et les confusions fréquentes (élément attendu → réponse donnée).
- CA2 : je peux restreindre l'analyse à une période.

## Systèmes mnémotechniques

### US16 — Gérer mes systèmes
Je veux saisir et modifier mes images pour les chiffres et les cartes, afin de les avoir dans l'application.
Couvre : EF17 · RG20
- CA1 : je peux créer, consulter et modifier un système d'images (groupe d'éléments → image).
- CA2 : chaque système a sa propre taille de groupe (ex. 2 chiffres, 3 chiffres, 1 carte, 2 cartes).

### US17 — Réviser mes systèmes
Je veux m'entraîner à retrouver l'image associée à un élément, afin de garder mes systèmes vifs.
Couvre : EF18 · RG20
- CA1 : la révision présente des éléments d'un système au hasard ; je donne l'image et l'application m'indique si c'est juste.

### US18 — Relier mes erreurs à mes systèmes
Je veux voir quelles images sont en cause dans mes erreurs, afin de retravailler les maillons faibles de mes systèmes.
Couvre : EF19 · RG20
- CA1 : depuis une image, je vois le nombre d'erreurs qui lui sont imputées et les essais concernés.
- CA2 : je peux lancer une révision (US17) limitée aux images les plus souvent en cause.

## Transverses

### US19 — Choisir la langue de l'interface
Je veux utiliser l'interface en français ou en anglais.
Couvre : EF20 · ENF05
- CA1 : changer la langue traduit toute l'interface sans recharger mes données ; le choix est conservé.

### US20 — M'entraîner hors connexion
Je veux faire un essai ou une révision sans réseau, afin de m'entraîner n'importe où.
Couvre : EF21 · RG22 · ENF02
- CA1 : sans réseau, je peux lancer et terminer un essai dans toutes les disciplines.
- CA2 : au retour du réseau, l'essai apparaît une seule fois dans l'historique, avec ses dates et temps d'origine.

### US21 — Retrouver mes données sur tous mes appareils
Je veux retrouver mes essais et mes systèmes sur mon ordinateur, mon téléphone et ma tablette.
Couvre : EF21 · RG18, RG22 · ENF03
- CA1 : un essai fait sur un appareil apparaît sur les autres après synchronisation.
- CA2 : chaque écran d'essai s'utilise au clavier comme au toucher.

### US22 — Utiliser l'application comme une application de bureau
Je veux installer l'application sur mon ordinateur, afin de la lancer comme une application de bureau, sans passer par un onglet du navigateur.
Couvre : EF22 · ENF02, ENF03
- CA1 : depuis mon navigateur, j'installe l'application ; elle s'ouvre dans sa propre fenêtre, avec son icône.
- CA2 : l'application installée garde les mêmes données, la même connexion et le même fonctionnement hors connexion que la version web.
