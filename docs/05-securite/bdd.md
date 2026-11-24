# SE4 — Sécurisation de la base de données

Amont : [MPD](../04-specifications/bdd/mpd.md), [accès aux données](../04-specifications/acces.md), [défense en profondeur](defense-en-profondeur.md), [surface d'attaque](surface-attaque.md), ADR [0009](../04-specifications/adr/0009-sauvegarde-cloudflare-worker-r2.md), [0017](../04-specifications/adr/0017-integrite-base-donnees.md) et [0018](../04-specifications/adr/0018-roles-et-regles-acces.md).

## En bref

- **Les règles d'accès et l'intégrité sont déjà décrites et testées** dans le [MPD](../04-specifications/bdd/mpd.md) et l'[accès aux données](../04-specifications/acces.md) : ce document les résume et y renvoie.
- **Trois sauvegardes indépendantes** : un export incrémental quotidien vers R2, lancé par une **tâche cron** (Cron Trigger de Cloudflare) ; un export complet avant chaque migration ; et toutes les données sur l'appareil.
- **Restauration testée à chaque lot**, dans une base locale. En production, elle passe par une tâche de la CI : le poste du développeur n'a aucun identifiant de production ([surface d'attaque](surface-attaque.md)).
- **Export complet** (ES18) : les fichiers JSON des sauvegardes, au format ouvert. Aucune fonctionnalité d'export ni d'import dans l'application.
- **Mots de passe** des deux rôles de la base : changés en cas de doute, selon une procédure écrite.

## Décisions prises

| Décision | Choix du développeur | Exigences |
|---|---|---|
| **Changement des mots de passe** | **En cas de doute seulement**, selon la procédure de la section 3 | ES09, ES11 |
| **Sauvegarde avant migration** | **Export complet** de la base (`pg_dump`) par la CI vers R2, juste avant la migration. Point ouvert de [séquences](../04-specifications/uml/sequences.md) fermé. | ES19 |
| **Export complet** | **Ce que prévoit la conception** : les fichiers JSON des sauvegardes R2 ([ADR 0009](../04-specifications/adr/0009-sauvegarde-cloudflare-worker-r2.md)). Rien n'est ajouté à l'application. | ES18 |

## 1. Accès

| Rôle | Peut | Ne peut pas | Détail |
|---|---|---|---|
| **anonymous** | Rien | Tout | [accès aux données](../04-specifications/acces.md) |
| **authenticated** (l'application) | Lire ses lignes ; insérer des essais ; appeler `submit_trial` et `save_settings` | Modifier ou supprimer un essai ; écrire directement les paramètres ; voir les lignes d'un autre compte | [accès aux données](../04-specifications/acces.md), sections 2 et 3 |
| **backup_reader** (Worker) | Tout lire, par ses propres règles RLS | Écrire, appeler une fonction | [ADR 0018](../04-specifications/adr/0018-roles-et-regles-acces.md) |
| **Rôle de migration** (CI) | Faire évoluer la structure | Modifier ou supprimer un essai : le déclencheur d'immuabilité le refuse aussi | [ADR 0017](../04-specifications/adr/0017-integrite-base-donnees.md) |

**Refus par défaut** : RLS est actif sur les 6 tables, les droits sont retirés à tous puis donnés un par un, et les fonctions ne sont exécutables par personne d'autre que `authenticated`. Les 31 cas de test sont dans [accès aux données](../04-specifications/acces.md#6-tests).

## 2. Intégrité

| Mécanisme                     | Ce qu'il garantit                                                                      | Détail                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Contraintes et types ENUM** | Chaque valeur est dans ses bornes (un chiffre de 0 à 9, une pause de 0, 5, 10 ou 20 s) | [Dictionnaire](../04-specifications/bdd/dictionnaire.md)                |
| **Contrôles différés**        | ƒUn essai est complet et cohérent : nombre d'éléments, sous-table, score, « juste »    | [MPD](../04-specifications/bdd/mpd.md), section 4                       |
| **Essais immuables**          | Aucun rôle ne peut modifier, supprimer ni vider un essai                               | [MPD](../04-specifications/bdd/mpd.md), section 5                       |
| **Compte unique**             | Toute autre identité est refusée par une clé étrangère                                 | [MPD](../04-specifications/bdd/mpd.md), section 6                       |
| **Verrou d'envoi**            | Aucun doublon, aucun essai sauté par la synchronisation                                | [ADR 0011](../04-specifications/adr/0011-repere-numero-ordre-verrou.md) |

## 3. Mots de passe, clés et secrets

| Secret                                     | Utilisé par | Rangé dans                                  | Accès donné                                                                                         |
| ------------------------------------------ | ----------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Mot de passe du rôle de migration**      | CI          | Secrets GitHub, environnement de production | Structure de la base                                                                                |
| **Mot de passe de** `backup_reader`        | Worker      | Secrets du Worker                           | Lecture de toutes les tables                                                                        |
| **Jeton d'écriture R2 du Worker**          | Worker      | Secrets du Worker                           | Écriture des sauvegardes quotidiennes                                                               |
| **Jeton d'écriture R2 de la CI**           | CI          | Secrets GitHub, environnement de production | Écriture des exports avant migration                                                                |
| **Identifiant du compte autorisé**         | CI          | Secrets GitHub                              | Création de la ligne `accounts` (pas un secret au sens strict, mais une donnée réelle hors du repo) |
| **Identifiants de la branche Neon de dev** | Développeur | `.env` local, ignoré par git                | Base de dev seulement                                                                               |

Les clés publiques de Hanko (JWKS) ne sont pas des secrets : la Data API les lit directement chez Hanko.

**Changer un mot de passe ou un jeton en cas de doute** (fuite possible, poste compromis, secret vu dans un journal) :

1. Créer le nouveau mot de passe ou le nouveau jeton dans la console du fournisseur (Neon ou Cloudflare).
2. Remplacer le secret là où il est rangé (GitHub ou Worker).
3. Révoquer l'ancien.
4. Vérifier : relancer la CI, ou attendre la sauvegarde suivante et contrôler qu'elle a réussi.

## 4. Chiffrement

| Où | Comment | Assuré par |
|---|---|---|
| **Entre l'application et la Data API** | HTTPS | Neon |
| **Entre la CI ou le Worker et PostgreSQL** | Connexion chiffrée obligatoire (TLS) | Neon, configuration des clients |
| **Base au repos** | Chiffrement des disques | Neon (à vérifier au sprint 0) |
| **Sauvegardes au repos** | Chiffrement des objets | Cloudflare R2 (à vérifier au sprint 0) |

Aucun chiffrement supplémentaire dans l'application : les données sont de faible sensibilité ([introduction](introduction.md), section 2).

## 5. Sauvegardes

| Sauvegarde | Quand | Contenu | Où | Conservée |
|---|---|---|---|---|
| **Export quotidien** | Chaque jour à heure fixe, par le Worker, lancé par une tâche cron | Les essais reçus depuis la veille (par numéro d'ordre, au plus 100) et les paramètres, en JSON : lignes brutes de chaque table ([ADR 0032](../04-specifications/adr/0032-worker-de-sauvegarde.md)) | R2, espace privé | Toujours : les exports étant incrémentaux, chaque fichier est nécessaire pour reconstruire la base |
| **Export avant migration** | Juste avant chaque migration en production, par la CI | Toute la base (`pg_dump`) | R2, espace privé | Toujours, comme les exports quotidiens |
| **Historique de Neon** | En continu | Toute la base | Neon | 6 heures (offre gratuite) |
| **Base de l'appareil** | En continu | Tous les essais et les paramètres | Chaque appareil (Dexie.js) | Tant que l'appareil garde ses données |

Volume : environ 50 Mo par an pour les exports quotidiens, très en dessous des 10 Go gratuits de R2 ([contraintes techniques](../04-specifications/contraintes-techniques.md)).

Décision : **pas de copie complète planifiée** en plus du cron quotidien. Une copie complète hebdomadaire ou mensuelle par un cron GitHub Actions a été envisagée : elle aurait simplifié la restauration, mais GitHub suspend les crons d'un repo resté 60 jours sans activité, et la CI aurait gardé un accès à la production en dehors des migrations.

## 6. Restauration

**Test à chaque lot** (ES17), sur le poste du développeur :

1. Télécharger depuis la console Cloudflare tous les fichiers de sauvegarde de R2.
2. Créer une base PostgreSQL locale avec le script `bdd/schema.sql`.
3. Rejouer les fichiers dans l'ordre : les lignes sont insérées telles quelles, **numéro d'ordre compris** ([ADR 0011](../04-specifications/adr/0011-repere-numero-ordre-verrou.md)), les essais déjà présents sont ignorés.
4. Comparer : nombre d'essais, dernier numéro d'ordre, quelques essais au hasard.

**Reprise en production** (perte ou corruption de la base) : une tâche de la CI, lancée à la main, restaure le dernier export avant migration, puis rejoue les exports quotidiens qui le suivent. Le poste du développeur n'a jamais d'accès direct à la production. Le détail de cette tâche est fixé avec le [déploiement](../06-qualite-deploiement/deploiement.md) et la [maintenance](../06-qualite-deploiement/maintenance.md).

> Décision (partie 6) : **moins de 6 heures** après l'incident, la reprise se fait par l'**historique de Neon**, depuis sa console, sans perte. La tâche de la CI sert au-delà ([maintenance](../06-qualite-deploiement/maintenance.md), section 3).

## 7. Export complet (ES18)

L'export complet, ce sont **les fichiers JSON de R2** : un format ouvert, lisible par n'importe quel outil. Ils se téléchargent depuis la console Cloudflare et peuvent avoir jusqu'à un jour de retard sur la base. La vérification de ES18, « export puis réimport dans une base locale », est faite par le test de restauration de la section 6.

## 8. Tests automatiques de la base

À reprendre dans la CI ([stratégie de tests](../06-qualite-deploiement/tests.md)) à partir des tests déjà menés dans le [modèle physique](../04-specifications/bdd/mpd.md) et l'[accès aux données](../04-specifications/acces.md) :

| Ce qui est testé | Origine |
|---|---|
| Les 14 cas d'intégrité : essai incomplet, score faux, chiffre hors bornes, modification, suppression, vidage… | [MPD](../04-specifications/bdd/mpd.md), section 8 |
| Les 17 cas d'accès : isolement entre comptes, `anonymous`, `backup_reader`, écritures directes | [accès aux données](../04-specifications/acces.md), section 6 |
| Aucune table sans RLS, aucune fonction exécutable par tous | [accès aux données](../04-specifications/acces.md) ; ES04 |
| Chaque table est lisible par `backup_reader` | [ADR 0018](../04-specifications/adr/0018-roles-et-regles-acces.md) |

## Points ouverts

| Point | Pourquoi | Quand |
|---|---|---|
| **Chiffrement au repos de Neon et de R2** | À confirmer dans la documentation des fournisseurs. | Sprint 0 |
| ~~**Tâche de reprise en production**~~ | Fixée : lancée à la main, rôle de migration, rejeu dans l'ordre ([maintenance](../06-qualite-deploiement/maintenance.md), section 3). | Fait |
