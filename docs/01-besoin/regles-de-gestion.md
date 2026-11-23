# B7 — Règles de gestion (RG)

Amont : [exigences](exigences.md), [contraintes](contraintes.md). Statuts, détails et sources : [regles-de-gestion-details.md](regles-de-gestion-details.md).

## Format des essais

| ID | Règle | Statut |
|---|---|---|
| RG01 | Dans les six disciplines, en format standard, la mémorisation dure **1 minute** et le rappel **4 minutes**. | Officiel [S0] |
| RG02 | **Numbers** : mémoriser des **chiffres aléatoires** (80 en format standard), puis les restituer dans l'ordre. | Officiel [S0] (chiffres aléatoires). Quantité : [S1], confirmée (décision). |
| RG03 | **Cards** : mémoriser des **cartes à jouer aléatoires** (un jeu de 52 cartes mélangé en format standard), puis les restituer dans l'ordre. | Officiel [S0] (cartes aléatoires). Quantité : [S1], confirmée (décision). |
| RG04 | **Images** : mémoriser des **images aléatoires** (30 en format standard), puis les **remettre dans l'ordre d'origine**. | Officiel [S0] (images aléatoires, rappel par repositionnement). Quantité : [S1], confirmée (décision). |
| RG05 | **Words** : mémoriser des **mots aléatoires** (50 en format standard), puis les restituer dans l'ordre. Langue au choix, français ou anglais. | Officiel [S0] (mots aléatoires). Quantité : [S1], confirmée (décision). Langue : décision. |
| RG06 | **Names** : mémoriser les **prénoms** (prénom seul) associés à des visages (30 en format standard), issus de la base nationale de la langue choisie. Au rappel, les visages réapparaissent **dans un ordre différent** et l'on saisit le prénom sous chaque visage. | Officiel [S0] (prénoms, saisie sous chaque photo). Quantité et base nationale : [S1], confirmées (décision). Ordre différent au rappel : [S1], confirmé (décision). Langue : décision. |
| RG07 | **International Names** : même déroulé que RG06, avec des **prénoms internationaux**. Les prénoms de cultures non latines sont **translittérés en alphabet latin** (ex. « Yuki »). | Officiel [S0] (déroulé identique). Prénoms internationaux : [S1], confirmés (décision). Translittération : décision. |
| RG08 | Le pratiquant peut **arrêter le chronomètre de mémorisation avant la fin** de la minute. Le temps de mémorisation réellement utilisé est enregistré. | Officiel [S0] |
| RG09 | **Navigation pendant la mémorisation** (toutes disciplines) : → avance, ← recule, barre d'espace ou ↑ revient au début. **Arrêt du chronomètre** : → deux fois rapidement à la fin des éléments, bouton **Finished**, ou touche Entrée. | Officiel [S0] |
| RG10 | **Saisie du rappel**, propre à chaque discipline ([détail](regles-de-gestion-details.md#rg10--saisie-du-rappel-par-discipline-officiel-s0)). Dans Numbers, Cards, Images et Words, **+** insère un élément en décalant la suite, **−** supprime un élément en ramenant la suite. | Officiel [S0] |
| RG11 | **Présentation par groupes** : pendant la mémorisation, chaque appui sur → avance d'un **groupe d'éléments**. Le groupe suit un **motif d'affichage** de **1 à 3 sous-groupes de 1 à 5 éléments**, séparés par un espace : « 2 » montre « 45 », « 2 2 » montre « 45 83 », « 2 3 » montre « 42 791 ». Le motif se **règle dans les paramètres, séparément pour chaque épreuve** (« 2 » par défaut pour Numbers), et la **grille de rappel** suit le même découpage. | Décision (comportement Memory League confirmé par le développeur ; motif ajouté pendant le développement du lot 1) |
| RG25 | **Temps de préparation** : une pause précède la **mémorisation**, une autre précède le **rappel**. Chacune dure **0, 5, 10 ou 20 s** (0 = pas de pause). Les deux durées se choisissent **au lancement de l'essai, pour chaque épreuve** : les dernières utilisées pour cette épreuve sont proposées. Pendant une pause, **seul le compte à rebours s'affiche**, les éléments sont cachés. Le pratiquant peut **écourter** une pause. Les pauses existent en mode standard comme en mode personnalisé, ne comptent dans **aucun temps** de l'essai et **ne sont pas enregistrées** avec lui. **Abandon pendant la pause avant la mémorisation** : rien n'a commencé, l'essai n'est pas enregistré, sans question. **Pendant la pause avant le rappel** : les trois choix de RG23. | Décision |

## Correction et score

| ID | Règle | Statut |
|---|---|---|
| RG12 | **1 point par élément correctement restitué**. Pour les disciplines à séquence (Numbers, Cards, Images, Words), un élément est correct s'il est **à la bonne position** ; pour Names, si le prénom saisi sous un visage est le sien. **Aucune pénalité** : un élément faux ou vide vaut 0. | Officiel [S0] (1 point par élément). Position et absence de pénalité : déduit. |
| RG13 | **Le score prime sur le temps** : on compare d'abord le score, puis, à score égal, le **temps de mémorisation le plus court**. Exemple officiel : 10 éléments en 60 s battent 9 éléments en 30 s. | Officiel [S0] |
| RG14 | Names et International Names : un prénom n'est correct que si son **orthographe est exacte, accents compris**. La **casse est ignorée** : « josé » est juste pour « José », « Jose » est faux. Les **espaces en début et en fin** de saisie sont ignorés. | Décision |

## Modes

| ID | Règle | Statut |
|---|---|---|
| RG15 | Le **mode personnalisé** permet de régler la durée de mémorisation et le **nombre d'éléments**, de très peu d'éléments jusqu'au format standard et au-delà, pour progresser par paliers. Ses essais sont **mélangés aux essais standard** dans l'historique, les statistiques et les meilleures performances, mais **reconnaissables par un code couleur**. | Décision |

## Points IAM (statistiques)

| ID | Règle | Statut |
|---|---|---|
| RG16 | Chaque essai reçoit, **pour les statistiques uniquement**, des **équivalents en points IAM** aux niveaux National, International et World, calculés avec les formules IAM et les standards en vigueur (RG17). Deux correspondances sont proposées, **dans des onglets séparés** : l'**épreuve IAM la plus courte** de chaque niveau et l'**épreuve emblématique** (la plus longue) de chaque niveau ([formules et correspondances](regles-de-gestion-details.md#rg16--points-iam)). Le score Memory League (RG12, RG13) reste la référence. | Formules et standards : officiel [S5]. Correspondances et onglets : décision. |
| RG17 | Les **standards IAM évoluent** : un standard battu par 3 compétiteurs devient 1,1 fois la moyenne de leurs scores. Les standards sont donc des **données datées et modifiables**, jamais écrites en dur, et chaque calcul indique la version des standards utilisée. | Officiel [S4] (§ 8.d). Gestion des versions : décision. |

## Format IAM

Règles ajoutées pendant le développement du lot 1. Source : règlement IAM de novembre 2019 [S4], le plus récent trouvé. Les règles RG01 à RG14 restent celles du format Memory League.

| ID | Règle | Statut |
|---|---|---|
| RG26 | **Niveaux et durées** : chaque épreuve IAM se pratique au niveau **National, International ou World**, qui fixe la durée de mémorisation et de rappel ([tableau des durées](regles-de-gestion-details.md#rg26--durées-des-épreuves-iam)). Chaque essai de l'application est **une tentative** : quand le règlement prévoit deux tentatives (5-min Numbers, Speed Cards), chacune est un essai à part. | Durées : officiel [S4] (§ 2, § 9.d). Une tentative = un essai : décision. |
| RG27 | **Présentation** : Numbers en **rangées de 40 chiffres**, Binary en **rangées de 30 chiffres** (0 et 1), de gauche à droite ; Words en **colonnes de 20 mots**, de haut en bas ; Images en **rangées de 5 images** ; Dates en **événements de 1 à 6 mots**. Quantité fournie : le **record du monde + 20 %**, arrondi à la rangée ou à la colonne complète, donnée modifiable comme les standards (RG17). | Présentation et quantité : officiel [S4] (§ 3, § 7). Donnée modifiable : décision. |
| RG28 | **Barème par rangée** (Numbers, Binary, Words, Cards) : une rangée, colonne ou jeu **entièrement juste** rapporte tous ses points (40, 30, 20 ou 52) ; avec **une seule erreur** (fausse ou vide), la **moitié** ; avec **deux erreurs ou plus**, **0**. La **dernière** rangée n'a pas à être complète : elle est corrigée jusqu'à la dernière réponse saisie. Un total en demi-point est **arrondi au-dessus** ; un total négatif vaut **0**. | Officiel [S4] (§ 2, § 4.a, § 4.b) |
| RG29 | **Words IAM** : mots en français ou en anglais, dont **80 % de noms concrets, 10 % de noms abstraits, 10 % de verbes à l'infinitif** ; ni pluriel, ni mot composé. Sans arbitre, **toute différence d'orthographe compte comme une erreur** (comme le logiciel IAM sans réclamation). La casse est ignorée. | Composition et correction logicielle : officiel [S4] (§ 3.a, § 4.f). Casse ignorée : décision (comme RG14). |
| RG30 | **Images IAM** : au rappel, chaque rangée de 5 images réapparaît **mélangée** et l'on donne l'ordre d'origine. Rangée juste : **+5**. Rangée fausse ou incomplète, **dernière rangée comprise** : **−1**. Rangée non abordée : 0. | Officiel [S4] (§ 3.f, § 5.f). Rangée non abordée : déduit. |
| RG31 | **Names and Faces IAM** : chaque visage a un **prénom et un nom**. Au rappel, les visages réapparaissent dans un ordre différent. **1 point** par prénom ou nom juste. Un même prénom ou nom écrit **plus de deux fois** coûte **−0,5** par écriture en trop. Orthographe exacte, accents compris, casse ignorée (comme RG14). | Officiel [S4] (§ 3.c, § 5.c). Accents et casse : décision (comme RG14). |
| RG32 | **Dates** : des **événements fictifs**, chacun avec une **année de 1000 à 2099**, en français ou en anglais. Au rappel, les événements réapparaissent dans le désordre et l'on donne l'année. Date juste : **+1** ; date fausse : **−0,5** ; date vide : 0. | Officiel [S4] (§ 3.g, § 5.g). Langue : déduit (ENF05). |
| RG33 | **Spoken Numbers** : une voix dicte les chiffres au rythme d'**un chiffre par seconde**, sans retour en arrière. Tentatives de **100, 200, 300 ou 550 chiffres**, avec **5, 10, 15 ou 25 min** de rappel. Score : le nombre de chiffres justes **jusqu'à la première erreur**. | Officiel [S4] (§ 2, § 3.h, § 5.h) |
| RG34 | **Speed Cards** : un jeu de 52 cartes, **5 min** de mémorisation au plus (arrêt possible avant, RG08) et **5 min** de rappel. Jeu entièrement juste : le score est le **temps de mémorisation**. Sinon : le nombre de cartes justes **jusqu'à la première erreur**. Un jeu complet bat toujours un jeu incomplet. | Officiel [S4] (§ 2, § 3.i, § 5.i). Classement : déduit des formules (RG36). |
| RG35 | **Cards IAM** (10, 30 ou 60 min) : le pratiquant choisit **le nombre de jeux** avant l'essai. Chaque jeu est corrigé selon RG28. | Officiel [S4] (§ 7.c) |
| RG36 | **Points IAM réels** : un essai au format IAM reçoit directement les **points IAM** de son épreuve et de son niveau ([formules](regles-de-gestion-details.md#formules-iam-calculateur-officiel-s5-relevé-le-2026-11-20), standards de RG17). Les **équivalents** de RG16 restent réservés aux essais Memory League. | Formules : officiel [S4] (§ 8), [S5]. Séparation : déduit (règlement IAM choisi). |
| RG37 | **Préparation au format IAM** : RG25 s'applique, avec en plus un choix de **60 s**, la préparation officielle IAM. | Préparation de 1 min : officiel [S4] (§ 6.b). |
| RG38 | **Systèmes au format IAM** : les essais IAM de Numbers, Cards et Speed Cards sont rattachés aux images des systèmes comme en RG20. | Déduit (RG20) |

> Décision : RG37 — ajouter le choix de 60 s aux temps de préparation pour le format IAM.

> Décision : RG38 — Binary et Spoken Numbers ne sont **pas** rattachés aux systèmes (un système binaire, ex. 3 chiffres binaires → 1 chiffre, n'est pas prévu).

> Décision : RG27, RG29, RG31 — quantité fournie modifiable comme les standards ; casse ignorée et accents stricts comme RG14. RG31 : Names and Faces IAM existe en **deux variantes**, nationale (langue au choix) et internationale, comme Names et International Names au format Memory League.

> Décision : RG33 — un **compte à rebours** annonce le premier chiffre ; la voix parle **la langue de l'interface**.

> Décision : RG26 — chaque tentative est un essai à part, sans règle « meilleure des deux » ; le niveau **Regional** n'est pas proposé : c'est un National sans 10-min Cards, 15-min Numbers ni Spoken Numbers, donc déjà couvert.

## Exercices et systèmes

Règles ajoutées pendant le développement du lot 1.

| ID | Règle | Statut |
|---|---|---|
| RG39 | **Système majeur** : chaque chiffre correspond à des **sons** de consonnes (0 = s, z ; 1 = t, d ; 2 = n ; 3 = m ; 4 = r ; 5 = l ; 6 = ch, j ; 7 = k, g dur ; 8 = f, v ; 9 = p, b). Les voyelles et les autres sons ne comptent pas. Pour chaque nombre d'un système de chiffres, l'application propose des **mots de la langue choisie** dont les consonnes donnent ce nombre (ex. « tonne » → 12). Le pratiquant en choisit un, ou saisit le sien, et l'ajoute comme image du système. | Table des sons : convention du système majeur. Le reste : décision. |
| RG40 | **Révision rapide** : l'application montre un élément d'un système (nombre ou cartes, selon sa taille de groupe) et **mesure le temps** jusqu'à la réponse. Les éléments ratés ou lents **reviennent plus souvent** (répétition espacée) ; ceux qui sont sus et rapides s'espacent. | Décision |
| RG41 | **Carte manquante** : les cartes d'un jeu de 52, **moins une tirée au hasard**, défilent une à une. Le pratiquant désigne ensuite la carte qui **n'a pas été montrée**. Exercice **solo**. | Décision |
| RG42 | **Exercices sans trace** : la révision (RG40), la carte manquante (RG41) et le système majeur (RG39) n'enregistrent **rien** dans l'historique ni dans les statistiques. Seul l'**état de la répétition espacée** de la révision est conservé et synchronisé. RG18 et RG19 ne s'appliquent pas à ces exercices. | Décision |

> Décision : RG40 — pour répondre, je **révèle l'image** puis je m'évalue (« su » ou « pas su ») ; le temps mesuré est celui jusqu'à la révélation.

> Décision : RG41 — le **rythme** de défilement se règle (ex. 1 carte par seconde) ; le résultat affiché est « juste » ou « faux », avec le temps de réponse.

> Décision : RG39 — table des sons en anglais : 6 = j, sh, ch ; le reste identique au français.

## Données et intégrité

| ID | Règle | Statut |
|---|---|---|
| RG18 | Un essai terminé est **immuable** : ni modifiable, ni supprimable. | Décision (« aucun résultat perdu ni modifiable ») |
| RG19 | Pour chaque essai, on conserve **indéfiniment** l'intégralité du détail : éléments montrés et leur ordre, réponses saisies, résultat par élément, temps de mémorisation et de rappel (à la ms), discipline, mode, langue, date. | Décision |
| RG20 | Dans Numbers et Cards, chaque groupe d'éléments d'un essai est rattaché à l'**image du système** qui lui correspond ; une erreur est ainsi imputable à une image. **Chaque système définit la taille de ses groupes** (ex. 2 ou 3 chiffres, 1 ou 2 cartes par image). Les erreurs ne sont **pas** rattachées aux lieux des palais, et Images, Words et Names n'ont pas de système à rattacher. | Décision |
| RG21 | Chaque essai utilise une **nouvelle séquence tirée au hasard**. Un même mot, une même image, un même visage ou un même prénom **n'apparaît jamais deux fois** dans un essai (tirage sans remise). | Officiel [S0] (éléments aléatoires). Tirage sans remise : décision. |
| RG22 | Un essai réalisé hors connexion est synchronisé **une seule fois**, sans perte ni doublon, et garde ses dates et temps d'origine. | Décision (hors ligne indispensable) |
| RG23 | **Abandon volontaire** : quand le pratiquant abandonne un essai, l'application lui demande de choisir entre trois options. **Garder hors statistiques** : l'essai est enregistré comme « abandonné », visible dans l'historique et exclu des statistiques. **Compter tel quel** : l'essai est corrigé avec ce qui a été saisi et compte comme un essai normal. **Ne pas garder** : l'essai n'est pas enregistré. | Décision. Compatible avec RG18 : un essai non gardé n'est jamais enregistré, donc jamais supprimé (déduit). |
| RG24 | **Interruption subie** (onglet fermé, batterie vide, plantage) : l'essai est enregistré avec le statut **« Erreur externe à l'application »**. À la réouverture de l'application, le pratiquant choisit son sort parmi les trois options de RG23. | Décision |
