# S6 — Diagramme de classes

Amont : [architecture](../architecture.md), [séquences](sequences.md), [cas d'utilisation](cas-utilisation.md), [règles de gestion](../../01-besoin/regles-de-gestion.md), [conventions](../../02-projet/conventions.md).

## En bref

- **Le diagramme modélise le code du lot 1**, pas la base de données (le MCD viendra en S8). Seule la discipline Numbers est détaillée.
- **Le métier est écrit en classes**, et un essai est une **machine à états** : chaque phase a sa propre classe, qui n'offre que les actions permises. Démarrer le rappel avant la fin de la pause ne peut donc pas s'écrire : le code ne compile pas.
- **Une interface `Discipline`** regroupe ce qui change d'une discipline à l'autre (tirage, saisie, correction). Numbers en est la première implémentation, les autres disciplines s'y ajouteront aux lots 2 et 3.
- **La couche Application ne connaît que des interfaces** (dépôt d'essais, serveur, session, horloges). Dexie.js, la Data API et Hanko les implémentent dans l'Infrastructure. Les tests utilisent de fausses implémentations en mémoire.
- Ces quatre choix sont tracés dans l'[ADR 0013](../adr/0013-organisation-code-metier.md).
- **Les diagrammes sont en anglais** : ce sont les noms du code (P7). Les explications restent en français.

Notation : `[1]` un seul, `[0..1]` zéro ou un, `[0..*]` zéro ou plusieurs, `[1..*]` au moins un. Losange plein : composition (la partie n'existe pas sans le tout). Losange vide : agrégation. Triangle vide : héritage (trait plein) ou implémentation d'une interface (pointillés).

## 1. Diagramme de classes du métier

```mermaid
classDiagram
    direction TB

    class Trial {
        <<abstract>>
        +id [1] : TrialId
        +discipline [1] : DisciplineName
        +mode [1] : Mode
        +items [1..*] : Item
        +startedAt [1] : Date
    }
    class PausedBeforeMemorization {
        +startMemorization()
    }
    class OngoingTrial {
        <<abstract>>
        +snapshot()
        +abandon()
    }
    class MemorizingTrial {
        +finishMemorization()
    }
    class PausedBeforeRecall {
        +memorizationMs [1] : number
        +startRecall()
    }
    class RecallingTrial {
        +memorizationMs [1] : number
        +finishRecall()
    }
    class PendingDecision {
        +reason [1] : DecisionReason
        +answers [0..*] : Answer
        +memorizationMs [1] : number
        +recallMs [1] : number
        +countAsIs()
        +keepOutOfStats()
        +fromSnapshot()$
    }
    class ClosedTrial {
        <<abstract>>
        +status [1] : TrialStatus
        +answers [0..*] : Answer
        +memorizationMs [1] : number
        +recallMs [1] : number
    }
    class CompletedTrial {
        +score [1] : number
        +isBetterThan()
    }
    class ExcludedTrial
    class ItemResult {
        +position [1] : number
        +expected [1] : Item
        +answer [0..1] : Answer
        +correct [1] : boolean
    }
    class TrialSnapshot {
        +phase [1] : OngoingPhase
        +answers [0..*] : Answer
        +memorizationMs [0..1] : number
        +recallElapsedMs [0..1] : number
        +savedAt [1] : Date
    }
    class Format {
        +itemCount [1] : number
        +memorizationMs [1] : number
        +recallMs [1] : number
        +custom()$
    }
    class PreparationPauses {
        +beforeMemorization [1] : PauseDuration
        +beforeRecall [1] : PauseDuration
    }
    class Discipline {
        <<interface>>
        +name [1] : DisciplineName
        +standardFormat()
        +draw()
        +createRecall()
        +score()
    }
    class NumbersDiscipline {
        +standardFormat()
        +draw()
        +createRecall()
        +score()
    }
    class RecallInput {
        <<interface>>
        +answers()
    }
    class SequenceRecall {
        -cells [0..*] : Answer
        +type()
        +backspace()
        +insert()
        +remove()
        +answers()
    }
    class GroupNavigation {
        -position [1] : number
        +groupSize [1] : number
        +next()
        +previous()
        +toStart()
        +currentGroup()
    }
    class Stopwatch {
        +start()
        +stop()
        +elapsedMs()
    }
    class Countdown {
        +durationMs [1] : number
        +remainingMs()
        +isOver()
    }
    class Settings {
        +interfaceLanguage [1] : Language
        +groupSizes [1..*] : number
        +modifiedAt [1] : Date
        +withLanguage()
        +withGroupSize()
        +withPauses()
        +isNewerThan()
    }

    Trial <|-- PausedBeforeMemorization
    Trial <|-- OngoingTrial
    Trial <|-- PendingDecision
    Trial <|-- ClosedTrial
    OngoingTrial <|-- MemorizingTrial
    OngoingTrial <|-- PausedBeforeRecall
    OngoingTrial <|-- RecallingTrial
    ClosedTrial <|-- CompletedTrial
    ClosedTrial <|-- ExcludedTrial

    Trial "0..*" --> "1" Discipline : follows rules of
    Trial "1" *-- "1" Format : has format
    Trial "1" *-- "1" PreparationPauses : plans
    PausedBeforeMemorization "1" *-- "1" Countdown : counts down with
    PausedBeforeRecall "1" *-- "1" Countdown : counts down with
    MemorizingTrial "1" *-- "1" Stopwatch : times with
    MemorizingTrial "1" *-- "1" GroupNavigation : navigates with
    RecallingTrial "1" *-- "1" Stopwatch : times with
    RecallingTrial "1" *-- "1" RecallInput : records answers in
    OngoingTrial ..> TrialSnapshot : produces
    PendingDecision ..> TrialSnapshot : rebuilt from
    CompletedTrial "1" *-- "1..*" ItemResult : details
    Discipline <|.. NumbersDiscipline
    RecallInput <|.. SequenceRecall
    NumbersDiscipline ..> SequenceRecall : creates
    Settings "1" o-- "0..*" PreparationPauses : keeps last per discipline
```

| Classe | Rôle | Règles |
|---|---|---|
| **Trial** | Ce que toutes les phases partagent : identifiant créé sur l'appareil, discipline, mode, éléments tirés, date de début | RG19, RG21, RG22 |
| **PausedBeforeMemorization** | Compte à rebours avant la mémorisation, éléments cachés | RG25 |
| **OngoingTrial** | Phases qu'on peut abandonner ou interrompre. `snapshot()` produit l'enregistrement fait toutes les 2 s (SEQ02) | RG23, RG24 |
| **MemorizingTrial** | Chronomètre et navigation par groupes. `finishMemorization()` plafonne le temps à la durée du format | RG01, RG08, RG09, RG11 |
| **PausedBeforeRecall** | Compte à rebours avant le rappel. Le temps de mémorisation est figé | RG25 |
| **RecallingTrial** | Chronomètre de rappel et saisie. `finishRecall()` fait corriger l'essai par la discipline | RG10, RG12 |
| **PendingDecision** | Attente des trois choix, après un abandon ou une interruption. `fromSnapshot()` reconstruit un essai interrompu | RG23, RG24 |
| **ClosedTrial** | Essai clos, sans aucune méthode de modification | RG18 |
| **CompletedTrial** | Essai compté. `isBetterThan()` compare d'abord le score, puis le temps de mémorisation | RG12, RG13 |
| **ExcludedTrial** | Essai hors statistiques : statut « abandonné » ou « Erreur externe à l'application » | RG23, RG24 |
| **ItemResult** | Un élément attendu face à la réponse donnée | RG12, RG19 |
| **TrialSnapshot** | Valeur simple enregistrée dans Dexie.js pendant l'essai | RG24 |
| **Format** | Nombre d'éléments et durées. `custom()` garde 4 minutes de rappel | RG01, RG15 |
| **PreparationPauses** | Les deux pauses : 0, 5, 10 ou 20 s | RG25 |
| **Discipline** | Ce qui change d'une discipline à l'autre : format standard, tirage, saisie, correction | EF01 à EF06 |
| **NumbersDiscipline** | 80 chiffres de 0 à 9 tirés au hasard, 1 point par chiffre juste à la bonne position | RG02, RG12, RG21 |
| **SequenceRecall** | Taper, effacer à gauche, insérer une case (+), supprimer une case (−). Resservira pour Cards, Images et Words | RG10 |
| **GroupNavigation** | Position dans les groupes. `next()` signale la fin quand → est pressé deux fois rapidement sur le dernier groupe | RG09, RG11 |
| **Stopwatch**, **Countdown** | Chronomètre et compte à rebours, sur l'horloge monotone (section 3) | ENF01, RG25 |
| **Settings** | Langue, tailles de groupes et dernières pauses par discipline. Chaque modification renvoie de nouveaux paramètres, datés par l'appareil | EF20, RG11, RG25, [ADR 0012](../adr/0012-conflits-parametres-heure-appareil.md) |

`finishMemorization()` et `finishRecall()` sont appelées de deux façons : par le pratiquant (Finished, Entrée), ou par l'application quand le temps du format est écoulé.

Chaque méthode de passage (`startMemorization()`, `finishMemorization()`, `startRecall()`, `finishRecall()`, `abandon()`, `countAsIs()`, `keepOutOfStats()`) renvoie un **nouvel objet**, de la classe de la phase suivante. L'enchaînement complet des phases est décrit dans [SEQ02 et SEQ03](sequences.md).

| Point clé | Détail |
|---|---|
| **Pause de 0 s** | La phase de pause existe quand même, avec un compte à rebours de 0 s : l'application passe aussitôt à la suivante. Un seul chemin à tester. |
| **Abandon pendant la première pause** | `PausedBeforeMemorization` n'a pas de méthode `abandon()` : l'application abandonne l'objet, rien n'est enregistré (RG25). |
| **Interruption** (RG24) | À la réouverture, l'essai est reconstruit depuis son dernier `TrialSnapshot`, directement en `PendingDecision`, avec le motif « interruption ». |
| **Essais clos** | `CompletedTrial` et `ExcludedTrial` n'ont aucune méthode de modification (RG18). Ce sont les seuls essais envoyés à Neon. |
| **Ne pas garder** | Aucun objet n'est créé : l'application efface l'essai en cours de l'appareil (RG23). |

## 2. Couche Application

```mermaid
classDiagram
    direction LR

    class TrialSession {
        +current [0..1] : Trial
        +start()
        +skipPause()
        +finishMemorization()
        +finishRecall()
        +abandon()
        +decide()
    }
    class InterruptedTrialRecovery {
        +check()
        +decide()
    }
    class HistoryQuery {
        +list()
        +get()
    }
    class SettingsService {
        +load()
        +update()
    }
    class SyncService {
        -running [1] : boolean
        +sync()
        +startTriggers()
    }
    class TrialRepository {
        <<interface>>
        +saveSnapshot()
        +loadSnapshot()
        +deleteSnapshot()
        +close()
        +list()
        +get()
        +addReceived()
        +readCursor()
    }
    class Outbox {
        <<interface>>
        +pending()
        +remove()
        +markRejected()
    }
    class SettingsRepository {
        <<interface>>
        +load()
        +save()
        +isDirty()
        +markSynced()
    }
    class RemoteStore {
        <<interface>>
        +sendTrial()
        +sendSettings()
        +fetchTrials()
        +fetchSettings()
    }
    class AuthSession {
        <<interface>>
        +isValid()
        +token()
        +signIn()
    }
    class Scheduler {
        <<interface>>
        +every()
        +after()
    }

    TrialSession "1" --> "1" TrialRepository : saves to
    TrialSession "1" --> "1" Scheduler : paced by
    TrialSession ..> SyncService : triggers
    InterruptedTrialRecovery "1" --> "1" TrialRepository : reads
    HistoryQuery "1" --> "1" TrialRepository : reads
    SettingsService "1" --> "1" SettingsRepository : updates
    SyncService "1" --> "1" Outbox : empties
    SyncService "1" --> "1" TrialRepository : adds received trials to
    SyncService "1" --> "1" SettingsRepository : syncs
    SyncService "1" --> "1" RemoteStore : exchanges with
    SyncService "1" --> "1" AuthSession : authenticates through
    SyncService "1" --> "1" Scheduler : retriggered by
```

| Classe | Rôle | Cas d'utilisation | Séquence |
|---|---|---|---|
| **TrialSession** | Enchaîne les phases d'un essai, lance les comptes à rebours et l'enregistrement toutes les 2 s, clôt l'essai | CU01 à CU05 | SEQ02, SEQ03 |
| **InterruptedTrialRecovery** | À l'ouverture, cherche un essai en cours et propose les trois choix | CU06 | SEQ01, SEQ03 |
| **HistoryQuery** | Liste et détail des essais, lus sur l'appareil | CU04, CU07 | — |
| **SettingsService** | Lit et modifie les paramètres, les marque à envoyer | CU15 | — |
| **SyncService** | Envoi, réception, paramètres. Une seule synchronisation à la fois. Déclencheurs : retour du réseau, fin d'essai, toutes les 5 minutes | CU16, CU17 | SEQ04, SEQ05 |
| **TrialRepository** | Essai en cours, essais clos, repère de réception. `close()` écrit l'essai et l'ajoute à la file d'envoi **en une transaction** | — | SEQ02 |
| **Outbox** | File d'envoi : essais à envoyer, retrait après confirmation, marque « refusé » | — | SEQ05 |
| **SettingsRepository** | Paramètres de l'appareil et indicateur « à envoyer » | — | SEQ05 |
| **RemoteStore** | Ce que l'application attend du serveur, sans savoir que c'est Neon | — | SEQ05 |
| **AuthSession** | Session et jeton, sans savoir que c'est Hanko | — | SEQ04 |
| **Scheduler** | Comptes à rebours, enregistrement régulier, relance de la synchronisation. Simulable dans les tests | — | SEQ02, SEQ05 |

## 3. Couche Infrastructure

Chaque interface est implémentée par un adaptateur. Les interfaces de la section 2 sont rappelées sans leur contenu.

```mermaid
classDiagram
    direction LR

    class TrialRepository {
        <<interface>>
    }
    class Outbox {
        <<interface>>
    }
    class SettingsRepository {
        <<interface>>
    }
    class RemoteStore {
        <<interface>>
    }
    class AuthSession {
        <<interface>>
    }
    class Scheduler {
        <<interface>>
    }
    class MonotonicClock {
        <<interface>>
        +nowMs()
    }
    class WallClock {
        <<interface>>
        +now()
    }
    class RandomSource {
        <<interface>>
        +nextInt()
    }
    class IdGenerator {
        <<interface>>
        +next()
    }
    class DexieDatabase {
        +schemaVersion [1] : number
        +transaction()
    }
    class DexieTrialStore
    class DexieSettingsStore
    class TrialMapper {
        +toRecord()
        +fromRecord()
        +toApiPayload()
        +fromApi()
    }
    class DataApiClient
    class HankoSession
    class BrowserMonotonicClock
    class BrowserWallClock
    class CryptoRandomSource
    class CryptoIdGenerator
    class BrowserScheduler
    class AppContainer {
        +build()
    }

    TrialRepository <|.. DexieTrialStore
    Outbox <|.. DexieTrialStore
    SettingsRepository <|.. DexieSettingsStore
    RemoteStore <|.. DataApiClient
    AuthSession <|.. HankoSession
    Scheduler <|.. BrowserScheduler
    MonotonicClock <|.. BrowserMonotonicClock
    WallClock <|.. BrowserWallClock
    RandomSource <|.. CryptoRandomSource
    IdGenerator <|.. CryptoIdGenerator
    DexieTrialStore "1" --> "1" DexieDatabase : writes to
    DexieSettingsStore "1" --> "1" DexieDatabase : writes to
    DexieTrialStore "1" --> "1" TrialMapper : converts with
    DataApiClient "1" --> "1" TrialMapper : converts with
    DataApiClient "1" --> "1" AuthSession : gets token from
    AppContainer ..> DexieTrialStore : creates
    AppContainer ..> DataApiClient : creates
    AppContainer ..> HankoSession : creates
```

| Classe | Rôle | Technologie |
|---|---|---|
| **DexieTrialStore** | Implémente `TrialRepository` et `Outbox` dans une seule classe, pour que la clôture d'un essai et son ajout à la file soient dans la même transaction | Dexie.js |
| **DexieSettingsStore** | Implémente `SettingsRepository` | Dexie.js |
| **TrialMapper** | Convertit les objets du métier en enregistrements Dexie.js et en données JSON pour la Data API, et inversement | — |
| **DataApiClient** | Appelle la fonction d'envoi ([ADR 0010](../adr/0010-envoi-essai-fonction-sql.md)) et lit les essais par numéro d'ordre ([ADR 0011](../adr/0011-repere-numero-ordre-verrou.md)), avec le jeton de la session | `fetch`, Data API Neon |
| **HankoSession** | Implémente `AuthSession` | SDK Hanko |
| **MonotonicClock** et **WallClock** | La monotone mesure les durées, insensible aux changements d'heure. La murale date les essais et les paramètres | `performance.now()`, `Date` |
| **RandomSource**, **IdGenerator** | Hasard du tirage et identifiants créés sur l'appareil | `crypto.getRandomValues()`, `crypto.randomUUID()` |
| **BrowserScheduler** | Implémente `Scheduler` | `setTimeout`, `setInterval` |
| **AppContainer** | Crée tous les objets au démarrage et les relie : c'est le seul endroit qui connaît les classes concrètes | — |

Le **Worker de sauvegarde** (SEQ06) est un programme à part, d'une seule fonction : il n'est pas modélisé ici.

## 4. Tests

| Couche | Ce qui est testé | Avec quoi |
|---|---|---|
| **Métier** | Chaque transition de la machine à états, la correction, le score, la saisie, la navigation, les paramètres | Fausses horloges et faux hasard : tests rapides et reproductibles, terrain du TDD (O3, choix en Q1) |
| **Application** | Les cas d'usage de bout en bout : essai, abandon, interruption, synchronisation | Fausses implémentations en mémoire des interfaces |
| **Infrastructure** | `TrialMapper` (aller-retour sans perte), les transactions Dexie.js, `DataApiClient` face à une base de test | Base Neon de dev (S2, section 7) |

## Hypothèses à valider

> Hypothèse à valider : « → deux fois **rapidement** » (RG09) = deux appuis à moins de **400 ms** d'écart. La valeur exacte de Memory League n'est pas connue. Elle est réglable dans le code.

## Points ouverts

| Point | Pourquoi | Quand |
|---|---|---|
| **Lien entre les cas d'usage et l'affichage Svelte** | Les cas d'usage ont un état qui change (essai en cours, synchronisation). L'écran doit le suivre : runes Svelte dans la couche Application, ou abonnement à des événements. | Sprint 0 |
| **Interface `Discipline` face aux disciplines du lot 2** | Cards et Images se saisissent en plaçant des éléments, pas en tapant : `RecallInput` sera peut-être à enrichir. | Avant le lot 2 |
| **Types exacts** (`Item`, `Answer`, `TrialId`, `TrialStatus`, `OngoingPhase`) | Fixés avec le dictionnaire de données. | S7 |
