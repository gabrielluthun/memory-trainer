# S7 — Dictionnaire de données

Amont : [règles de gestion](../../01-besoin/regles-de-gestion.md), [diagramme de classes](../uml/classes.md), [séquences](../uml/sequences.md), [exigences de sécurité](../../03-analyse-securite/exigences-securite.md). Aval : [MCD](mcd.md), [MLD](mld.md), [MPD](mpd.md).

## En bref

- **22 données élémentaires ou calculées**, pour le **lot 1** (Numbers), stockées dans **Neon**.
- **Source unique sur chaque donnée** : type, type PostgreSQL, vide permis, valeur par défaut, contraintes et règles. Le MLD et le MPD renvoient ici pour le détail des colonnes.
- Elles sont rangées **par table** (MLD) : `accounts`, `disciplines`, `trials`, `trial_items`, `trial_items_numbers`, `discipline_settings`.
- **Les valeurs sont typées par discipline** : au lot 1, un chiffre est un entier de 0 à 9, et la base refuse toute autre valeur (ES07). Chaque nouvelle discipline ajoutera ses propres données, par migration.
- **Le résultat par élément et le score sont stockés**, et la base vérifie que le score égale le nombre d'éléments justes.
- **Une date est un instant en heure universelle**, affiché dans le fuseau de l'appareil.
- Ces trois choix sont tracés dans l'[ADR 0014](../adr/0014-representation-donnees-essai.md).
- Les **codes** sont les noms de colonnes, **en anglais** comme le code (P7). Les libellés restent en français.

Colonnes des tableaux :
- **Vide** : la colonne accepte-t-elle l'absence de valeur ?
- **Nature** : **Élémentaire** = saisie ou mesurée ; **Calculée** = déduite d'autres données, mais stockée.
- Une donnée qui sert de clé étrangère dans d'autres tables n'est décrite qu'une fois, dans sa table d'origine.

## 1. Compte — table `accounts`

| Donnée | Type | Type PostgreSQL | Vide | Défaut | Nature | Contraintes | Règles |
|---|---|---|---|---|---|---|---|
| **owner_id** : Propriétaire | Texte | `text` | Non | — | Élémentaire | Clé primaire, non vide. Identité du jeton Hanko, posée par la base, jamais envoyée par l'appareil. Une seule ligne : le compte créé par la CI. | ES01, ES04 |
| **interface_language** : Langue de l'interface | Liste de valeurs | `interface_language` (section 7) | Non | `fr` | Élémentaire | `fr` ou `en` | EF20 |
| **settings_modified_at** : Dernière modification des paramètres | Date et heure (instant universel) | `timestamptz` | Non | `-infinity` | Élémentaire | Heure de l'appareil. Une modification plus ancienne ne remplace jamais une plus récente. Le défaut fait gagner la première modification venue d'un appareil. | [ADR 0012](../adr/0012-conflits-parametres-heure-appareil.md) |

`owner_id` est aussi clé étrangère dans `trials` et `discipline_settings`.

## 2. Discipline — table `disciplines`

| Donnée | Type | Type PostgreSQL | Vide | Défaut | Nature | Contraintes | Règles |
|---|---|---|---|---|---|---|---|
| **discipline** : Discipline | Code texte | `text` | Non | — | Élémentaire | Clé primaire, lettres minuscules et `_` seulement. Au lot 1 : `numbers`. Les autres disciplines s'ajoutent à leur lot. | RG01 à RG07 |

`discipline` est aussi clé étrangère dans `trials` et `discipline_settings`.

## 3. Essai — table `trials`

| Donnée | Type | Type PostgreSQL | Vide | Défaut | Nature | Contraintes | Règles |
|---|---|---|---|---|---|---|---|
| **trial_id** : Identifiant de l'essai | Identifiant unique (UUID), 16 octets | `uuid` | Non | — | Élémentaire | Clé primaire. Créé sur l'appareil. Un deuxième envoi est ignoré. | RG22, ES06 |
| **sequence_number** : Numéro d'ordre de réception | Entier long, 8 octets | `bigint` | Non | Identity (`GENERATED ALWAYS`) | Élémentaire | Unique, croissant, attribué par la base à la réception. Impossible à fournir par l'appareil. Peut avoir des trous. | [ADR 0011](../adr/0011-repere-numero-ordre-verrou.md) |
| **mode** : Mode | Liste de valeurs | `trial_mode` (section 7) | Non | — | Élémentaire | `standard` ou `custom` | RG15 |
| **status** : Statut | Liste de valeurs | `trial_status` (section 7) | Non | — | Élémentaire | `completed`, `abandoned` ou `external_error` | RG18, RG23, RG24 |
| **started_at** : Début de l'essai | Date et heure (instant universel), 8 octets | `timestamptz` | Non | — | Élémentaire | Heure de l'appareil, conservée telle quelle | RG19, RG22 |
| **item_count** : Nombre d'éléments | Entier, 2 octets | `smallint` | Non | — | Élémentaire | De 1 à 500 (valeur retenue ci-dessous). Numbers standard : 80. | RG02, RG15 |
| **memorization_limit_ms** : Durée de mémorisation prévue | Entier (millisecondes), 4 octets | `integer` | Non | — | Élémentaire | De 1 000 à 3 600 000 (valeur retenue ci-dessous). Numbers standard : 60 000. | RG01, RG15 |
| **recall_limit_ms** : Durée de rappel prévue | Entier (millisecondes), 4 octets | `integer` | Non | — | Élémentaire | Égale à 240 000, dans les deux modes | RG01, RG15 |
| **memorization_ms** : Temps de mémorisation utilisé | Entier (millisecondes), 4 octets | `integer` | Non | — | Élémentaire | De 0 à `memorization_limit_ms` | RG08, ENF01 |
| **recall_ms** : Temps de rappel utilisé | Entier (millisecondes), 4 octets | `integer` | Non | — | Élémentaire | De 0 à `recall_limit_ms` | RG19, ENF01 |
| **score** : Score | Entier, 2 octets | `smallint` | Oui | — | Calculée | Présent si et seulement si `status` = `completed`. Égal au nombre d'éléments justes, donc de 0 à `item_count`. | RG12, ES07 |

Clés étrangères : `owner_id` (section 1) et `discipline` (section 2), toutes deux obligatoires.

## 4. Élément d'un essai — table `trial_items`

Un élément par chiffre montré : 80 pour un essai standard. Clé primaire : `trial_id` et `position`.

| Donnée | Type | Type PostgreSQL | Vide | Défaut | Nature | Contraintes | Règles |
|---|---|---|---|---|---|---|---|
| **position** : Position de l'élément | Entier, 2 octets | `smallint` | Non | — | Élémentaire | Clé primaire avec `trial_id`. De 1 à `item_count`, unique dans un essai. | RG12, RG19 |
| **is_correct** : Élément juste | Booléen, 1 octet | `boolean` | Oui | — | Calculée | Présent si et seulement si l'essai est `completed`. Vrai seulement si le chiffre répondu égale le chiffre montré. | RG12, ES07 |

Clé étrangère : `trial_id` (section 3).

## 5. Chiffres d'un élément — table `trial_items_numbers`

Une ligne par élément d'un essai Numbers. Même clé que `trial_items` : `trial_id` et `position`.

| Donnée | Type | Type PostgreSQL | Vide | Défaut | Nature | Contraintes | Règles |
|---|---|---|---|---|---|---|---|
| **expected_digit** : Chiffre montré | Entier court, 2 octets | `smallint` | Non | — | Élémentaire | De 0 à 9 | RG02, RG21 |
| **answered_digit** : Chiffre répondu | Entier court, 2 octets | `smallint` | Oui | — | Élémentaire | De 0 à 9, vide si la case n'a pas été remplie | RG10, RG12 |

Clé étrangère : (`trial_id`, `position`) vers `trial_items` (section 4).

## 6. Réglages par discipline — table `discipline_settings`

Les réglages de chaque discipline. Clé primaire : `owner_id` et `discipline`. Ils sont modifiables (CU15), contrairement aux essais.

| Donnée | Type | Type PostgreSQL | Vide | Défaut | Nature | Contraintes | Règles |
|---|---|---|---|---|---|---|---|
| **group_pattern** : Motif d'affichage | Tableau d'entiers, 2 octets chacun | `smallint[]` | Non | — | Élémentaire | 1 à 3 valeurs, chacune de 1 à 5 (ex. `{2,3}`) | RG11 |
| **pause_before_memorization_s** : Pause avant la mémorisation | Entier (secondes), 2 octets | `smallint` | Non | — | Élémentaire | 0, 5, 10 ou 20 | RG25 |
| **pause_before_recall_s** : Pause avant le rappel | Entier (secondes), 2 octets | `smallint` | Non | — | Élémentaire | 0, 5, 10 ou 20 | RG25 |

Clés étrangères : `owner_id` (section 1) et `discipline` (section 2).

## 7. Listes de valeurs (types ENUM)

| Type PostgreSQL | Valeurs | Utilisé par | Règles |
|---|---|---|---|
| **trial_mode** | `standard`, `custom` | `trials.mode` | RG15 |
| **trial_status** | `completed`, `abandoned`, `external_error` | `trials.status` | RG18, RG23, RG24 |
| **interface_language** | `fr`, `en` | `accounts.interface_language` | EF20 |

Les listes sont des types ENUM ([ADR 0017](../adr/0017-integrite-base-donnees.md)) : ajouter une valeur est simple, en retirer une demande de recréer le type.

## 8. Ce qui n'est pas dans le dictionnaire

| Donnée | Pourquoi |
|---|---|
| Essai en cours (instantané), file d'envoi, repère de réception, marque « refusé », indicateur « paramètres à envoyer » | Elles ne vivent que sur l'appareil, dans Dexie.js : hors du périmètre choisi (Neon seulement). Elles sont décrites par le diagramme de classes (`TrialSnapshot`, `Outbox`). |
| Repère du Worker de sauvegarde | Il vit dans R2, pas dans Neon (SEQ06). |
| Durées des pauses d'un essai | Les pauses ne sont pas enregistrées avec l'essai (RG25). |
| Date de réception d'un essai | Non nécessaire : le numéro d'ordre suffit à la synchronisation et à la sauvegarde (minimisation). |
| Langue du contenu, cartes, images, mots, prénoms, visages | Arrivent avec Cards, Images, Words et Names (lots 2 et 3). Ils seront ajoutés ici avant leur lot. |
| Systèmes d'images, standards IAM | Lots 5 et 6. |

## Valeurs retenues

> Décision : en mode personnalisé, le **nombre d'éléments** va de **1 à 500**. RG15 dit « de très peu d'éléments jusqu'au format standard et au-delà », sans plafond.

> Décision : en mode personnalisé, la **durée de mémorisation** va de **1 seconde à 1 heure** (3 600 000 ms). RG15 ne fixe pas de bornes.

> Décision : la taille des groupes est remplacée par un **motif d'affichage** de **1 à 3 sous-groupes de 1 à 5 éléments**, stocké en **tableau d'entiers** ([ADR 0027](../adr/0027-motif-affichage.md)). « 2 » par défaut pour Numbers.

## Points ouverts

| Point | Pourquoi | Quand |
|---|---|---|
| **Volume réel d'un essai** | Environ 7 Ko de données mesurés sur PostgreSQL 16 ([MPD](mpd.md)), 12 à 14 Ko avec les index. Mesure à refaire sur Neon. | Sprint 0 |
| **Données typées des lots 2 et 3** | Une carte, une image, un mot ou un prénom auront chacun leur type et leurs contrôles. | Avant les lots 2 et 3 |
