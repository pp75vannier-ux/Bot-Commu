const { PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

const INVITE_REGEX = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9-]+/i;

async function warnAndDelete(message, text) {
  await message.delete().catch(() => {});
  const notice = await message.channel.send({ content: `${message.author}, ${text}` }).catch(() => null);
  if (notice) setTimeout(() => notice.delete().catch(() => {}), 6000);
}

/**
 * Retourne true si le message a été bloqué (supprimé) par l'auto-mod.
 */
async function checkAutomod(message) {
  // Le staff (Gérer les messages) n'est pas soumis à l'auto-mod
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return false;

  const content = message.content.toLowerCase();

  // Mots interdits
  for (const word of config.badWords) {
    if (word && content.includes(word.toLowerCase())) {
      await warnAndDelete(message, 'merci de rester correct ici. 🚫');
      return true;
    }
  }

  // Liens d'invitation Discord
  if (INVITE_REGEX.test(content)) {
    await warnAndDelete(message, 'les invitations Discord ne sont pas autorisées ici.');
    return true;
  }

  // Spam de mentions
  if (message.mentions.users.size + message.mentions.roles.size > config.maxMentions) {
    await warnAndDelete(message, 'merci d\'éviter le spam de mentions.');
    return true;
  }

  return false;
}

module.exports = { checkAutomod };
