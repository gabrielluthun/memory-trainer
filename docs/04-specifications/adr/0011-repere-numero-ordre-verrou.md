# ADR 0011 — Repère de réception : numéro d'ordre et verrou

- Statut : accepté
- Date : 2026-11-20

## Contexte

Chaque appareil doit télécharger les essais faits sur les autres appareils (EF21). Le Worker de sauvegarde ne doit exporter que les nouveaux essais (ES17, [ADR 0009](0009-sauvegarde-cloudflare-worker-r2.md)). Tous deux ont besoin d'un **repère** : « ce que j'ai déjà reçu ». Flux détaillés : [SEQ05](../uml/sequences.md#5-seq05--synchronisation) et [SEQ06](../uml/sequences.md#6-seq06--sauvegarde).

## Options envisagées

### Nature du repère

| Option | Points forts | Points faibles |
|---|---|---|
| **Numéro d'ordre** donné par la base à chaque essai reçu | Simple, ne dépend d'aucune horloge. | Un essai enregistré en même temps qu'un autre peut prendre un numéro plus petit et être sauté. |
| **Date de réception** posée par la base | Lisible, sert aussi à la sauvegarde. | Même risque de saut, et deux essais peuvent avoir la même date. |
| **Comparaison des identifiants** | Aucun essai ne peut être oublié. | Liste qui grossit avec les années, plus de transfert, et le Worker doit quand même garder son propre repère. |

### Parade contre un essai sauté

| Option | Points forts | Points faibles |
|---|---|---|
| **Verrou dans la fonction d'envoi** | Aucun saut possible, aucun recouvrement, repère simple pour l'appareil et pour le Worker. | Deux envois simultanés s'attendent (quelques millisecondes), et il y a une règle de plus à tester. |
| **Recouvrement à la lecture** | Aucune attente dans la base. | Une requête de plus à chaque synchronisation, une logique plus complexe sur l'appareil et dans le Worker, et une marge à choisir. |

## Décision

Chaque essai reçu prend un **numéro d'ordre croissant**, attribué par la base. La fonction d'envoi ([ADR 0010](0010-envoi-essai-fonction-sql.md)) prend un **verrou court** valable jusqu'à la fin de sa transaction : les essais sont enregistrés un par un, et les numéros suivent l'ordre d'enregistrement. Choix du développeur.

L'appareil garde son repère dans Dexie.js. Le Worker garde le sien dans R2, car il n'a qu'un accès en lecture à la base (ES11).

## Conséquences

| Positives | Négatives |
|---|---|
| « Numéro supérieur au repère » ne peut rien oublier. | Le verrou doit être testé : deux envois simultanés doivent donner deux numéros dans l'ordre de leur enregistrement. |
| Même mécanisme pour la synchronisation et pour la sauvegarde. | Le numéro n'a de sens que dans la base de référence : une restauration doit le conserver tel quel. |
| Le numéro ne remplace pas les dates d'origine de l'essai (RG22). | Les numéros peuvent avoir des trous (transaction annulée) : le repère ne doit jamais supposer qu'ils se suivent. |
