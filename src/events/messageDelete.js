const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild || message.author?.bot) return;

    const guildData = db.getGuild(message.guild.id);
    if (!guildData.logChannel) return;

    const channel = message.guild.channels.cache.get(guildData.logChannel);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('🗑️ Message supprimé')
      .addFields(
        { name: 'Auteur', value: message.author ? `${message.author.tag}` : 'Inconnu', inline: true },
        { name: 'Salon', value: `${message.channel}`, inline: true },
        { name: 'Contenu', value: message.content?.slice(0, 1000) || '*(vide ou non mis en cache)*' }
      )
      .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
  }
};
