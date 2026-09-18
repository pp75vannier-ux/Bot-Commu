const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

const CATEGORY = 'Administration';

module.exports = [
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('setwelcome')
      .setDescription('[Admin] Définir le salon de bienvenue')
      .addChannelOption(o => o.setName('salon').setDescription('Salon de bienvenue').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Message (utilise {user}, {server}, {count})'))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const channel = interaction.options.getChannel('salon');
      const message = interaction.options.getString('message');
      const guildData = db.getGuild(interaction.guild.id);
      guildData.welcomeChannel = channel.id;
      if (message) guildData.welcomeMessage = message;
      db.saveGuild(interaction.guild.id, guildData);
      await interaction.reply(`✅ Salon de bienvenue défini sur ${channel}.`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('setleave')
      .setDescription('[Admin] Définir le salon de départ')
      .addChannelOption(o => o.setName('salon').setDescription('Salon de départ').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Message (utilise {user})'))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const channel = interaction.options.getChannel('salon');
      const message = interaction.options.getString('message');
      const guildData = db.getGuild(interaction.guild.id);
      guildData.leaveChannel = channel.id;
      if (message) guildData.leaveMessage = message;
      db.saveGuild(interaction.guild.id, guildData);
      await interaction.reply(`✅ Salon de départ défini sur ${channel}.`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('setlog')
      .setDescription('[Admin] Définir le salon de logs (modération, messages supprimés/édités)')
      .addChannelOption(o => o.setName('salon').setDescription('Salon de logs').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const channel = interaction.options.getChannel('salon');
      const guildData = db.getGuild(interaction.guild.id);
      guildData.logChannel = channel.id;
      db.saveGuild(interaction.guild.id, guildData);
      await interaction.reply(`✅ Salon de logs défini sur ${channel}.`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('setautorole')
      .setDescription('[Admin] Définir le rôle donné automatiquement aux nouveaux membres')
      .addRoleOption(o => o.setName('role').setDescription('Rôle automatique').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const role = interaction.options.getRole('role');
      const guildData = db.getGuild(interaction.guild.id);
      guildData.autoRole = role.id;
      db.saveGuild(interaction.guild.id, guildData);
      await interaction.reply(`✅ Rôle automatique défini sur ${role}.`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('config')
      .setDescription('[Admin] Voir la configuration actuelle du bot')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const g = db.getGuild(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('⚙️ Configuration du serveur')
        .addFields(
          { name: 'Salon de bienvenue', value: g.welcomeChannel ? `<#${g.welcomeChannel}>` : 'Non défini', inline: true },
          { name: 'Salon de départ', value: g.leaveChannel ? `<#${g.leaveChannel}>` : 'Non défini', inline: true },
          { name: 'Salon de logs', value: g.logChannel ? `<#${g.logChannel}>` : 'Non défini', inline: true },
          { name: 'Rôle automatique', value: g.autoRole ? `<@&${g.autoRole}>` : 'Non défini', inline: true },
          { name: 'Catégorie tickets', value: g.ticketCategory ? `<#${g.ticketCategory}>` : 'Non définie', inline: true },
          { name: 'Logs tickets', value: g.ticketLogChannel ? `<#${g.ticketLogChannel}>` : 'Non défini', inline: true }
        )
        .setFooter({ text: '⚠️ Configuration en mémoire : réinitialisée au redémarrage du bot.' });
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('say')
      .setDescription('[Admin] Faire dire un message au bot')
      .addStringOption(o => o.setName('message').setDescription('Message à envoyer').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
      const message = interaction.options.getString('message');
      await interaction.reply({ content: '✅ Message envoyé.', ephemeral: true });
      await interaction.channel.send(message);
    }
  }
];
