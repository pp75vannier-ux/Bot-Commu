const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

const CATEGORY = 'Rôles à réaction';

module.exports = [
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('reactionrole-add')
      .setDescription('[Admin] Lier une réaction à un rôle sur un message')
      .addStringOption(o => o.setName('message_id').setDescription('ID du message').setRequired(true))
      .addStringOption(o => o.setName('emoji').setDescription('Émoji à utiliser').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Rôle à attribuer').setRequired(true))
      .addChannelOption(o => o.setName('salon').setDescription('Salon où se trouve le message (par défaut : ce salon)'))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
      const messageId = interaction.options.getString('message_id');
      const emoji = interaction.options.getString('emoji');
      const role = interaction.options.getRole('role');
      const channel = interaction.options.getChannel('salon') || interaction.channel;

      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (!message) return interaction.reply({ content: '❌ Message introuvable dans ce salon.', ephemeral: true });

      await message.react(emoji).catch(() => null);

      const guildData = db.getGuild(interaction.guild.id);
      guildData.reactionRoles.push({ messageId, emoji, roleId: role.id });
      db.saveGuild(interaction.guild.id, guildData);

      await interaction.reply({ content: `✅ Réagir avec ${emoji} sur ce message donnera le rôle ${role}.`, ephemeral: true });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('reactionrole-remove')
      .setDescription('[Admin] Retirer un lien réaction/rôle')
      .addStringOption(o => o.setName('message_id').setDescription('ID du message').setRequired(true))
      .addStringOption(o => o.setName('emoji').setDescription('Émoji concerné').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
      const messageId = interaction.options.getString('message_id');
      const emoji = interaction.options.getString('emoji');

      const guildData = db.getGuild(interaction.guild.id);
      const before = guildData.reactionRoles.length;
      guildData.reactionRoles = guildData.reactionRoles.filter(r => !(r.messageId === messageId && r.emoji === emoji));
      db.saveGuild(interaction.guild.id, guildData);

      if (guildData.reactionRoles.length === before) {
        return interaction.reply({ content: '❌ Aucune association trouvée pour ce message et cet émoji.', ephemeral: true });
      }

      await interaction.reply({ content: '✅ Association réaction/rôle supprimée.', ephemeral: true });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('reactionrole-list').setDescription('[Admin] Lister les rôles à réaction configurés').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
      const guildData = db.getGuild(interaction.guild.id);
      if (!guildData.reactionRoles.length) return interaction.reply({ content: '📭 Aucun rôle à réaction configuré.', ephemeral: true });

      const desc = guildData.reactionRoles.map(r => `${r.emoji} → <@&${r.roleId}> (message \`${r.messageId}\`)`).join('\n');
      const embed = new EmbedBuilder().setColor(config.embedColor).setTitle('🎭 Rôles à réaction').setDescription(desc);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
];
