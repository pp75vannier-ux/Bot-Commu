const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

const CATEGORY = 'Économie';

function fmt(n) {
  return n.toLocaleString('fr-FR');
}

module.exports = [
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('balance')
      .setDescription('Voir votre solde ou celui d\'un membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre concerné')),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur') || interaction.user;
      const data = db.getUser(interaction.guild.id, user.id);
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`💰 **${user.tag}** possède **${fmt(data.balance)}** pièces.`);
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('daily').setDescription('Récupérer votre récompense quotidienne'),
    async execute(interaction) {
      const data = db.getUser(interaction.guild.id, interaction.user.id);
      const now = Date.now();
      const remaining = config.dailyCooldown - (now - data.lastDaily);

      if (remaining > 0) {
        const hours = Math.ceil(remaining / 3600000);
        return interaction.reply({ content: `⏳ Vous avez déjà récupéré votre récompense. Revenez dans **${hours}h**.`, ephemeral: true });
      }

      const reward = Math.floor(Math.random() * (config.dailyReward.max - config.dailyReward.min + 1)) + config.dailyReward.min;
      data.balance += reward;
      data.lastDaily = now;
      db.saveUser(interaction.guild.id, interaction.user.id, data);

      await interaction.reply(`🎁 Vous avez récupéré **${fmt(reward)}** pièces ! Nouveau solde : **${fmt(data.balance)}**.`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('work').setDescription('Travailler pour gagner des pièces'),
    async execute(interaction) {
      const data = db.getUser(interaction.guild.id, interaction.user.id);
      const now = Date.now();
      const remaining = config.workCooldown - (now - data.lastWork);

      if (remaining > 0) {
        const minutes = Math.ceil(remaining / 60000);
        return interaction.reply({ content: `⏳ Vous êtes fatigué. Revenez dans **${minutes} minute(s)**.`, ephemeral: true });
      }

      const reward = Math.floor(Math.random() * (config.workReward.max - config.workReward.min + 1)) + config.workReward.min;
      data.balance += reward;
      data.lastWork = now;
      db.saveUser(interaction.guild.id, interaction.user.id, data);

      const jobs = ['livré des pizzas', 'codé un bot Discord', 'promené des chiens', 'vendu des bonbons', 'modéré un serveur', 'joué de la guitare dans la rue'];
      const job = jobs[Math.floor(Math.random() * jobs.length)];

      await interaction.reply(`💼 Vous avez ${job} et gagné **${fmt(reward)}** pièces !`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('pay')
      .setDescription('Envoyer des pièces à un autre membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Destinataire').setRequired(true))
      .addIntegerOption(o => o.setName('montant').setDescription('Montant à envoyer').setRequired(true).setMinValue(1)),
    async execute(interaction) {
      const target = interaction.options.getUser('utilisateur');
      const amount = interaction.options.getInteger('montant');

      if (target.id === interaction.user.id) return interaction.reply({ content: '❌ Vous ne pouvez pas vous payer vous-même.', ephemeral: true });
      if (target.bot) return interaction.reply({ content: '❌ Vous ne pouvez pas payer un bot.', ephemeral: true });

      const sender = db.getUser(interaction.guild.id, interaction.user.id);
      if (sender.balance < amount) return interaction.reply({ content: '❌ Solde insuffisant.', ephemeral: true });

      const receiver = db.getUser(interaction.guild.id, target.id);
      sender.balance -= amount;
      receiver.balance += amount;
      db.saveUser(interaction.guild.id, interaction.user.id, sender);
      db.saveUser(interaction.guild.id, target.id, receiver);

      await interaction.reply(`✅ Vous avez envoyé **${fmt(amount)}** pièces à **${target.tag}**.`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('shop').setDescription('Voir la boutique du serveur'),
    async execute(interaction) {
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🛒 Boutique')
        .setDescription(config.shopItems.map(i => `**${i.name}** — ${fmt(i.price)} pièces\n\`/buy id:${i.id}\` — ${i.description}`).join('\n\n'));
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('buy')
      .setDescription('Acheter un article de la boutique')
      .addStringOption(o =>
        o.setName('id').setDescription('Identifiant de l\'article').setRequired(true)
          .addChoices(...config.shopItems.map(i => ({ name: i.name, value: i.id })))
      ),
    async execute(interaction) {
      const id = interaction.options.getString('id');
      const item = config.shopItems.find(i => i.id === id);
      if (!item) return interaction.reply({ content: '❌ Article introuvable.', ephemeral: true });

      const data = db.getUser(interaction.guild.id, interaction.user.id);
      if (data.balance < item.price) return interaction.reply({ content: '❌ Solde insuffisant.', ephemeral: true });

      data.balance -= item.price;
      data.inventory.push(item.id);
      db.saveUser(interaction.guild.id, interaction.user.id, data);

      await interaction.reply(`✅ Vous avez acheté **${item.name}** pour **${fmt(item.price)}** pièces !`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('inventory').setDescription('Voir votre inventaire'),
    async execute(interaction) {
      const data = db.getUser(interaction.guild.id, interaction.user.id);
      if (!data.inventory.length) return interaction.reply({ content: '📦 Votre inventaire est vide.', ephemeral: true });

      const counts = {};
      for (const id of data.inventory) counts[id] = (counts[id] || 0) + 1;

      const desc = Object.entries(counts).map(([id, count]) => {
        const item = config.shopItems.find(i => i.id === id);
        return `**${item ? item.name : id}** x${count}`;
      }).join('\n');

      const embed = new EmbedBuilder().setColor(config.embedColor).setTitle('📦 Votre inventaire').setDescription(desc);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('economy-top').setDescription('Classement des membres les plus riches'),
    async execute(interaction) {
      const allUsers = db.getAllUsers(interaction.guild.id);
      const sorted = Object.entries(allUsers).sort(([, a], [, b]) => b.balance - a.balance).slice(0, 10);

      if (!sorted.length) return interaction.reply('📉 Aucune donnée économique pour le moment.');

      const desc = sorted.map(([id, data], i) => `**${i + 1}.** <@${id}> — ${fmt(data.balance)} pièces`).join('\n');
      const embed = new EmbedBuilder().setColor(config.embedColor).setTitle('💰 Classement économique').setDescription(desc);
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('addmoney')
      .setDescription('[Admin] Ajouter des pièces à un membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre concerné').setRequired(true))
      .addIntegerOption(o => o.setName('montant').setDescription('Montant à ajouter').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur');
      const amount = interaction.options.getInteger('montant');
      const data = db.getUser(interaction.guild.id, user.id);
      data.balance += amount;
      db.saveUser(interaction.guild.id, user.id, data);
      await interaction.reply(`✅ **${fmt(amount)}** pièces ajoutées à **${user.tag}** (solde : ${fmt(data.balance)}).`);
    }
  }
];
