# C0 — Profil du projet

Projet : **memory-trainer**, application personnelle d'entraînement à la mémoire, basée sur les disciplines de l'IAM (International Association of Memory) et de Memory League.

## Questions de profil

| Question | Réponse |
|---|---|
| Qui développe ? | Le développeur seul |
| Qui utilise ? | Le développeur seul (usage personnel) |
| Client ou parties prenantes ? | Aucun |
| Données personnelles de tiers ? | Non |
| Base de données conséquente ? | Oui |
| Contraintes métier fortes / criticité ? | Oui |

## Version du process retenue : **Solo**

Les quatre critères de la version Solo sont remplis : développé seul, utilisé seul, pas de client, pas de données personnelles de tiers.

## Points d'attention malgré la version Solo

- **Base de données conséquente** : la chaîne Merise (dictionnaire → MCD → MLD → MPD) sera menée en entier, avec des migrations versionnées.
- **Contraintes métier fortes** : les règles de gestion (RG) seront formalisées avec soin et couvertes en priorité par les tests (TDD envisagé sur la logique métier, à justifier en Q1). Leur nature exacte sera précisée en partie 1 (B4, B7).
- **Données de tiers** : à surveiller si une discipline utilise des visages ou des noms (type « Names & Faces »). Le contenu doit rester libre de droits pour conserver le profil Solo (voir A1 en partie 3).
- **Exposition en ligne** : si l'application est hébergée sur internet, la sécurité technique n'est pas allégée (partie 3 et partie 5).

## Bascule vers la version Complète

À proposer si l'un de ces événements survient : un deuxième utilisateur (ami, club, ouverture au public), un client ou un commanditaire, ou des données personnelles de tiers. Éléments à rattraper dans ce cas : parties prenantes, personas multiples, méthode, AIPD et conformité RGPD/CNIL, RBAC complet, contrat d'API si une API maison apparaît, observabilité, documentation utilisateur.
