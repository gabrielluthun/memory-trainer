# ADR 0022 — Migrations avec dbmate

- Statut : accepté
- Date : 2026-11-21

## Contexte

ES19 exige des migrations versionnées, testées en local, appliquées en production **uniquement par la CI**, avec une sauvegarde juste avant. Le schéma est écrit en SQL : tables, contrôles différés, déclencheurs, fonctions, rôles et règles RLS ([modèle physique](../bdd/mpd.md), [accès aux données](../acces.md)). Il n'y a pas d'ORM. L'outil de migration tourne dans la CI avec le secret le plus puissant de la base : il fait partie de la surface d'attaque (MEN06).

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **dbmate** | Un seul exécutable ; fichiers en SQL pur (`up` et `down`) ; table de suivi ; aucun paquet npm n'a accès à la production | Exécutable hors npm, à épingler par version et empreinte dans la CI |
| **node-pg-migrate** | Paquet npm connu ; migrations en SQL ou en JavaScript | Une dépendance npm de plus, exécutée avec le secret de migration |
| **Script maison** | Aucune dépendance, tout est compris | À écrire et à tester soi-même : transaction, verrou, ordre |

## Décision

**dbmate**. Choix du développeur. Les migrations sont dans `db/migrations/`, une par fichier, en SQL pur. La première reprend le script testé du modèle physique et de l'accès aux données. Le détail est dans le [déploiement](../../06-qualite-deploiement/deploiement.md), section 3.

## Conséquences

| Positives | Négatives |
|---|---|
| Les migrations sont du SQL lisible, identique à celui testé dans PGlite. | L'exécutable doit être téléchargé à une version fixée et vérifié par son empreinte, dans la CI et sur le poste. |
| Aucun code npm ne s'exécute avec le secret de migration (MEN06). | Pas de migration en JavaScript : une transformation de données se fait en SQL. |
| Chaque migration tourne dans une transaction : une migration en échec ne laisse rien à moitié fait. | La partie `down` n'est pas utilisée en production : on corrige par une nouvelle migration, ou on restaure l'export. |
