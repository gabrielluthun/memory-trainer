# B5 / B6 — Exigences

Amont : [besoins](besoins.md), [contraintes](contraintes.md). Les règles détaillées sont dans [regles-de-gestion.md](regles-de-gestion.md). Les exigences de sécurité (ES) sont en fin de fichier.

## B5 — Exigences fonctionnelles (EF)

### Disciplines

| ID | Exigence | RG liées |
|---|---|---|
| EF01 | Proposer la discipline **Numbers** au format Memory League. | RG01, RG02 |
| EF02 | Proposer la discipline **Cards** au format Memory League. | RG01, RG03 |
| EF03 | Proposer la discipline **Images** au format Memory League. | RG01, RG04 |
| EF04 | Proposer la discipline **Words** au format Memory League, en français ou en anglais. | RG01, RG05 |
| EF05 | Proposer la discipline **Names** (prénoms nationaux, langue au choix), avec des visages générés par IA. | RG01, RG06 |
| EF06 | Proposer la discipline **International Names**, avec des visages générés par IA. | RG01, RG07 |
| EF07 | Proposer, en plus du format standard, un **mode personnalisé** où l'on règle la durée et le nombre d'éléments. | RG15 |

### Déroulé d'un essai

| ID | Exigence | RG liées |
|---|---|---|
| EF08 | **Chronométrer** la mémorisation et le rappel, permettre de **naviguer parmi les éléments** et de **terminer la mémorisation avant la fin** du temps imparti. | RG01, RG08, RG09, RG11 |
| EF09 | **Saisir le rappel** avec les interactions de Memory League propres à chaque discipline, dont l'**insertion et la suppression** d'un élément avec décalage de la suite. | RG10 |
| EF10 | **Corriger** le rappel et calculer le **score** de l'essai. | RG12, RG13, RG14 |
| EF11 | **Abandonner un essai** en choisissant son sort, et enregistrer les essais **interrompus** par un incident extérieur. | RG23, RG24 |
| EF12 | Afficher le **détail d'un essai** : éléments montrés, réponses, erreurs, score, temps. | RG19 |
| EF23 | Proposer un **temps de préparation** avant la mémorisation et un autre avant le rappel, choisis au lancement de l'essai et **écourtables**. | RG25 |

### Suivi

| ID | Exigence | RG liées |
|---|---|---|
| EF13 | Conserver et consulter l'**historique complet** des essais. | RG18, RG19 |
| EF14 | Afficher des **statistiques et des courbes de progression** par discipline et par mode. | RG13, RG15 |
| EF15 | Afficher, dans les statistiques, des **équivalents en points IAM** (National, International, World) pour chaque essai et chaque discipline. | RG16, RG17 |
| EF16 | **Analyser les erreurs** de façon agrégée : éléments les plus ratés, positions, confusions fréquentes. | RG19 |

### Systèmes mnémotechniques

| ID | Exigence | RG liées |
|---|---|---|
| EF17 | **Gérer ses systèmes d'images** : images associées aux chiffres et aux cartes, avec la taille de groupe propre à chaque système (création, consultation, modification). | RG20 |
| EF18 | **Réviser ses systèmes** par un exercice élément → image. | RG20 |
| EF19 | **Rattacher chaque erreur** d'exercice à l'image du système concernée, et afficher ces erreurs depuis le système. | RG20 |

### Transverses

| ID | Exigence | RG liées |
|---|---|---|
| EF20 | **Choisir la langue de l'interface** : français ou anglais. | — |
| EF21 | **Retrouver ses données sur tous ses appareils** (synchronisation). | RG18, RG22 |
| EF22 | **Installer l'application sur ordinateur** et l'utiliser comme une application de bureau, dans sa propre fenêtre (ajoutée le 2026-11-20, voir [ADR 0006](../04-specifications/adr/0006-bureau-pwa-installee.md)). | — |

## B6 — Exigences non fonctionnelles (ENF)

| ID | Catégorie | Exigence |
|---|---|---|
| ENF01 | Précision | Les temps de mémorisation et de rappel sont **mesurés à la milliseconde** et **affichés au centième de seconde**. |
| ENF02 | Hors ligne | Les exercices et les révisions **fonctionnent sans connexion**. Les résultats sont synchronisés au retour du réseau, **sans perte ni doublon** (RG22). |
| ENF03 | Compatibilité | L'application s'utilise sur **ordinateur (clavier et souris), téléphone et tablette (tactile)**, avec une interface adaptée à chaque format. Tout essai peut se faire au clavier comme au toucher. |
| ENF04 | Accessibilité | Accessibilité de base : **contrastes suffisants, navigation au clavier, tailles lisibles, mode sombre**. |
| ENF05 | Internationalisation | Interface et contenus (mots, prénoms) disponibles en **français et en anglais** ; aucun texte d'interface en dur. |
| ENF06 | Coût | Fonctionnement entièrement sur des **offres gratuites**. |
| ENF07 | Fiabilité des données | **Aucun essai terminé n'est perdu** (panne, fermeture de l'onglet, perte de réseau) ; les données sont sauvegardées régulièrement. |
| ENF08 | Performance | L'affichage et le passage d'un élément au suivant pendant un essai n'introduisent **aucune latence perceptible**. Le chronométrage n'en dépend pas. |
| ENF09 | Compatibilité navigateurs | Fonctionne sur les versions récentes des principaux navigateurs. |

Précisions (décision) :

- ENF08 : « aucune latence perceptible » = **moins de 100 ms** entre l'action (élément suivant, saisie) et l'affichage. Les contenus d'un essai (images, visages) sont chargés **avant** le début du chronomètre.
- ENF09 : les **deux dernières versions** de Chrome, Safari (macOS et iOS), Firefox et Edge.

## Exigences de sécurité (ES)

Les 19 exigences **ES01 à ES19** sont détaillées dans [exigences-securite.md](../03-analyse-securite/exigences-securite.md), avec les menaces qu'elles traitent et la façon de les vérifier.

| Thème | Exigences |
|---|---|
| Un seul compte, bien protégé | ES01 à ES03 |
| La base fait la loi | ES04 à ES07 |
| Rien de privé dans le repo | ES08 à ES11 |
| Le moins de choses possible | ES12 à ES16 |
| Toujours pouvoir revenir en arrière | ES17 à ES19 |
