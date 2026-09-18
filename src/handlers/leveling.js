const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

function xpForLevel(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}

async function handleXp(message) {
  const userData = db.getUser(message.guild.id, message.author.id);
  const now = Date.now();
  if (now - userData.lastMessageTs < config.xpCooldown) return;

  const gained = Math.floor(Math.random() * (config.xpPerMessage.max - config.xpPerMessage.min + 1)) + config.xpPerMessage.min;
  userData.xp += gained;
  userData.lastMessageTs = now;

  const needed = xpForLevel(userData.level);
  if (userData.xp >= needed) {
    userData.xp -= needed;
    userData.level += 1;
    if (config.levelUpMessage) {
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`🎉 ${message.author} passe au niveau **${userData.level}** !`);
      message.channel.send({ embeds: [embed] }).catch(() => {});
    }
  }

  db.saveUser(message.guild.id, message.author.id, userData);
}

module.exports = { handleXp, xpForLevel };
