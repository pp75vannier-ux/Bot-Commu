const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');
const config = require('../config.json');
const { pickWinners } = require('../handlers/giveaway');

const CATEGORY = 'Giveaways';

function parseDuration(str) {
  const match = /^(\d+)\s*(s|m|h|j|d)$/i.exec(str.trim());
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, j: 86400000, d: 86400000 };
  return value * multipliers[unit];
}

module.exports = [
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('giveaway-start')
      .setDescription('Lancer un giveaway')
      .addStringOption(o => o.setName('duree').setDescription('Ex: 30s, 10m, 2h, 1j').setRequired(true))
      .addIntegerOption(o => o.setName('gagnants').setDescription('Nombre de gagnants').setRequired(true).setMinValue(1))
      .addStringOption(o => o.setName('prix').setDescription('Ce qui est à gagner').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const durationStr = interaction.options.getString('duree');
      const winners = interaction.options.getInteger('gagnants');
      const prize = interaction.options.getString('prix');

      const durationMs = parseDuration(durationStr);
      if (!durationMs) {
        return interaction.reply({ content: '❌ Format de durée invalide. Utilise par exemple : `30s`, `10m`, `2h`, `1j`.', ephemeral: true });
      }

      const endTime = Date.now() + durationMs;
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(`**Prix :** ${prize}\n**Gagnants :** ${winners}\n**Se termine :** <t:${Math.floor(endTime / 1000)}:R>\n\nCliquez sur le bouton pour participer !`)
        .setFooter({ text: `Organisé par ${interaction.user.tag}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('giveaway_join').setLabel('Participer').setStyle(ButtonStyle.Success).setEmoji('🎉')
      );

      await interaction.reply({ embeds: [embed], components: [row] });
      const message = await interaction.fetchReply();

      const guildData = db.getGuild(interaction.guild.id);
      guildData.giveaways.push({
        messageId: message.id,
        channelId: interaction.channel.id,
        prize,
        winners,
        endTime,
        ended: false,
        entrants: [],
        hostId: interaction.user.id
      });
      db.saveGuild(interaction.guild.id, guildData);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('giveaway-end')
      .setDescription('[Admin] Terminer un giveaway immédiatement')
      .addStringOption(o => o.setName('message_id').setDescription('ID du message du giveaway').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction, client) {
      const messageId = interaction.options.getString('message_id');
      const guildData = db.getGuild(interaction.guild.id);
      const giveaway = guildData.giveaways.find(g => g.messageId === messageId);

      if (!giveaway) return interaction.reply({ content: '❌ Giveaway introuvable.', ephemeral: true });
      if (giveaway.ended) return interaction.reply({ content: '⚠️ Ce giveaway est déjà terminé.', ephemeral: true });

      giveaway.endTime = Date.now();
      db.saveGuild(interaction.guild.id, guildData);

      await require('../handlers/giveaway').endGiveaway(client, interaction.guild.id, giveaway);
      await interaction.reply({ content: '✅ Giveaway terminé manuellement.', ephemeral: true });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('giveaway-reroll')
      .setDescription('[Admin] Retirer un nouveau gagnant pour un giveaway terminé')
      .addStringOption(o => o.setName('message_id').setDescription('ID du message du giveaway').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const messageId = interaction.options.getString('message_id');
      const guildData = db.getGuild(interaction.guild.id);
      const giveaway = guildData.giveaways.find(g => g.messageId === messageId);

      if (!giveaway || !giveaway.ended) return interaction.reply({ content: '❌ Giveaway introuvable ou pas encore terminé.', ephemeral: true });

      const newWinners = pickWinners(giveaway.entrants, 1, giveaway.winnerIds || []);
      if (!newWinners.length) return interaction.reply({ content: '❌ Plus aucun participant disponible pour un reroll.', ephemeral: true });

      giveaway.winnerIds = [...(giveaway.winnerIds || []), ...newWinners];
      db.saveGuild(interaction.guild.id, guildData);

      await interaction.reply(`🎉 Nouveau gagnant pour **${giveaway.prize}** : ${newWinners.map(id => `<@${id}>`).join(', ')} !`);
    }
  }
];
