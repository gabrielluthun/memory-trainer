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
| RG11 | **Présentation par groupes** : pendant la mémorisation, chaque appui sur → avance d'un **groupe d'éléments** (ex. 2 cartes, 3 chiffres) dont la **taille se règle dans les paramètres, séparément pour chaque épreuve**. | Décision (comportement Memory League confirmé par le développeur) |

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
