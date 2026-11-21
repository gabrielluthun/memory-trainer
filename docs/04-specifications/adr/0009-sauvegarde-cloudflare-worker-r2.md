# ADR 0009 — Sauvegarde : Worker Cloudflare et R2

- Statut : accepté
- Date : 2026-11-20

## Contexte

ES17 impose une sauvegarde automatique et régulière, dans un espace privé, chez un autre fournisseur que la base. L'offre gratuite de Neon ne remplace pas une sauvegarde externe. Le repo est public : les sauvegardes ne doivent jamais y aller (RGPD02, MEN11).

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **Cloudflare : Worker planifié + R2** (R2 est le service de stockage de fichiers de Cloudflare, équivalent d'Amazon S3) | Même compte que l'hébergement. R2 gratuit jusqu'à 10 Go, sans frais de téléchargement. | Hébergement et sauvegarde chez le même fournisseur. |
| **Backblaze B2** | Un troisième fournisseur, indépendant. 10 Go gratuits. | Un compte et un service de plus. |
| **Copie sur l'ordinateur du développeur** | Aucun service de plus. | Dépend de la machine et de la discipline du développeur. |

## Décision

**Un Worker Cloudflare planifié** (une petite fonction exécutée par Cloudflare à heure fixe) exporte chaque jour les données en JSON vers **R2**, dans un espace privé. Choix du développeur.

## Conséquences

| Positives | Négatives |
|---|---|
| Sauvegarde automatique, hors de Neon (ES17). | Si le compte Cloudflare est perdu, l'hébergement et les sauvegardes le sont aussi. |
| Format JSON ouvert, réutilisable pour l'export (ES18). | Le Worker gratuit a un temps de calcul limité : l'export doit être **incrémental** (seulement les nouveaux essais), ce que permet l'immuabilité (RG18). |
| Le Worker lit la base avec un rôle en lecture seule (ES11). | La restauration est à écrire et à tester à chaque lot (ES17). |
