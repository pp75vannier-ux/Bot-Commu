const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

function pickWinners(entrants, count, exclude = []) {
  const pool = [...new Set(entrants)].filter(id => !exclude.includes(id));
  const winners = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

async function joinGiveaway(interaction) {
  const guildData = db.getGuild(interaction.guild.id);
  const giveaway = guildData.giveaways.find(g => g.messageId === interaction.message.id && !g.ended);
  if (!giveaway) return interaction.reply({ content: '⚠️ Ce giveaway est terminé.', ephemeral: true });

  if (giveaway.entrants.includes(interaction.user.id)) {
    giveaway.entrants = giveaway.entrants.filter(id => id !== interaction.user.id);
    db.saveGuild(interaction.guild.id, guildData);
    return interaction.reply({ content: '❌ Vous ne participez plus à ce giveaway.', ephemeral: true });
  }

  giveaway.entrants.push(interaction.user.id);
  db.saveGuild(interaction.guild.id, guildData);
  return interaction.reply({ content: '🎉 Vous participez au giveaway ! (recliquez pour annuler)', ephemeral: true });
}

async function endGiveaway(client, guildId, giveaway) {
  giveaway.ended = true;

  const channel = client.channels.cache.get(giveaway.channelId);
  const winners = pickWinners(giveaway.entrants, giveaway.winners);
  giveaway.winnerIds = winners;

  if (channel) {
    const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`🎉 Giveaway terminé : ${giveaway.prize}`)
      .setDescription(winners.length ? `Félicitations à : ${winners.map(id => `<@${id}>`).join(', ')} !` : 'Personne n\'a participé. 😢')
      .setTimestamp();

    if (message) await message.edit({ embeds: [embed], components: [] }).catch(() => {});
    await channel.send({
      content: winners.length
        ? `🎉 Félicitations ${winners.map(id => `<@${id}>`).join(', ')}, vous remportez **${giveaway.prize}** !`
        : `😢 Aucun participant, pas de gagnant pour **${giveaway.prize}**.`
    }).catch(() => {});
  }

  const guildData = db.getGuild(guildId);
  const idx = guildData.giveaways.findIndex(g => g.messageId === giveaway.messageId);
  if (idx !== -1) guildData.giveaways[idx] = giveaway;
  db.saveGuild(guildId, guildData);
}

async function checkGiveaways(client) {
  for (const [guildId] of client.guilds.cache) {
    const guildData = db.getGuild(guildId);
    for (const giveaway of guildData.giveaways) {
      if (!giveaway.ended && Date.now() >= giveaway.endTime) {
        await endGiveaway(client, guildId, giveaway);
      }
    }
  }
}

module.exports = { joinGiveaway, endGiveaway, pickWinners, checkGiveaways };
