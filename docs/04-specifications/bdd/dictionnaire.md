# S7 — Dictionnaire de données

Amont : [règles de gestion](../../01-besoin/regles-de-gestion.md), [diagramme de classes](../uml/classes.md), [séquences](../uml/sequences.md), [exigences de sécurité](../../03-analyse-securite/exigences-securite.md).

## En bref

- **22 données élémentaires ou calculées**, pour le **lot 1** (Numbers), stockées dans **Neon**.
- Elles se regroupent en trois sujets : l'**essai**, ses **éléments** (un par chiffre) et les **paramètres**. Le MCD (S8) fixera les entités et leurs liens.
- **Les valeurs sont typées par discipline** : au lot 1, un chiffre est un entier de 0 à 9, et la base refuse toute autre valeur (ES07). Chaque nouvelle discipline ajoutera ses propres données, par migration.
- **Le résultat par élément et le score sont stockés**, et la base vérifie que le score égale le nombre d'éléments justes.
- **Une date est un instant en heure universelle**, affiché dans le fuseau de l'appareil.
- Ces trois choix sont tracés dans l'[ADR 0014](../adr/0014-representation-donnees-essai.md).
- Les **codes** sont les futurs noms de colonnes, **en anglais** comme le code (P7). Les libellés restent en français.

Colonne « Nature » : **Élémentaire** = saisie ou mesurée ; **Calculée** = déduite d'autres données, mais stockée.

## 1. Essai

| Donnée | Type | Taille | Nature | Contraintes | Règles |
|---|---|---|---|---|---|
| **trial_id** : Identifiant de l'essai | Identifiant unique (UUID) | 16 octets | Élémentaire | Créé sur l'appareil. Unique : un deuxième envoi est ignoré. | RG22, ES06 |
| **sequence_number** : Numéro d'ordre de réception | Entier long | 8 octets | Élémentaire | Attribué par la base à la réception, croissant, unique. Jamais envoyé par l'appareil. | [ADR 0011](../adr/0011-repere-numero-ordre-verrou.md) |
| **owner_id** : Propriétaire | Texte | 36 caractères | Élémentaire | Identité du jeton Hanko, posée par la base, jamais envoyée par l'appareil. Égale à l'identifiant du compte unique. | ES01, ES04 |
| **discipline** : Discipline | Liste de valeurs | — | Élémentaire | Au lot 1 : `numbers`. Les autres disciplines s'ajoutent à leur lot. | RG01 à RG07 |
| **mode** : Mode | Liste de valeurs | — | Élémentaire | `standard` ou `custom` | RG15 |
| **status** : Statut | Liste de valeurs | — | Élémentaire | `completed`, `abandoned` ou `external_error` | RG18, RG23, RG24 |
| **started_at** : Début de l'essai | Date et heure (instant universel) | 8 octets | Élémentaire | Heure de l'appareil, conservée telle quelle | RG19, RG22 |
| **item_count** : Nombre d'éléments | Entier | 2 octets | Élémentaire | 80 en standard. En mode personnalisé : de 1 à 500 (hypothèse ci-dessous) | RG02, RG15 |
| **memorization_limit_ms** : Durée de mémorisation prévue | Entier (millisecondes) | 4 octets | Élémentaire | 60 000 en standard. En mode personnalisé : de 1 000 à 3 600 000 (hypothèse ci-dessous) | RG01, RG15 |
| **recall_limit_ms** : Durée de rappel prévue | Entier (millisecondes) | 4 octets | Élémentaire | 240 000, dans les deux modes | RG01, RG15 |
| **memorization_ms** : Temps de mémorisation utilisé | Entier (millisecondes) | 4 octets | Élémentaire | De 0 à `memorization_limit_ms` | RG08, ENF01 |
| **recall_ms** : Temps de rappel utilisé | Entier (millisecondes) | 4 octets | Élémentaire | De 0 à `recall_limit_ms` | RG19, ENF01 |
| **score** : Score | Entier | 2 octets | Calculée | Obligatoire si `status` = `completed`, vide sinon. Égal au nombre d'éléments justes, donc de 0 à `item_count`. | RG12, ES07 |

## 2. Élément d'un essai

Un élément par chiffre montré : 80 pour un essai standard.

| Donnée | Type | Taille | Nature | Contraintes | Règles |
|---|---|---|---|---|---|
| **position** : Position de l'élément | Entier | 2 octets | Élémentaire | De 1 à `item_count`. Unique dans un essai. | RG12, RG19 |
| **expected_digit** : Chiffre montré | Entier court | 2 octets | Élémentaire | De 0 à 9 | RG02, RG21 |
| **answered_digit** : Chiffre répondu | Entier court | 2 octets | Élémentaire | De 0 à 9, ou vide si la case n'a pas été remplie | RG10, RG12 |
| **is_correct** : Élément juste | Booléen | 1 octet | Calculée | Obligatoire si l'essai est `completed`, vide sinon. Vrai seulement si `answered_digit` = `expected_digit`. | RG12, ES07 |

## 3. Paramètres

Les paramètres généraux, puis ceux de chaque discipline. Ils sont modifiables (CU15), contrairement aux essais.

| Donnée | Type | Taille | Nature | Contraintes | Règles |
|---|---|---|---|---|---|
| **interface_language** : Langue de l'interface | Liste de valeurs | — | Élémentaire | `fr` ou `en` | EF20 |
| **settings_modified_at** : Dernière modification des paramètres | Date et heure (instant universel) | 8 octets | Élémentaire | Heure de l'appareil. Une modification plus ancienne ne remplace jamais une plus récente. | [ADR 0012](../adr/0012-conflits-parametres-heure-appareil.md) |
| **group_size** : Taille des groupes (par discipline) | Entier | 2 octets | Élémentaire | De 1 à 10 (hypothèse ci-dessous) | RG11 |
| **pause_before_memorization_s** : Pause avant la mémorisation (par discipline) | Entier (secondes) | 2 octets | Élémentaire | 0, 5, 10 ou 20 | RG25 |
| **pause_before_recall_s** : Pause avant le rappel (par discipline) | Entier (secondes) | 2 octets | Élémentaire | 0, 5, 10 ou 20 | RG25 |

Les paramètres sont rattachés au propriétaire (`owner_id`), et ceux de chaque discipline à la discipline (`discipline`). Ces deux données sont déjà décrites en section 1.

## 4. Ce qui n'est pas dans le dictionnaire

| Donnée | Pourquoi |
|---|---|
| Essai en cours (instantané), file d'envoi, repère de réception, marque « refusé », indicateur « paramètres à envoyer » | Elles ne vivent que sur l'appareil, dans Dexie.js : hors du périmètre choisi (Neon seulement). Elles sont décrites par le diagramme de classes (`TrialSnapshot`, `Outbox`). |
| Repère du Worker de sauvegarde | Il vit dans R2, pas dans Neon (SEQ06). |
| Durées des pauses d'un essai | Les pauses ne sont pas enregistrées avec l'essai (RG25). |
| Date de réception d'un essai | Non nécessaire : le numéro d'ordre suffit à la synchronisation et à la sauvegarde (minimisation). |
| Langue du contenu, cartes, images, mots, prénoms, visages | Arrivent avec Cards, Images, Words et Names (lots 2 et 3). Ils seront ajoutés ici avant leur lot. |
| Systèmes d'images, standards IAM | Lots 5 et 6. |

## Hypothèses à valider

> Hypothèse à valider : en mode personnalisé, le **nombre d'éléments** va de **1 à 500**. RG15 dit « de très peu d'éléments jusqu'au format standard et au-delà », sans plafond.

> Hypothèse à valider : en mode personnalisé, la **durée de mémorisation** va de **1 seconde à 1 heure** (3 600 000 ms). RG15 ne fixe pas de bornes.

> Hypothèse à valider : la **taille des groupes** va de **1 à 10** chiffres. Les tailles proposées et la valeur par défaut seront fixées avec les maquettes (S12, CU15).

## Points ouverts

| Point | Pourquoi | Quand |
|---|---|---|
| **Volume réel d'un essai** | S3 estimait 12 Ko par essai Numbers. Le MCD et le MPD donneront la taille exacte d'une ligne d'élément. | S8, S10 |
| **Données typées des lots 2 et 3** | Une carte, une image, un mot ou un prénom auront chacun leur type et leurs contrôles. | Avant les lots 2 et 3 |
