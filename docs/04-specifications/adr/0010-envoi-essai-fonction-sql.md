# ADR 0010 — Envoi d'un essai : fonction SQL en base

- Statut : accepté
- Date : 2026-11-20

## Contexte

Un essai terminé est envoyé à Neon avec tous ses éléments (80 chiffres et leurs réponses pour un Numbers standard). Il ne doit jamais arriver à moitié : un autre appareil pourrait le télécharger incomplet. L'envoi doit aussi être rejouable sans doublon (RG22, ES06), ne jamais modifier un essai déjà reçu (RG18, ES05) et contrôler les valeurs reçues (ES07). Flux détaillé : [SEQ05](../uml/sequences.md#5-seq05--synchronisation).

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **Fonction SQL en base**, appelée par la Data API | Envoi tout-ou-rien, une seule requête, contrôles ES07 regroupés au même endroit. | Du code SQL à écrire et à tester, des droits d'exécution à gérer. |
| **Deux insertions** (l'essai, puis ses éléments) par la Data API standard | Aucun code en base, seules les règles RLS s'appliquent. | Pas tout-ou-rien : un essai peut rester un moment sans ses éléments, et un autre appareil peut le télécharger incomplet. |
| **Une ligne avec les éléments en JSON** | Une seule insertion, tout-ou-rien, très simple. | Contrôles en base plus difficiles sur du JSON, modèle moins normalisé, analyse des erreurs en SQL plus difficile. |

## Décision

**Une fonction SQL en base** enregistre l'essai et ses éléments dans une seule transaction. Choix du développeur.

La fonction :
- s'exécute avec les **droits de l'appelant**, donc sous les règles RLS (ES04) ;
- prend le propriétaire dans l'**identité du jeton**, jamais dans les données envoyées ;
- ne fait rien si l'identifiant de l'essai existe déjà (ES06) ;
- ne fait qu'insérer : aucune modification ni suppression (ES05) ;
- contrôle les valeurs avant d'insérer (ES07) ;
- prend le verrou décrit dans l'[ADR 0011](0011-repere-numero-ordre-verrou.md).

## Conséquences

| Positives | Négatives |
|---|---|
| Un essai arrive entier ou pas du tout. | La fonction est du code à part entière : tests automatiques obligatoires (ES05 à ES07). |
| Le MCD peut garder les éléments dans leur propre table (S8). | La fonction fait partie du contrat entre l'application et la base : elle doit rester compatible avec les anciennes versions de l'application encore hors ligne (point ouvert, Q3). |
| Un seul point de contrôle pour l'envoi. | La Data API doit permettre l'appel de fonctions : à vérifier au sprint 0. |

## Complément (2026-11-20, S10)

Avec les droits de l'appelant, ce dernier peut aussi écrire directement dans les tables par la Data API, sans passer par la fonction. Les contrôles qui portent sur un essai entier (nombre d'éléments, sous-table, score) ne sont donc **pas** dans la fonction, mais dans des **déclencheurs différés**, qui s'appliquent quel que soit le chemin d'écriture. La décision ci-dessus reste valable. Voir l'[ADR 0017](0017-integrite-base-donnees.md).
