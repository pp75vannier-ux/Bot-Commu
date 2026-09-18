const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const guildData = db.getGuild(member.guild.id);

    if (guildData.leaveChannel) {
      const channel = member.guild.channels.cache.get(guildData.leaveChannel);
      if (channel) {
        const text = guildData.leaveMessage.replace('{user}', member.user.tag);
        const embed = new EmbedBuilder()
          .setColor('Grey')
          .setDescription(text)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        channel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  }
};
