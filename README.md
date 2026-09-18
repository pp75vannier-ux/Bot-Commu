# 🤖 Bot Discord Communautaire — Full Node.js

Bot Discord complet écrit en **Node.js** avec **discord.js v14**.
Stockage **100% en mémoire** (aucune base de données, aucun fichier) — simple, rapide, mais les données (XP, économie, avertissements, config) sont réinitialisées à chaque redémarrage du bot.

## ✨ Fonctionnalités (51 commandes slash)

- **Modération** : ban, unban, kick, timeout/untimeout, warn, warnings, clearwarnings, purge, lock/unlock
- **Niveaux / XP** : gain d'XP automatique sur chaque message, rank, leaderboard, setlevel, addxp
- **Économie** : balance, daily, work, pay, shop, buy, inventory, economy-top, addmoney
- **Tickets** : panneau avec bouton, création/fermeture automatique de salon privé
- **Rôles à réaction** : lier un emoji + rôle à un message
- **Giveaways** : lancement avec bouton "Participer", fin automatique, reroll
- **Auto-modération** : filtre de mots interdits, blocage des liens d'invitation Discord, anti spam de mentions
- **Bienvenue / Départ** : messages personnalisables, auto-rôle
- **Logs** : messages supprimés/modifiés, actions de modération
- **Fun** : 8ball, coinflip, dice, rps, meme
- **Utilitaire** : ping, userinfo, serverinfo, avatar, poll, help

## 🚀 Installation

### 1. Prérequis
- [Node.js](https://nodejs.org/) version 18 ou supérieure
- Un compte sur le [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Créer l'application Discord
1. Va sur https://discord.com/developers/applications → **New Application**
2. Onglet **Bot** → **Reset Token** → copie le token (à garder secret !)
3. Active les 3 **Privileged Gateway Intents** : `Presence Intent`, `Server Members Intent`, `Message Content Intent`
4. Onglet **General Information** → copie l'**Application ID**

### 3. Inviter le bot sur ton serveur
Onglet **OAuth2 → URL Generator** :
- Scopes : `bot`, `applications.commands`
- Permissions bot : `Administrator` (le plus simple) ou au minimum : Gérer les rôles, Gérer les salons, Bannir/Expulser des membres, Gérer les messages, Modérer les membres, Envoyer des messages, Intégrer des liens, Ajouter des réactions

Copie l'URL générée et ouvre-la dans ton navigateur pour inviter le bot.

### 4. Configurer le projet
```bash
npm install
cp .env.example .env
```
Remplis le fichier `.env` :
```
DISCORD_TOKEN=ton_token_ici
CLIENT_ID=id_de_ton_application
GUILD_ID=id_de_ton_serveur   # optionnel, pour un déploiement instantané des commandes en test
```
Pour obtenir l'ID d'un serveur : Paramètres Discord → Avancés → Mode développeur (activer), puis clic droit sur le serveur → "Copier l'ID".

### 5. Déployer les commandes slash
```bash
npm run deploy
```

### 6. Lancer le bot
```bash
npm start
```

Si tout va bien, tu verras dans la console :
```
📦 51 commande(s) chargée(s).
🧩 9 événement(s) chargé(s).
✅ Connecté en tant que TonBot#1234
```

## ⚙️ Configuration en jeu

Une fois le bot en ligne, configure-le directement depuis Discord (permissions administrateur requises) :
- `/setwelcome` — salon + message de bienvenue
- `/setleave` — salon + message de départ
- `/setlog` — salon des logs
- `/setautorole` — rôle automatique
- `/setticketcategory` / `/setticketlog` — configuration des tickets
- `/ticket-panel` — poster le panneau de création de tickets
- `/reactionrole-add` — lier réaction/rôle
- `/config` — voir la configuration actuelle

## ⚠️ Important : stockage en mémoire

Ce bot ne conserve **aucune donnée sur disque**. Cela veut dire :
- Un redémarrage du bot (crash, mise à jour, redéploiement) efface tout : XP, niveaux, argent, avertissements, config des salons, giveaways en cours, etc.
- C'est un choix volontaire pour rester 100% simple et sans dépendance.

Si un jour tu veux que les données survivent aux redémarrages, il suffira de modifier uniquement `src/database.js` pour écrire dans un fichier JSON ou une vraie base de données — le reste du bot n'a pas besoin de changer.

## 📁 Structure du projet

```
discord-bot/
├── package.json
├── .env.example
├── src/
│   ├── index.js              # Point d'entrée
│   ├── deploy-commands.js    # Déploiement des commandes slash
│   ├── commandHandler.js     # Chargeur de commandes
│   ├── database.js           # Stockage en mémoire
│   ├── config.json           # Paramètres globaux (couleur, XP, boutique...)
│   ├── commands/              # Toutes les commandes slash, par catégorie
│   ├── events/                 # Événements Discord (ready, messages, réactions...)
│   └── handlers/               # Logique métier (tickets, giveaways, XP, auto-mod)
```

## 🛠️ Personnaliser

- **Couleur des embeds, XP, boutique, mots interdits** → `src/config.json`
- **Ajouter une commande** → ajoute un objet `{ data, execute, category }` dans le fichier de catégorie correspondant dans `src/commands/`, puis relance `npm run deploy`
