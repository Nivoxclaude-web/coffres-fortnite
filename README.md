# Compteur de coffres Fortnite

Petite appli web pour compter les coffres ouverts dans tes parties de Fortnite (PS5, Xbox, Switch, PC…), à garder sur ton téléphone pendant que tu joues.

- Compteur par partie (gros bouton +1, bouton −1 en cas d'erreur)
- Total de coffres toutes parties confondues
- Stats : moyenne, record, aujourd'hui, 7 derniers jours, graphique des 10 dernières parties, historique
- Stats séparées pour chaque joueur (chacun sur son téléphone, ou plusieurs profils sur un même téléphone)
- Fonctionne hors ligne et s'installe comme une appli

Les données restent sur le téléphone (pas de compte, pas de serveur). Le bouton « Exporter » dans le menu des joueurs permet de faire une sauvegarde.

## Mettre en ligne sur GitHub Pages

1. Crée un compte sur https://github.com (si ce n'est pas déjà fait).
2. Crée un nouveau dépôt **public**, par exemple `coffres-fortnite` (sans README).
3. Dans ce dossier, lance :
   ```bash
   git remote add origin https://github.com/TON-UTILISATEUR/coffres-fortnite.git
   git push -u origin main
   ```
4. Sur GitHub : **Settings → Pages → Source : Deploy from a branch → Branch : `main` / `(root)` → Save**.
5. Après 1 à 2 minutes, l'appli est en ligne : `https://TON-UTILISATEUR.github.io/coffres-fortnite/`

## Installer sur le téléphone

- **iPhone (Safari)** : ouvre le lien → bouton Partager → « Sur l'écran d'accueil ».
- **Android (Chrome)** : ouvre le lien → menu ⋮ → « Ajouter à l'écran d'accueil » / « Installer l'application ».

## Tester sur l'ordinateur

```bash
python -m http.server 8765
```
puis ouvre http://localhost:8765
