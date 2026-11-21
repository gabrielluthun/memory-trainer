# ADR 0005 — Hébergement du front : Cloudflare Pages

- Statut : accepté
- Date : 2026-11-20

## Contexte

Le front est une application statique (PWA). L'hébergeur doit être gratuit dans la durée (ENF06), permettre des en-têtes de sécurité (ES13) et absorber les attaques par saturation (risque transféré en [A2](../../03-analyse-securite/menaces.md)).

## Options envisagées

Cloudflare Pages (33/35), Vercel (26), Netlify (23), GitHub Pages (22). Détail : [benchmark, section 5](../benchmark.md#5-hébergement-du-front).

## Décision

**Cloudflare Pages**, choisi par le développeur.

## Conséquences

| Positives | Négatives |
|---|---|
| Pas de limite de bande passante publiée, aucune clause « non commercial ». | Cloudflare oriente les nouveaux projets vers Workers : une migration pourrait être nécessaire à terme. |
| En-têtes de sécurité via un fichier `_headers` (ES13). | Interface plus technique. |
| Réseau mondial et protection DDoS. | Si la sauvegarde (ES17) est aussi chez Cloudflare, hébergement et sauvegarde dépendent du même fournisseur. |
