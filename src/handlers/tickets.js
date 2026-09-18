const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

async function createTicket(interaction, client) {
  const guildData = db.getGuild(interaction.guild.id);

  const existing = interaction.guild.channels.cache.find(c => c.topic === `ticket-${interaction.user.id}`);
  if (existing) {
    return interaction.reply({ content: `⚠️ Vous avez déjà un ticket ouvert : ${existing}`, ephemeral: true });
  }

  guildData.ticketCounter += 1;
  db.saveGuild(interaction.guild.id, guildData);

  const overwrites = [
    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
  ];

  const channel = await interaction.guild.channels.create({
    name: `ticket-${guildData.ticketCounter}`,
    type: ChannelType.GuildText,
    parent: guildData.ticketCategory || undefined,
    topic: `ticket-${interaction.user.id}`,
    permissionOverwrites: overwrites
  }).catch(() => null);

  if (!channel) {
    return interaction.reply({ content: '❌ Impossible de créer le ticket (vérifie mes permissions).', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle(`🎫 Ticket #${guildData.ticketCounter}`)
    .setDescription(`Bonjour ${interaction.user}, un membre du staff va bientôt vous répondre.\nCliquez sur le bouton ci-dessous pour fermer ce ticket.`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
  );

  await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
  await interaction.reply({ content: `✅ Ticket créé : ${channel}`, ephemeral: true });
}

async function closeTicket(interaction, client) {
  const channel = interaction.channel;
  await interaction.reply({ content: '🔒 Fermeture du ticket dans 5 secondes...' });

  const guildData = db.getGuild(interaction.guild.id);
  if (guildData.ticketLogChannel) {
    const logChannel = interaction.guild.channels.cache.get(guildData.ticketLogChannel);
    if (logChannel) {
      logChannel.send({ content: `🎫 Ticket **${channel.name}** fermé par ${interaction.user.tag}` }).catch(() => {});
    }
  }

  setTimeout(() => channel.delete().catch(() => {}), 5000);
}

module.exports = { createTicket, closeTicket };
