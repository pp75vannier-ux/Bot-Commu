const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const guildData = db.getGuild(newMessage.guild.id);
    if (!guildData.logChannel) return;

    const channel = newMessage.guild.channels.cache.get(guildData.logChannel);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor('Orange')
      .setTitle('✏️ Message modifié')
      .addFields(
        { name: 'Auteur', value: `${newMessage.author.tag}`, inline: true },
        { name: 'Salon', value: `${newMessage.channel}`, inline: true },
        { name: 'Avant', value: oldMessage.content?.slice(0, 500) || '*(vide ou non mis en cache)*' },
        { name: 'Après', value: newMessage.content?.slice(0, 500) || '*(vide)*' }
      )
      .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
  }
};
