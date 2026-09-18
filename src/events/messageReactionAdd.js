const db = require('../database');

function emojiKey(emoji) {
  return emoji.id ? `<:${emoji.name}:${emoji.id}>` : emoji.name;
}

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
    } catch {
      return;
    }

    const guild = reaction.message.guild;
    if (!guild) return;

    const guildData = db.getGuild(guild.id);
    const key = emojiKey(reaction.emoji);

    const match = guildData.reactionRoles.find(r => r.messageId === reaction.message.id && (r.emoji === key || r.emoji === reaction.emoji.name));
    if (!match) return;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const role = guild.roles.cache.get(match.roleId);
    if (role) member.roles.add(role).catch(() => {});
  }
};
