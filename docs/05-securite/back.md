# SE6 — Sécurisation du back et de l'authentification

Amont : [surface d'attaque](surface-attaque.md), [base de données](bdd.md), [front](front.md), [exigences de sécurité](../03-analyse-securite/exigences-securite.md) (ES01 à ES03, ES09 à ES11, ES19), [séquences](../04-specifications/uml/sequences.md) (SEQ04 à SEQ07), [ADR 0003](../04-specifications/adr/0003-connexion-hanko.md).

## En bref

- **Il n'y a pas de serveur maison** : le « back », c'est la configuration de Hanko, la Data API et les fonctions de Neon, le Worker de sauvegarde et la CI.
- **Connexion par passkey seule**, inscription fermée, **sessions de 12 heures**, révocables depuis n'importe quel appareil (ES01 à ES03).
- **Le jeton de session** est un JWT signé par Hanko, gardé dans un **cookie sécurisé**, et vérifié par la Data API à chaque requête.
- **La CI et le Worker n'ont que les secrets et les droits** dont chaque tâche a besoin (ES11).
- **Alertes par e-mail** des fournisseurs : échec de la sauvegarde, échec de la CI, quotas qui approchent.

## Décisions prises pour SE6 (2026-11-21)

| Décision | Choix du développeur | Exigences |
|---|---|---|
| **Durée de session** | **12 heures** (défaut de Hanko). Hors ligne, l'application reste utilisable ; seule la synchronisation attend la prochaine connexion. Point ouvert de S3 fermé. | ES03 |
| **Stockage du jeton** | **Cookie sécurisé** : HTTPS seulement, jamais envoyé à un autre site, gardé après fermeture de l'application. Point ouvert de S5 fermé. | ES03, ES13 |
| **Alertes** | **E-mails automatiques** des fournisseurs (section 7) | ES16, ES17 |

## 1. Connexion (Hanko)

| Réglage | Valeur | Exigences |
|---|---|---|
| **Inscription** | Fermée : le compte unique est créé à la main dans la console | ES01 |
| **Méthodes de connexion** | Passkey seule ; mot de passe et code par e-mail désactivés ([SE3](surface-attaque.md)) | ES02 |
| **Durée de session** | 12 heures | ES03 |
| **Révocation** | « Déconnecter toutes les sessions » depuis n'importe quel appareil, ou depuis la console Hanko | ES03 |
| **Origines autorisées** | L'adresse de l'application seulement (sous-domaine `pages.dev`) : une passkey ne fonctionne que sur ce site | ES02 |
| **Perte de toutes les passkeys** | Recréer l'accès depuis la console Hanko ([SE3](surface-attaque.md)) | ES02 |

Même si l'inscription s'ouvrait par erreur, un compte inconnu ne pourrait ni lire ni écrire : la base n'accepte que le compte autorisé ([SE2](defense-en-profondeur.md)).

## 2. Jeton de session

| Propriété | Valeur | Pourquoi |
|---|---|---|
| **Format** | JWT signé par Hanko ; l'identité du compte est dans le champ `sub` | Vérifiable par la Data API sans appeler Hanko à chaque requête |
| **Rangé dans** | Un cookie sécurisé (`Secure`, `SameSite=Strict`) | Survit à la fermeture de l'application, jamais envoyé à un autre site |
| **Envoyé** | Dans l'en-tête `Authorization` de chaque requête à la Data API | La Data API ne lit pas les cookies du site |
| **Expiré** | La Data API répond « non autorisé » ; l'application propose la connexion, puis reprend la synchronisation (SEQ04, SEQ05) | Aucune donnée perdue : les essais attendent dans la file d'envoi |

Le cookie est créé par le code de la page : il n'est pas protégé contre une injection de script. Le risque est faible, car aucun texte n'est inséré comme du HTML et la CSP n'autorise que les scripts de l'application ([SE5](front.md)).

## 3. Vérification du jeton par la Data API

| Contrôle | Comment |
|---|---|
| **Signature** | Avec les clés publiques de Hanko (JWKS), mises en cache par la Data API |
| **Expiration** | Un jeton expiré est refusé |
| **Émetteur** | Seuls les jetons émis par le projet Hanko de l'application sont acceptés |
| **Sans jeton** | Rôle `anonymous`, aucun droit ([S11](../04-specifications/acces.md)) |
| **Identité** | `auth.user_id()` lit le champ `sub` ; la base n'accepte que le compte autorisé |

## 4. Fonctions de la base

| Mesure | `submit_trial` | `save_settings` |
|---|---|---|
| **Droits d'exécution** | Les droits de l'appelant, sous RLS | Les droits du propriétaire des tables, filtrés sur `auth.user_id()` |
| **Chemin de recherche** | Fixé (`public, pg_temp`) | Fixé (`public, pg_temp`) : aucun objet piégé ne peut être appelé à sa place |
| **Entrées** | Chaque valeur est convertie dans son type ; contraintes et contrôles différés refusent le reste | Valeurs converties ; contraintes de la table |
| **Erreurs** | Messages sans donnée personnelle (identifiant de l'essai et règle en cause) | Idem |

Détail : [MPD](../04-specifications/bdd/mpd.md), sections 4 à 6, et [ADR 0018](../04-specifications/adr/0018-roles-et-regles-acces.md).

## 5. Worker de sauvegarde

| Mesure | Comment | Exigences |
|---|---|---|
| **Déclenchement** | Tâche cron seulement ; aucune route web, sous-domaine `workers.dev` désactivé | [SE3](surface-attaque.md) |
| **Droits** | Lecture seule sur la base (`backup_reader`) ; écriture dans R2 seulement | ES11 |
| **Secrets** | Mot de passe de `backup_reader` et jeton R2, dans les secrets du Worker | ES09 |
| **Fiabilité** | Le repère n'avance qu'après l'écriture du fichier : un échec ne perd rien ([SEQ06](../04-specifications/uml/sequences.md)) | ES17 |
| **Journaux** | Aucun contenu de la base n'est écrit dans les journaux du Worker, seulement le nombre d'essais exportés et les erreurs | ES10 |

## 6. CI (GitHub Actions)

| Mesure | Comment | Exigences |
|---|---|---|
| **Fusion vers `main`** | Pull request obligatoire, CI verte exigée (lint, tests, audit, scan des secrets) | ES14, P7 |
| **Environnement de production** | Les secrets de production (migration, R2, compte autorisé, déploiement) sont rangés dans un environnement réservé à la branche `main` | ES11 |
| **Droits du jeton** | Lecture seule par défaut, élargis tâche par tâche | ES11 |
| **Actions tierces** | Épinglées sur une version précise ([SE3](surface-attaque.md)) | ES14 |
| **Ordre de mise en production** | Export complet vers R2, puis migrations, puis publication ; arrêt au premier échec ([SEQ07](../04-specifications/uml/sequences.md)) | ES19 |
| **Pull requests de copies du repo** | Aucun secret | ES09 |

## 7. Journalisation et alertes

| Événement | Prévenu par | Fournisseur |
|---|---|---|
| **Sauvegarde en échec** | E-mail de notification sur les erreurs du Worker | Cloudflare |
| **CI en échec** (tests, migration, publication) | E-mail de notification des Actions | GitHub |
| **Quota qui approche** | Alertes de consommation | Neon, Cloudflare |
| **Secret poussé par erreur** | Blocage du push, et alerte de détection des secrets | GitHub |
| **Vulnérabilité dans une dépendance** | Alerte de sécurité des dépendances | GitHub |

L'application n'envoie **aucun journal ni aucune mesure d'usage** (ES15) : les erreurs côté appareil restent sur l'appareil. Le test de restauration de chaque lot confirme aussi que les sauvegardes fonctionnent ([SE4](bdd.md)).

## 8. Que faire en cas d'incident

| Incident | Que faire |
|---|---|
| **Appareil perdu ou session suspecte** | Déconnecter toutes les sessions depuis un autre appareil ou depuis la console Hanko ; retirer la passkey de l'appareil perdu |
| **Secret qui a pu fuiter** | Procédure de [SE4](bdd.md), section 3 : nouveau secret, remplacement, révocation, vérification |
| **Sauvegarde en échec** | Lire l'erreur dans la console Cloudflare, corriger ; la sauvegarde suivante reprend au dernier repère, sans perte |
| **Migration en échec** | La publication est annulée ; restaurer si besoin depuis l'export pris juste avant ([SE4](bdd.md)) |
| **Compte d'un fournisseur pris** | Reprendre le compte, changer tous les secrets qu'il détient, vérifier les sauvegardes et la dernière version publiée |

## Points ouverts

| Point | Pourquoi | Quand |
|---|---|---|
| **Fermeture de l'inscription, révocation et durée de session chez Hanko** | Déjà relevés en S3 : à confirmer dans la console. | Sprint 0 |
| **Contrôle de l'émetteur par la Data API** | Configuration générique des clés de Hanko chez Neon ([S3](../04-specifications/contraintes-techniques.md)). | Sprint 0 |
| **Notifications d'erreur des Workers** dans l'offre gratuite de Cloudflare | Si elles n'existent pas, le Worker enverra lui-même l'alerte, ou la vérification se fera à la main. | Sprint 0 |
