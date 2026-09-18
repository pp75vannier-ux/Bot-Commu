const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

const CATEGORY = 'Modération';

module.exports = [
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Bannir un membre du serveur')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre à bannir').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison du bannissement'))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur');
      const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
      const member = interaction.guild.members.cache.get(user.id);

      if (member && !member.bannable) {
        return interaction.reply({ content: '❌ Je ne peux pas bannir ce membre (rôle trop élevé).', ephemeral: true });
      }

      await interaction.guild.members.ban(user, { reason });
      const embed = new EmbedBuilder().setColor('Red').setDescription(`🔨 **${user.tag}** a été banni.\n📝 Raison : ${reason}`);
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('unban')
      .setDescription('Débannir un utilisateur via son ID')
      .addStringOption(o => o.setName('id').setDescription('ID Discord de l\'utilisateur').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
      const id = interaction.options.getString('id');
      try {
        await interaction.guild.members.unban(id);
        await interaction.reply({ content: `✅ Utilisateur \`${id}\` débanni.` });
      } catch {
        await interaction.reply({ content: '❌ Impossible de débannir cet ID (introuvable dans la liste des bannis ?).', ephemeral: true });
      }
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Expulser un membre du serveur')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre à expulser').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison de l\'expulsion'))
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur');
      const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
      const member = interaction.guild.members.cache.get(user.id);

      if (!member) return interaction.reply({ content: '❌ Membre introuvable sur ce serveur.', ephemeral: true });
      if (!member.kickable) return interaction.reply({ content: '❌ Je ne peux pas expulser ce membre (rôle trop élevé).', ephemeral: true });

      await member.kick(reason);
      const embed = new EmbedBuilder().setColor('Orange').setDescription(`👢 **${user.tag}** a été expulsé.\n📝 Raison : ${reason}`);
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('timeout')
      .setDescription('Mettre un membre en sourdine temporaire (timeout)')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre concerné').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('Durée en minutes (max 40320 = 28 jours)').setRequired(true).setMinValue(1).setMaxValue(40320))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur');
      const minutes = interaction.options.getInteger('minutes');
      const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
      const member = interaction.guild.members.cache.get(user.id);

      if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
      if (!member.moderatable) return interaction.reply({ content: '❌ Je ne peux pas mettre ce membre en sourdine.', ephemeral: true });

      await member.timeout(minutes * 60 * 1000, reason);
      const embed = new EmbedBuilder().setColor('Yellow').setDescription(`🔇 **${user.tag}** est en sourdine pour **${minutes} minute(s)**.\n📝 Raison : ${reason}`);
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('untimeout')
      .setDescription('Retirer la sourdine (timeout) d\'un membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre concerné').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur');
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });

      await member.timeout(null);
      await interaction.reply({ content: `🔊 **${user.tag}** peut de nouveau parler.` });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Avertir un membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre à avertir').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison de l\'avertissement').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur');
      const reason = interaction.options.getString('raison');

      const guildData = db.getGuild(interaction.guild.id);
      if (!guildData.warnings[user.id]) guildData.warnings[user.id] = [];
      guildData.warnings[user.id].push({ reason, moderatorId: interaction.user.id, date: Date.now() });
      db.saveGuild(interaction.guild.id, guildData);

      const embed = new EmbedBuilder().setColor('Yellow').setDescription(`⚠️ **${user.tag}** a été averti.\n📝 Raison : ${reason}\n📊 Total d'avertissements : ${guildData.warnings[user.id].length}`);
      await interaction.reply({ embeds: [embed] });

      await user.send(`⚠️ Vous avez reçu un avertissement sur **${interaction.guild.name}** : ${reason}`).catch(() => {});
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('warnings')
      .setDescription('Voir les avertissements d\'un membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre concerné').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur');
      const guildData = db.getGuild(interaction.guild.id);
      const warns = guildData.warnings[user.id] || [];

      if (!warns.length) return interaction.reply({ content: `✅ **${user.tag}** n'a aucun avertissement.`, ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`⚠️ Avertissements de ${user.tag}`)
        .setDescription(warns.map((w, i) => `**${i + 1}.** ${w.reason} — <@${w.moderatorId}> (<t:${Math.floor(w.date / 1000)}:R>)`).join('\n'));

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('clearwarnings')
      .setDescription('Effacer tous les avertissements d\'un membre')
      .addUserOption(o => o.setName('utilisateur').setDescription('Membre concerné').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('utilisateur');
      const guildData = db.getGuild(interaction.guild.id);
      guildData.warnings[user.id] = [];
      db.saveGuild(interaction.guild.id, guildData);
      await interaction.reply({ content: `✅ Avertissements de **${user.tag}** effacés.` });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('purge')
      .setDescription('Supprimer plusieurs messages d\'un coup')
      .addIntegerOption(o => o.setName('nombre').setDescription('Nombre de messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });
      const amount = interaction.options.getInteger('nombre');
      const deleted = await interaction.channel.bulkDelete(amount, true).catch(() => null);
      if (!deleted) return interaction.editReply('❌ Impossible de supprimer ces messages (trop vieux de 14 jours ?).');
      await interaction.editReply(`🧹 **${deleted.size}** message(s) supprimé(s).`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('lock')
      .setDescription('Verrouiller le salon actuel (empêche @everyone d\'écrire)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await interaction.reply('🔒 Ce salon est maintenant verrouillé.');
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('unlock')
      .setDescription('Déverrouiller le salon actuel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
      await interaction.reply('🔓 Ce salon est maintenant déverrouillé.');
    }
  }
];
