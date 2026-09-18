// Stockage 100% en mémoire (pur Node.js, aucun fichier, aucune base de données).
// ATTENTION : toutes les données (XP, économie, avertissements, configs...)
// sont réinitialisées à chaque redémarrage du bot puisqu'il n'y a aucune persistance.

const guilds = new Map();
const users = new Map();

function defaultGuild() {
  return {
    welcomeChannel: null,
    welcomeMessage: 'Bienvenue {user} sur **{server}** ! Nous sommes maintenant {count} membres.',
    leaveChannel: null,
    leaveMessage: '👋 **{user}** a quitté le serveur.',
    logChannel: null,
    autoRole: null,
    muteRole: null,
    ticketCategory: null,
    ticketLogChannel: null,
    ticketCounter: 0,
    reactionRoles: [], // { messageId, emoji, roleId }
    giveaways: [],      // { messageId, channelId, prize, winners, endTime, ended, entrants, hostId }
    warnings: {}         // userId: [{ reason, moderatorId, date }]
  };
}

function defaultUser() {
  return {
    xp: 0,
    level: 0,
    lastMessageTs: 0,
    balance: 100,
    lastDaily: 0,
    lastWork: 0,
    inventory: []
  };
}

function getGuild(guildId) {
  if (!guilds.has(guildId)) {
    guilds.set(guildId, defaultGuild());
  }
  return guilds.get(guildId);
}

function saveGuild(guildId, data) {
  // Conservé pour compatibilité avec le reste du code : en mémoire,
  // il suffit de remplacer l'entrée (pas d'écriture disque).
  guilds.set(guildId, data);
}

function getUser(guildId, userId) {
  if (!users.has(guildId)) users.set(guildId, new Map());
  const guildUsers = users.get(guildId);
  if (!guildUsers.has(userId)) {
    guildUsers.set(userId, defaultUser());
  }
  return guildUsers.get(userId);
}

function saveUser(guildId, userId, data) {
  if (!users.has(guildId)) users.set(guildId, new Map());
  users.get(guildId).set(userId, data);
}

function getAllUsers(guildId) {
  if (!users.has(guildId)) return {};
  return Object.fromEntries(users.get(guildId));
}

module.exports = { getGuild, saveGuild, getUser, saveUser, getAllUsers };
