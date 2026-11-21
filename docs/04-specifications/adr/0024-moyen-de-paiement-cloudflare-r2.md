# ADR 0024 — Moyen de paiement chez Cloudflare pour R2

- Statut : accepté
- Date : 2026-11-21

## Contexte

Les sauvegardes vont dans **Cloudflare R2** ([ADR 0009](0009-sauvegarde-cloudflare-worker-r2.md)) : export quotidien par le Worker, export complet avant chaque migration par la CI. ES16 exigeait qu'**aucun moyen de paiement** ne soit enregistré chez les fournisseurs, pour qu'un dépassement de quota soit refusé au lieu d'être facturé (MEN07).

À la création des services, au sprint 0, la console Cloudflare **exige un moyen de paiement pour activer R2**, même pour l'offre gratuite (10 Go, 1 million d'écritures et 10 millions de lectures par mois). L'usage prévu est très en dessous : environ 50 Mo par an et une trentaine d'écritures par mois ([contraintes techniques](../contraintes-techniques.md)).

Le risque nouveau : si la clé R2 fuit, quelqu'un peut remplir le bucket. La facture reste faible (environ 0,015 $ par Go et par mois au-delà de 10 Go), mais elle n'a pas de plafond strict.

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **R2 avec un moyen de paiement, ES16 aménagée** | Conception inchangée ; R2 reste chez Cloudflare, comme le Worker ; quotas très larges | Une facture est possible, sans plafond strict ; ES16 est affaiblie |
| **Backblaze B2** | 10 Go gratuits, compatible S3 ; inscription sans carte, à vérifier ; un fournisseur de plus pour les sauvegardes | Un compte et une console de plus ; ADR 0009 à remplacer ; service non étudié au benchmark |
| **Workers KV** | Inclus dans l'offre gratuite des Workers, sans carte | 1 Go, 1 000 écritures par jour, 25 Mo par valeur : l'export complet devra être découpé ; plus de code, restauration plus compliquée |

## Décision

**R2 avec un moyen de paiement chez Cloudflare**, et ES16 aménagée en « Facturation maîtrisée ». Choix du développeur. Parades :
- un moyen de paiement **chez Cloudflare seulement** ; aucun chez Neon, Hanko et GitHub ;
- **offre gratuite seule** chez Cloudflare : aucun abonnement payant (Workers Paid, R2 au-delà des quotas…) ;
- **alertes de facturation** activées dans la console Cloudflare ;
- clé R2 limitée en **lecture et écriture sur le seul bucket** de sauvegarde, rangée uniquement dans les secrets de la CI et du Worker.

## Conséquences

| Positives | Négatives |
|---|---|
| La conception des sauvegardes reste celle de l'ADR 0009 : rien à réécrire. | Chez Cloudflare, un dépassement est facturé au lieu d'être refusé. |
| Les quotas laissent une très grande marge. | Une fuite de la clé R2 peut coûter de l'argent : la rotation de la clé ([sécurité de la base](../../05-securite/bdd.md), section 3) devient aussi une parade financière. |
| Neon, Hanko et GitHub restent sans moyen de paiement : un dépassement y reste refusé. | L'objectif O2 (0 € de coût) n'est plus garanti par construction chez Cloudflare : il repose sur l'alerte de facturation. |
