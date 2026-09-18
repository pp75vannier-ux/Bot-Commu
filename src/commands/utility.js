const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

const CATEGORY = 'Utilitaire';

module.exports = [
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('ping').setDescription('Vérifier la latence du bot'),
    async execute(interaction, client) {
      const sent = await interaction.reply({ content: '🏓 Ping...', fetchReply: true });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      await interaction.editReply(`🏓 Pong ! Latence : **${latency}ms** | API Discord : **${Math.round(client.ws.ping)}ms**`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('userinfo')
      .setDescription('Afficher les infos d\'un membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre concerné')),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur') || interaction.user;
      const member = interaction.guild.members.cache.get(user.id);

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`👤 ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: 'ID', value: user.id, inline: true },
          { name: 'Compte créé', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
          { name: 'A rejoint le', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'N/A', inline: true },
          { name: 'Rôles', value: member ? member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => `${r}`).join(', ') || 'Aucun' : 'N/A' }
        );

      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('serverinfo').setDescription('Afficher les infos du serveur'),
    async execute(interaction) {
      const guild = interaction.guild;
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`🏠 ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: 'Membres', value: `${guild.memberCount}`, inline: true },
          { name: 'Salons', value: `${guild.channels.cache.size}`, inline: true },
          { name: 'Rôles', value: `${guild.roles.cache.size}`, inline: true },
          { name: 'Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
          { name: 'Propriétaire', value: `<@${guild.ownerId}>`, inline: true },
          { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
        );
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('avatar')
      .setDescription('Afficher l\'avatar d\'un membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre concerné')),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur') || interaction.user;
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`🖼️ Avatar de ${user.tag}`)
        .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }));
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('poll')
      .setDescription('Créer un sondage rapide (👍/👎)')
      .addStringOption(o => o.setName('question').setDescription('Question du sondage').setRequired(true)),
    async execute(interaction) {
      const question = interaction.options.getString('question');
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📊 Sondage')
        .setDescription(question)
        .setFooter({ text: `Sondage créé par ${interaction.user.tag}` });

      await interaction.reply({ embeds: [embed] });
      const msg = await interaction.fetchReply();
      await msg.react('👍');
      await msg.react('👎');
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('help').setDescription('Afficher la liste des commandes'),
    async execute(interaction, client) {
      const categories = {};
      for (const cmd of client.commands.values()) {
        const cat = cmd.category || 'Autre';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(`\`/${cmd.data.name}\``);
      }

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📖 Liste des commandes')
        .setDescription('Voici toutes les commandes disponibles, classées par catégorie.');

      for (const [cat, cmds] of Object.entries(categories)) {
        embed.addFields({ name: `**${cat}**`, value: cmds.join(' ') });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
];
