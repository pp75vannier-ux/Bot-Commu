const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const guildData = db.getGuild(member.guild.id);

    if (guildData.autoRole) {
      const role = member.guild.roles.cache.get(guildData.autoRole);
      if (role) member.roles.add(role).catch(() => {});
    }

    if (guildData.welcomeChannel) {
      const channel = member.guild.channels.cache.get(guildData.welcomeChannel);
      if (channel) {
        const text = guildData.welcomeMessage
          .replace('{user}', `${member}`)
          .replace('{server}', member.guild.name)
          .replace('{count}', member.guild.memberCount);

        const embed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setTitle('👋 Nouveau membre !')
          .setDescription(text)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        channel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  }
};
