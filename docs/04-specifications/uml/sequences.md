# S5 — Diagrammes de séquence

Amont : [cas d'utilisation](cas-utilisation.md), [architecture](../architecture.md), [contraintes techniques](../contraintes-techniques.md), [règles de gestion](../../01-besoin/regles-de-gestion.md), [exigences de sécurité](../../03-analyse-securite/exigences-securite.md).

## En bref

- **7 diagrammes**, un par flux clé du lot 1 : ouverture, essai, abandon et interruption, connexion, synchronisation, sauvegarde, déploiement.
- **Une pause précède la mémorisation et une autre précède le rappel** (0 à 20 s, écourtables). Elles restent hors chronomètre (RG25).
- **Un essai se déroule entièrement sur l'appareil**, sans réseau. Il n'est envoyé à Neon qu'une fois **terminé** ou une fois son sort décidé.
- **Un essai est envoyé par une seule fonction SQL**, en une transaction : l'essai et ses éléments arrivent ensemble, ou pas du tout ([ADR 0010](../adr/0010-envoi-essai-fonction-sql.md)).
- **Chaque essai reçu par la base prend un numéro d'ordre.** L'appareil et le Worker de sauvegarde demandent simplement « les numéros après le dernier vu ». Un verrou dans la fonction empêche tout essai sauté ([ADR 0011](../adr/0011-repere-numero-ordre-verrou.md)).
- **Pour les paramètres, la modification la plus récente gagne**, selon l'heure de l'appareil où elle a été faite ([ADR 0012](../adr/0012-conflits-parametres-heure-appareil.md)).

## Liste des diagrammes

| Diagramme | Flux | Cas d'utilisation | Exigences et règles |
|---|---|---|---|
| **SEQ01** : Ouverture de l'application | Démarrage hors ligne, essai interrompu, lancement de la synchronisation | CU06, CU17, CU18 | ENF02, RG24 |
| **SEQ02** : Essai Numbers | Lancer, pause, mémoriser, pause, restituer, corriger, enregistrer | CU01 à CU04 | EF08 à EF10, EF23, RG01, RG08 à RG12, RG21, RG25, ENF01, ENF08 |
| **SEQ03** : Abandon et interruption | Les trois choix, après un abandon ou une interruption | CU01, CU05, CU06 | EF11, RG23, RG24, RG25 |
| **SEQ04** : Connexion | Passkey, puis jeton de session | CU16 | ES01 à ES03 |
| **SEQ05** : Synchronisation | Envoi sans doublon, réception, paramètres | CU17 | EF21, RG22, ES04 à ES07 |
| **SEQ06** : Sauvegarde | Export quotidien et incrémental vers R2 | CU19 | ES17, ES18 |
| **SEQ07** : Déploiement | Pull request, tests, migrations, publication | — | ES09, ES11, ES14, ES19 |

## Décisions prises pour S5

| Décision | Choix du développeur | Où |
|---|---|---|
| **Envoi d'un essai** | Une fonction SQL en base enregistre l'essai et ses éléments en une transaction. | [ADR 0010](../adr/0010-envoi-essai-fonction-sql.md), SEQ05 |
| **Repère de réception** | Un numéro d'ordre donné par la base. Un verrou dans la fonction garantit que les numéros suivent l'ordre d'enregistrement. | [ADR 0011](../adr/0011-repere-numero-ordre-verrou.md), SEQ05, SEQ06 |
| **Conflit sur les paramètres** | L'heure de l'appareil où la modification a été faite. La plus récente gagne. | [ADR 0012](../adr/0012-conflits-parametres-heure-appareil.md), SEQ05 |
| **Enregistrement de l'essai en cours** | Toutes les N secondes, plus à chaque changement de phase. | SEQ02, SEQ03 |

## Valeurs retenues

> Décision : **N = 2 secondes** pour l'enregistrement de l'essai en cours. L'essai est aussi enregistré quand l'onglet passe en arrière-plan ou se ferme (événements `visibilitychange` et `pagehide`), ce qui réduit encore la perte en cas d'interruption.

> Décision : la synchronisation est relancée **toutes les 5 minutes** tant que l'application est ouverte. Avec une heure d'usage par jour, Neon reste éveillé environ 35 heures par mois, sous la limite de 100 heures ([S3](../contraintes-techniques.md)).

> Décision : la réception se fait par **pages de 50 essais**, et le Worker sauvegarde **au plus 500 essais** par exécution, pour rester sous les 10 ms de calcul. S'il en reste, la sauvegarde suivante continue.

> Décision : un essai **refusé par la base** (valeur hors bornes, ES07) est marqué « refusé » sur l'appareil, reste consultable, et est signalé au pratiquant. La file d'envoi continue avec les essais suivants, au lieu de rester bloquée. Ce cas révèle un défaut de l'application.

> Décision : les paramètres sont envoyés par la fonction SQL `save_settings`, qui ne remplace les valeurs que si la modification reçue est plus récente ([ADR 0018](../adr/0018-roles-et-regles-acces.md)).

> Décision : une nouvelle version de l'application **n'est jamais appliquée pendant un essai**. Comportement exact de la mise à jour fixé en Q3.

## Participants

| Participant | Ce que c'est |
|---|---|
| **Pratiquant** | Le seul utilisateur ([persona](../../01-besoin/persona.md)) |
| **Écran** | Couche Présentation : routes et composants Svelte |
| **Application** | Couche Application : cas d'usage (essai, abandon, synchronisation) |
| **Domaine** | Couche Domaine : formats, tirage, chronomètre, correction, score. Lit une horloge monotone (`performance.now()`) |
| **Dexie.js** | Base locale de l'appareil (IndexedDB), dont la file d'envoi |
| **Service worker** | Cache de l'application ([ADR 0008](../adr/0008-service-worker-vite-plugin-pwa.md)) |
| **Hanko** | Service de connexion par passkey ([ADR 0003](../adr/0003-connexion-hanko.md)) |
| **Data API** | Point d'entrée HTTP de Neon. Vérifie le jeton, puis transmet à PostgreSQL |
| **PostgreSQL** | Base de référence, avec ses règles d'accès RLS |
| **Worker** et **R2** | Sauvegarde planifiée et son stockage privé ([ADR 0009](../adr/0009-sauvegarde-cloudflare-worker-r2.md)) |

Les diagrammes montrent les échanges utiles à la compréhension. Les noms techniques exacts (tables, fonctions, colonnes) seront fixés au dictionnaire de données (S7) et au MPD (S10).

## 1. SEQ01 — Ouverture de l'application

```mermaid
sequenceDiagram
    actor P as Pratiquant
    participant SW as Service worker
    participant A as Application
    participant L as Dexie.js
    participant CF as Cloudflare Pages

    P->>SW: Ouvre l'application
    SW-->>P: Fichiers de l'application, depuis le cache (ENF02)
    opt Réseau disponible
        SW-)CF: Cherche une nouvelle version, en arrière-plan
    end
    A->>L: Ouvre la base locale
    opt Premier lancement de l'application installée
        A->>A: Demande un stockage persistant (S3)
    end
    opt iPhone ou iPad, application non installée
        A-->>P: Rappel - installer l'application (CU18)
    end
    A->>L: Cherche un essai « en cours »
    alt Essai trouvé
        A-->>P: Décision sur l'essai interrompu (SEQ03)
    else Aucun essai en cours
        A-->>P: Accueil
    end
    opt Réseau disponible
        A-)A: Lance la synchronisation (SEQ05)
    end
```

| Point clé | Détail |
|---|---|
| **Aucun réseau nécessaire** | L'application, les données et l'historique viennent de l'appareil. La connexion n'est demandée qu'au moment de synchroniser. |
| **Déclencheurs suivants de la synchronisation** | Retour du réseau, fin d'un essai, et toutes les 5 minutes tant que l'application est ouverte (CU17). |
| **Mise à jour** | Une nouvelle version téléchargée n'est pas appliquée pendant un essai (valeur retenue ci-dessus) : un encart la propose hors essai ([déploiement](../../06-qualite-deploiement/deploiement.md), section 5). |
| **Rappel d'installation** | Sur iPhone et iPad sans installation, à chaque ouverture ; « Plus tard » le ferme jusqu'à la prochaine (CU18). |

## 2. SEQ02 — Essai Numbers

Scénario nominal de CU01 à CU04. L'abandon (CU05) est dans SEQ03.

```mermaid
sequenceDiagram
    actor P as Pratiquant
    participant E as Écran
    participant A as Application
    participant D as Domaine
    participant L as Dexie.js

    Note over P,L: Lancement (CU01)
    P->>E: Choisit Numbers, le mode et la durée des deux pauses (RG25)
    E->>A: Lance l'essai
    A->>L: Garde les durées de pause choisies pour Numbers
    A->>D: Prépare l'essai (format RG01, RG02 ou RG15)
    D-->>A: Nouvelle suite de chiffres tirée au hasard (RG21)
    A->>E: Prépare l'affichage du premier groupe (ENF08)
    Note over E: Écran gardé allumé pendant l'essai (S3)

    Note over P,L: Pause avant la mémorisation (RG25)
    opt Durée supérieure à 0 s
        A-->>E: Compte à rebours seul, chiffres cachés
        alt Fin du compte à rebours
            A->>A: Fin de la pause détectée
        else Le pratiquant écourte
            P->>E: Écourte la pause
            E->>A: Fin de la pause
        end
    end

    Note over P,L: Mémorisation (CU02)
    A->>D: Démarre le chronomètre de mémorisation
    A->>L: Enregistre l'essai « en cours » (RG24)
    loop Navigation
        P->>E: Flèches, barre d'espace
        E->>A: Change de groupe (RG09)
        A-->>E: Groupe à afficher (motif RG11)
    end
    Note over A,L: Essai en cours enregistré toutes les 2 secondes
    alt Le pratiquant termine
        P->>E: Finished, Entrée, ou flèche droite deux fois à la fin
        E->>A: Fin de la mémorisation
    else Temps écoulé
        A->>A: Fin de la durée détectée (RG01)
    end
    A->>D: Arrête le chronomètre
    D-->>A: Temps de mémorisation à la ms (RG08, ENF01)
    A->>L: Enregistre l'essai en cours (changement de phase)

    Note over P,L: Pause avant le rappel (RG25)
    opt Durée supérieure à 0 s
        A-->>E: Compte à rebours seul, chiffres cachés
        alt Fin du compte à rebours
            A->>A: Fin de la pause détectée
        else Le pratiquant écourte
            P->>E: Écourte la pause
            E->>A: Fin de la pause
        end
    end

    Note over P,L: Rappel (CU03)
    A->>D: Démarre le chronomètre de rappel (4 minutes)
    par Saisie
        loop Chaque touche
            P->>E: Chiffre, retour arrière, plus ou moins
            E->>A: Modifie les réponses (RG10)
        end
    and Enregistrement régulier
        loop Toutes les 2 secondes
            A->>L: Enregistre les réponses saisies
        end
    end
    alt Le pratiquant valide
        P->>E: Finished
        E->>A: Fin du rappel
    else Temps écoulé
        A->>A: Fin des 4 minutes détectée
    end
    A->>D: Arrête le chronomètre et corrige (RG12)
    D-->>A: Résultat par élément, score, temps de rappel

    Note over P,L: Enregistrement et résultat (CU04)
    A->>L: Une transaction - essai « terminé » et ajout à la file d'envoi
    A-->>E: Résultat
    E-->>P: Score, temps au centième, attendus face aux réponses (RG19)
    A-)A: Lance la synchronisation (SEQ05)
```

| Point clé | Détail |
|---|---|
| **Tirage et affichage avant le chronomètre** | La suite est tirée et le premier groupe préparé **avant** la pause et le départ du chronomètre : le temps mesuré ne compte pas la préparation (ENF08). |
| **Pauses hors chronomètre** | Chaque chronomètre ne démarre qu'à la fin de la pause qui le précède. Les pauses ne comptent dans aucun temps et ne sont pas enregistrées avec l'essai (RG25). |
| **Chronomètre indépendant de l'affichage** | Le domaine lit l'horloge monotone. L'affichage du temps n'est qu'une lecture : un écran lent ne fausse pas la mesure (ENF01, R6). |
| **Essai en cours** | Enregistré au démarrage de la mémorisation (décision CU01), toutes les 2 secondes, à chaque changement de phase et quand l'onglet passe en arrière-plan. En cas d'interruption, on perd au plus 2 secondes de saisie. |
| **Fin de l'essai en une transaction** | Le passage à « terminé » et l'ajout à la file d'envoi sont écrits ensemble dans Dexie.js. Un essai terminé est donc toujours dans la file, jamais perdu (ENF07). |
| **Immuable dès la fin** | Après cette transaction, l'application ne propose plus aucune modification (RG18). |

## 3. SEQ03 — Abandon et interruption

### 3.1 Abandon volontaire (CU05)

```mermaid
sequenceDiagram
    actor P as Pratiquant
    participant E as Écran
    participant A as Application
    participant D as Domaine
    participant L as Dexie.js

    P->>E: Demande à abandonner
    E->>A: Abandonne l'essai
    alt Pendant la pause avant la mémorisation (RG25)
        A-->>E: Retour à l'accueil, rien n'est enregistré, aucune question
    else En mémorisation, en pause avant le rappel ou en rappel
        A->>D: Arrête les chronomètres
        A-->>E: Trois choix (RG23), sans retour possible à l'essai
        P->>E: Choisit
        alt Garder hors statistiques
            A->>L: Une transaction - essai « abandonné » et ajout à la file d'envoi
            A-->>E: Retour à l'accueil
        else Compter tel quel
            A->>D: Corrige avec les réponses déjà saisies (RG12)
            D-->>A: Résultat et score
            A->>L: Une transaction - essai « terminé » et ajout à la file d'envoi
            A-->>E: Résultat (CU04)
        else Ne pas garder
            A->>L: Efface l'essai en cours
            A-->>E: Retour à l'accueil
        end
    end
```

### 3.2 Essai interrompu (CU06)

Appelé depuis SEQ01, quand un essai « en cours » est trouvé à l'ouverture.

```mermaid
sequenceDiagram
    actor P as Pratiquant
    participant E as Écran
    participant A as Application
    participant D as Domaine
    participant L as Dexie.js

    A->>L: Passe l'essai au statut « Erreur externe à l'application » (RG24)
    A-->>E: Trois choix (RG23)
    P->>E: Choisit
    alt Garder hors statistiques
        A->>L: Ajoute l'essai à la file d'envoi, statut conservé
    else Compter tel quel
        A->>D: Corrige avec les réponses enregistrées avant l'interruption
        D-->>A: Résultat et score
        A->>L: Une transaction - essai « terminé » et ajout à la file d'envoi
        A-->>E: Résultat (CU04)
    else Ne pas garder
        A->>L: Efface l'essai
    end
```

| Point clé | Détail |
|---|---|
| **Jamais envoyé avant la décision** | Un essai en cours ou interrompu n'entre dans la file d'envoi qu'après le choix. « Ne pas garder » n'a donc jamais rien à supprimer côté serveur (ES05). |
| **Temps d'un essai interrompu** | Ceux du dernier enregistrement de l'essai en cours, soit au plus 2 secondes d'écart avec la réalité. |
| **Deux statuts distincts** | « Abandonné » pour un abandon volontaire, « Erreur externe à l'application » pour une interruption subie (décision CU06). |

## 4. SEQ04 — Connexion

```mermaid
sequenceDiagram
    actor P as Pratiquant
    participant A as Application
    participant AP as Appareil (Face ID, Touch ID, Windows Hello)
    participant H as Hanko

    Note over A: Premier lancement, ou session expirée au moment de synchroniser
    A->>H: Demande une connexion par passkey
    H-->>A: Défi à signer (WebAuthn)
    A->>AP: Demande la signature du défi
    AP->>P: Demande le déverrouillage
    P->>AP: Visage, empreinte ou code
    AP-->>A: Défi signé avec la passkey
    A->>H: Envoie le défi signé
    alt Signature valide
        H-->>A: Jeton de session (JWT), durée limitée (ES03)
        A-)A: Lance ou reprend la synchronisation (SEQ05)
    else Échec ou réseau perdu
        H-->>A: Erreur
        A-->>P: Message d'erreur, données locales intactes
    end
```

| Point clé | Détail |
|---|---|
| **La clé privée ne quitte jamais l'appareil** | Hanko ne reçoit qu'un défi signé. Rien ne peut être hameçonné (ES02). |
| **Nouvel appareil sans passkey** | La passkey est partagée par le gestionnaire de mots de passe du système, ou utilisée depuis un autre appareil en scannant un QR code (CU16). |
| **Après une longue pause** | La première requête réveille le projet Hanko : la connexion est un peu plus lente ([S3](../contraintes-techniques.md)). |
| **Stockage du jeton** | Fixé en SE6 (sécurisation du back et de l'authentification). |

## 5. SEQ05 — Synchronisation

```mermaid
sequenceDiagram
    participant A as Application
    participant L as Dexie.js
    participant API as Data API
    participant H as Hanko
    participant PG as PostgreSQL
    participant CF as Cloudflare Pages

    A->>CF: Lit version.json, sans cache
    alt Version publiée différente de celle de l'appareil
        A->>A: Relance le service worker, qui télécharge la nouvelle version
        A-->>A: Synchronisation en attente de mise à jour, fin
    end

    A->>A: Vérifie la session
    opt Session absente ou expirée
        A->>A: Connexion (SEQ04), puis reprise ici
    end

    Note over A,PG: 1. Envoi des essais de la file
    loop Chaque essai de la file, du plus ancien au plus récent
        A->>L: Lit l'essai et ses éléments
        A->>API: Appelle la fonction d'envoi, avec le JWT
        opt Clés publiques absentes du cache
            API->>H: Lit les clés publiques (JWKS)
        end
        API->>API: Vérifie le JWT
        API->>PG: Appelle la fonction, avec l'identité du jeton
        PG->>PG: Prend le verrou (ADR 0011)
        alt Identifiant déjà reçu
            PG-->>API: Rien n'est fait (RG22, ES06)
        else Nouvel essai
            PG->>PG: Contrôle les valeurs (ES07)
            PG->>PG: Insère l'essai avec son numéro d'ordre, puis ses éléments
            PG-->>API: Enregistré, une seule transaction
        end
        API-->>A: Succès
        A->>L: Retire l'essai de la file d'envoi
    end

    Note over A,PG: 2. Envoi des paramètres
    opt Paramètres modifiés depuis la dernière synchronisation
        A->>API: Envoie les paramètres et l'heure de leur modification
        API->>PG: Remplace seulement si cette heure est plus récente (ADR 0012)
    end

    Note over A,PG: 3. Réception
    loop Tant que la page reçue est pleine (50 essais)
        A->>L: Lit le repère (dernier numéro reçu)
        A->>API: Essais et éléments de numéro supérieur au repère, par ordre croissant
        API->>PG: Lecture filtrée par les règles RLS (ES04)
        PG-->>A: Une page d'essais
        A->>L: Une transaction - ajoute les essais inconnus, avance le repère
    end
    A->>API: Lit les paramètres
    API-->>A: Paramètres et heure de leur modification
    opt Plus récents que ceux de l'appareil
        A->>L: Remplace les paramètres locaux
    end
```

### Cas d'échec

| Cas | Ce qui se passe |
|---|---|
| **Version publiée illisible** | La synchronisation s'arrête avant tout envoi, et reprendra au prochain déclencheur : un essai n'est jamais envoyé sans savoir si l'appareil est à jour ([ADR 0023](../adr/0023-compatibilite-des-versions.md)). |
| **Appareil pas à jour** | Rien n'est envoyé ni reçu ; la pastille l'indique, l'encart propose la mise à jour ([déploiement](../../06-qualite-deploiement/deploiement.md), section 5). |
| **Réseau perdu en cours de route** | La synchronisation s'arrête. Les essais non confirmés restent dans la file : le prochain envoi les rejoue sans doublon. |
| **Jeton refusé** (session expirée entre-temps) | Connexion (SEQ04), puis reprise au début. |
| **Essai refusé par la base** (ES07) | L'essai est marqué « refusé » sur l'appareil, signalé, et la file continue (valeur retenue ci-dessus). |
| **Neon en veille** | La première requête le réveille : la synchronisation est un peu plus lente, sans action manuelle. |

### Points clés

| Point clé | Détail |
|---|---|
| **Tout ou rien** | La fonction enregistre l'essai et ses éléments dans une seule transaction : un autre appareil ne peut jamais recevoir un essai incomplet ([ADR 0010](../adr/0010-envoi-essai-fonction-sql.md)). |
| **Propriétaire imposé par la base** | La fonction s'exécute avec les droits de l'appelant, donc sous les règles RLS. Le propriétaire est l'identité du jeton, jamais une valeur envoyée par l'appareil. Seul l'identifiant du compte unique est accepté ([S3](../contraintes-techniques.md), ES01, ES04). |
| **Aucune modification possible** | La fonction ne fait qu'insérer. Un essai déjà reçu n'est jamais réécrit (RG18, ES05). |
| **Aucun essai sauté** | Grâce au verrou, les numéros d'ordre suivent l'ordre d'enregistrement. « Numéro supérieur au repère » ne peut donc rien oublier ([ADR 0011](../adr/0011-repere-numero-ordre-verrou.md)). |
| **Ses propres essais reviennent** | La réception renvoie aussi les essais envoyés par cet appareil. Ils sont reconnus par leur identifiant et ignorés. |
| **Dates d'origine conservées** | Les dates et les temps sont ceux de l'appareil, enregistrés tels quels. Le numéro d'ordre s'y ajoute, sans les remplacer (RG22). |
| **Une seule synchronisation à la fois** | Sur un appareil, une synchronisation déjà en cours n'est pas relancée par un autre déclencheur. |

## 6. SEQ06 — Sauvegarde

```mermaid
sequenceDiagram
    participant T as Planificateur Cloudflare
    participant W as Worker
    participant R as R2
    participant PG as PostgreSQL

    T->>W: Déclenche la sauvegarde, chaque jour à heure fixe
    W->>R: Lit le repère (dernier numéro sauvegardé)
    R-->>W: Repère
    W->>PG: Demande le document du jour, rôle en lecture seule
    PG->>PG: Construit le JSON : essais et éléments de numéro supérieur au repère (au plus 100), paramètres
    PG-->>W: Document JSON et dernier numéro
    W->>R: Écrit le fichier JSON daté, tel quel, dans l'espace privé
    W->>R: Écrit le nouveau repère
    alt Échec à une étape
        W->>W: S'arrête, repère inchangé
        Note over W: Échec visible dans le tableau de bord Cloudflare
    end
```

| Point clé | Détail |
|---|---|
| **Repère gardé dans R2** | Le Worker n'a qu'un accès en lecture à la base (ES11) : il garde donc son repère dans R2, à côté des sauvegardes. |
| **Fichier avant repère** | Le repère n'avance qu'après l'écriture du fichier. En cas d'échec, rien n'est perdu : la sauvegarde suivante reprend au dernier repère. |
| **Doublons possibles entre fichiers** | Si le fichier est écrit mais pas le repère, les mêmes essais seront dans deux fichiers. La restauration ignore les identifiants déjà vus (ES17). |
| **Instantané des paramètres** | Les paramètres sont recopiés chaque jour en entier. Les systèmes s'y ajouteront au lot 5. |
| **Document construit par la base** | Le Worker ne dispose que de 10 ms de calcul : il transmet le JSON sans le parcourir ([ADR 0032](../adr/0032-worker-de-sauvegarde.md)). |
| **Lignes brutes** | Chaque table telle quelle, numéro d'ordre compris : une restauration garde les numéros ([ADR 0011](../adr/0011-repere-numero-ordre-verrou.md)). |

## 7. SEQ07 — Déploiement

```mermaid
sequenceDiagram
    actor Dev as Développeur
    participant GH as GitHub (CI)
    participant N as Neon
    participant CF as Cloudflare Pages

    Dev->>GH: Ouvre une pull request release ou hotfix vers main
    GH->>GH: Lint, tests, audit des dépendances (ES14), scan des secrets (ES09)
    alt Contrôles en échec
        GH-->>Dev: Fusion bloquée
    else Contrôles réussis
        Dev->>GH: Fusionne dans main
        GH->>N: Sauvegarde juste avant la migration (ES19, méthode fixée en Q3)
        GH->>N: Applique les migrations, avec le rôle de migration (ES11)
        alt Migration en échec
            N-->>GH: Erreur
            GH-->>Dev: Publication annulée, base restaurable depuis la sauvegarde
        else Migration réussie
            GH->>CF: Publie le build
            CF-->>GH: Déployé
        end
    end
    Note over CF: Les appareils détectent la nouvelle version à leur ouverture (SEQ01)
```

| Point clé | Détail |
|---|---|
| **Migrations avant publication** | La base est prête avant que la nouvelle version de l'application ne l'utilise. |
| **Migrations uniquement par la CI** | Aucune migration manuelle en production (ES19). Chaque tâche n'a que le secret dont elle a besoin (ES11). |
| **Anciennes versions encore en service** | Un appareil resté hors ligne garde l'ancienne version et enverra ses essais plus tard. La base doit donc rester compatible avec la version précédente (voir points ouverts). |

## Points ouverts

| Point | Pourquoi | Quand |
|---|---|---|
| **Compatibilité de la fonction d'envoi avec les anciennes versions** | Un appareil resté longtemps hors ligne envoie ses essais avec l'ancienne version. La fonction doit continuer à les accepter, ou être versionnée. | Q3 |
| **Méthode de sauvegarde avant migration** | Branche Neon, export JSON vers R2, ou autre (ES19). | Q3 |
| **Accès du Worker aux tables protégées par RLS** | Le rôle en lecture seule doit lire les essais sans être le propriétaire connecté. | S11, SE4 |
| **Stockage du jeton de session** | Cookie ou stockage local, durée de session (ES03). | SE6 |
| **Prise en charge par la Data API** des appels de fonction et des lectures d'essais avec leurs éléments | Les deux sont utilisés dans SEQ05. | Sprint 0 |
