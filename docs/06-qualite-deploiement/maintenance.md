# Q5 — Maintenance

Amont : [sécurité de la base](../05-securite/bdd.md) (sauvegardes, restauration), [sécurité du back](../05-securite/back.md) (alertes, incidents), [surface d'attaque](../05-securite/surface-attaque.md), [déploiement](deploiement.md), [risques](../02-projet/risques.md) (R1, R4, R5), [contraintes techniques](../04-specifications/contraintes-techniques.md).

Version initiale, rédigée avant le développement. Elle sera **finalisée en production** (jalon J11).

## En bref

- **Dépendances npm et actions GitHub tenues à jour par Dependabot**, par des pull requests relues avant fusion. Les trois exécutables épinglés (dbmate, gitleaks, `pg_dump`) sont mis à jour à la main, à chaque lot.
- **Sauvegarde quotidienne** et automatique (ES17), plus un export complet avant chaque migration. Restauration testée à chaque lot.
- **Reprise de la base en production** : moins de 6 heures après l'incident, par l'historique de Neon ; au-delà, par une tâche de la CI lancée à la main, avec le rôle de migration.
- **Reprise après une longue pause** (R1) : une courte liste de vérifications, sans rien à réparer, puisque les services se réveillent seuls.

## Décisions prises

| Décision | Choix du développeur | Où |
|---|---|---|
| **Mise à jour des dépendances** | Dependabot | Section 1 |
| **Rôle de la tâche de reprise** | Rôle de migration | Section 3 |
| **Reprise sous 6 heures** | Par l'historique de Neon, depuis sa console ; ajoutée à la [sécurité de la base](../05-securite/bdd.md), partie 5 revalidée sur ce point | Section 3 |
| **Fréquence des sauvegardes** (laissée ouverte par ES17) | Quotidienne, déjà fixée avec la sécurité de la base | Section 2 |

## 1. Mises à jour

| Quoi | Comment | Quand |
|---|---|---|
| **Paquets npm** | Pull requests de Dependabot vers `develop`, regroupées : correctifs et versions mineures ensemble, chaque version majeure à part | Chaque semaine |
| **Actions GitHub** | Dependabot met à jour l'empreinte à laquelle chaque action est épinglée | Chaque semaine |
| **Faille de sécurité** dans une dépendance | Alerte GitHub et pull request de sécurité de Dependabot. Si la faille touche la production : hotfix ([déploiement](deploiement.md)) | Dès l'alerte |
| **Versions majeures** (Svelte, SvelteKit, Vite, Dexie.js) | Lire les notes de version, adapter le code et les tests, dans une branche dédiée ([ADR 0001](../04-specifications/adr/0001-framework-front-svelte.md)) | Au début d'un lot |
| **Exécutables épinglés** (dbmate, gitleaks, `pg_dump`) | Nouvelle version et nouvelle empreinte dans la CI ; `pg_dump` suit la version de PostgreSQL chez Neon | À chaque lot |
| **Node.js** | Rester sur une version maintenue (LTS) | Quand la version en cours arrive en fin de support |

> Décision : Dependabot passe **une fois par semaine**, avec les regroupements ci-dessus. Ses pull requests sont relues, puis fusionnées **en local** dans `develop`, comme les branches de fonctionnalité ([conventions](../02-projet/conventions.md)). Elles ne vont jamais directement dans `main`.

Chaque mise à jour passe par les contrôles de la CI avant d'atteindre la production, comme tout autre changement.

## 2. Sauvegardes

Le détail est dans la [sécurité de la base](../05-securite/bdd.md), sections 5 à 7. En résumé :

| Sauvegarde | Fréquence | Conservée |
|---|---|---|
| **Export quotidien** (Worker vers R2, incrémental) | Chaque jour | Toujours |
| **Export complet avant migration** (`pg_dump` vers R2, par la CI) | À chaque mise en production | Toujours |
| **Historique de Neon** | En continu | 6 heures |
| **Base locale de chaque appareil** | En continu | Tant que l'appareil garde ses données |

**Vérifications** :
- à chaque lot : le test de restauration, qui fait partie des 8 livrables ([recette](recette.md)) ;
- en continu : un e-mail de Cloudflare si la sauvegarde échoue ([sécurité du back](../05-securite/back.md)).

## 3. Reprise de la base en production

À utiliser en cas de perte ou de corruption de la base. Le poste du développeur n'a jamais d'accès direct à la production.

| Délai depuis l'incident | Moyen | Perte possible |
|---|---|---|
| **Moins de 6 heures** | Restauration à un instant donné, depuis la console Neon (historique de Neon) | Aucune |
| **Plus de 6 heures** | Tâche « Reprise » de la CI, lancée à la main | Aucune après le renvoi depuis les appareils (étape 5) |

> Décision : déroulé de la tâche « Reprise » :
> 1. Elle tourne dans l'environnement `production`, avec le **rôle de migration**, et demande de taper une confirmation avant de commencer.
> 2. Elle fait d'abord un export complet de la base dans son état actuel, même abîmé, vers R2 : rien n'est jamais écrasé sans copie.
> 3. Elle recrée la base depuis le **dernier export avant migration**. Les déclencheurs d'immuabilité sont recréés après les données, comme dans tout export `pg_dump` : ils ne bloquent pas le chargement.
> 4. Elle rejoue les **exports quotidiens** qui suivent, dans l'ordre, par la même logique que `submit_trial`. Les doublons sont ignorés (RG22).
> 5. Elle compare le nombre d'essais et le dernier numéro d'ordre avec le dernier export quotidien. Ensuite, chaque appareil peut **renvoyer tous ses essais** : la base ignore ceux qu'elle a déjà, et récupère ceux d'après la dernière sauvegarde.

La tâche suit la même règle que les migrations : elle s'arrête au premier échec, et chaque étape est visible dans l'onglet Actions.

## 4. Reprise après une longue pause

Neon et Hanko se mettent en veille, puis se réveillent seuls ([contraintes techniques](../04-specifications/contraintes-techniques.md)) : rien n'est à réparer. Au retour :

1. Relire le [PRD](../PRD.md), puis la check-list.
2. Ouvrir l'application : la première connexion est un peu plus lente, le temps du réveil.
3. Vérifier dans la console Cloudflare que les sauvegardes quotidiennes ont continué.
4. Relire et fusionner les pull requests de Dependabot en attente, en commençant par celles de sécurité.
5. Lire les e-mails des fournisseurs : changement d'offre gratuite, quotas, fin de service (R4).

## 5. Fin ou changement d'une offre gratuite (R4, MEN10)

| Ce qui reste disponible | Pourquoi |
|---|---|
| **Toutes les données** | Les exports de R2 sont en JSON, un format ouvert ([sécurité de la base](../05-securite/bdd.md), section 7), et chaque appareil garde sa copie locale. |
| **Le code** | Sur GitHub, et en copie sur le poste du développeur. |
| **Les alternatives** | Déjà comparées au [benchmark](../04-specifications/benchmark.md) : point de départ d'une migration vers un autre service. |

Un changement de fournisseur est une décision structurante : il passe par un nouvel ADR.

## À finaliser en production (J11)

| Point | Pourquoi |
|---|---|
| **Script de rejeu des exports quotidiens** | Écrit et testé au lot 1, avec le premier test de restauration. |
| **Renvoi complet depuis un appareil** | Bouton ou commande à prévoir. Le repère de réception de l'appareil peut être en avance sur la base restaurée : il faut le remettre à zéro. |
| **Rythme réel des pull requests de Dependabot** | À ajuster s'il est trop bruyant. |
