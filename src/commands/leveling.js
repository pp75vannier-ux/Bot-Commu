const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');
const { xpForLevel } = require('../handlers/leveling');

const CATEGORY = 'Niveaux';

module.exports = [
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('rank')
      .setDescription('Voir votre niveau ou celui d\'un membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre concerné')),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur') || interaction.user;
      const data = db.getUser(interaction.guild.id, user.id);
      const needed = xpForLevel(data.level);
      const barLength = 20;
      const filled = Math.round((data.xp / needed) * barLength);
      const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ dynamic: true }) })
        .setTitle(`📈 Niveau ${data.level}`)
        .setDescription(`${bar}\n${data.xp} / ${needed} XP`);

      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('leaderboard').setDescription('Classement des niveaux du serveur'),
    async execute(interaction) {
      const allUsers = db.getAllUsers(interaction.guild.id);
      const sorted = Object.entries(allUsers)
        .sort(([, a], [, b]) => (b.level - a.level) || (b.xp - a.xp))
        .slice(0, 10);

      if (!sorted.length) return interaction.reply('📉 Aucune donnée de niveau pour le moment.');

      const desc = sorted.map(([id, data], i) => `**${i + 1}.** <@${id}> — Niveau **${data.level}** (${data.xp} XP)`).join('\n');
      const embed = new EmbedBuilder().setColor(config.embedColor).setTitle('🏆 Classement des niveaux').setDescription(desc);
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('setlevel')
      .setDescription('[Admin] Définir le niveau d\'un membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre concerné').setRequired(true))
      .addIntegerOption(o => o.setName('niveau').setDescription('Nouveau niveau').setRequired(true).setMinValue(0))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur');
      const level = interaction.options.getInteger('niveau');
      const data = db.getUser(interaction.guild.id, user.id);
      data.level = level;
      data.xp = 0;
      db.saveUser(interaction.guild.id, user.id, data);
      await interaction.reply(`✅ **${user.tag}** est maintenant niveau **${level}**.`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('addxp')
      .setDescription('[Admin] Ajouter de l\'XP à un membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre concerné').setRequired(true))
      .addIntegerOption(o => o.setName('xp').setDescription('Quantité d\'XP à ajouter').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur');
      const amount = interaction.options.getInteger('xp');
      const data = db.getUser(interaction.guild.id, user.id);
      data.xp += amount;

      while (data.xp >= xpForLevel(data.level)) {
        data.xp -= xpForLevel(data.level);
        data.level += 1;
      }

      db.saveUser(interaction.guild.id, user.id, data);
      await interaction.reply(`✅ **${amount} XP** ajouté(s) à **${user.tag}** (niveau ${data.level}).`);
    }
  }
];
