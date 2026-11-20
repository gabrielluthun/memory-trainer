# ADR 0004 — Hors ligne et synchronisation : sur-mesure avec Dexie.js

- Statut : accepté
- Date : 2026-11-20

## Contexte

Les exercices doivent fonctionner sans connexion (ENF02), sans perte (ENF07) ni doublon (RG22). Les essais terminés sont immuables (RG18) et il n'y a qu'un seul utilisateur : la synchronisation consiste surtout à ajouter des essais.

## Options envisagées

Sur-mesure avec Dexie.js (35/40), RxDB (30), PowerSync (28), Dexie Cloud (28), ElectricSQL (19). Zero est éliminé : il n'accepte aucune écriture hors connexion. Détail : [benchmark, section 4](../benchmark.md#4-hors-ligne-et-synchronisation).

## Décision

**Sur-mesure** : les données sont stockées localement avec **Dexie.js** (IndexedDB), et une **file d'envoi** les transmet à Neon au retour du réseau. Chaque essai porte un identifiant unique créé sur l'appareil (ES06).

## Conséquences

| Positives | Négatives |
|---|---|
| Aucun service tiers ni quota : rien à suspendre. | Le code de synchronisation est à écrire et à **tester** : c'est là que peut naître MEN08. |
| Fonctionne avec n'importe quel backend. | Les conflits sur les systèmes (lot 5) sont à gérer soi-même, par exemple avec « la dernière écriture gagne ». |
| Simple, grâce à l'immuabilité des essais. | Pas de mise à jour en temps réel : la synchronisation se fait à l'ouverture et au retour du réseau. |
