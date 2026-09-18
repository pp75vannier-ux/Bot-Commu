const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');

const db = require('../database');
const config = require('../config.json');

const CATEGORY = 'Tickets';

module.exports = [
  {
    category: CATEGORY,

    data: new SlashCommandBuilder()
      .setName('ticket-panel')
      .setDescription('[Admin] Créer le panneau de création de tickets dans ce salon')
      .addStringOption(option =>
        option
          .setName('titre')
          .setDescription('Titre du panneau')
          .setRequired(false)
      )
      .addStringOption(option =>
        option
          .setName('description')
          .setDescription('Description du panneau')
          .setRequired(false)
      )
      .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild
      ),

    async execute(interaction) {
      const title =
        interaction.options.getString('titre') ||
        '🎫 Support';

      const description =
        interaction.options.getString('description') ||
        'Cliquez sur le bouton ci-dessous pour ouvrir un ticket avec le staff.';

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(title)
        .setDescription(description);

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_create')
            .setLabel('Ouvrir un ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
        );

      await interaction.channel.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.reply({
        content: '✅ Panneau de tickets créé.',
        ephemeral: true
      });
    }
  },

  {
    category: CATEGORY,

    data: new SlashCommandBuilder()
      .setName('setticketcategory')
      .setDescription('[Admin] Définir la catégorie d\'un type de ticket')

      .addStringOption(option =>
        option
          .setName('type')
          .setDescription('Type de ticket')
          .setRequired(true)
          .addChoices(
            {
              name: '🛠️ Support',
              value: 'support'
            },
            {
              name: '💰 Achat',
              value: 'achat'
            },
            {
              name: '🤝 Partenariat',
              value: 'partenariat'
            },
            {
              name: '🚨 Signalement',
              value: 'signalement'
            }
          )
      )

      .addChannelOption(option =>
        option
          .setName('categorie')
          .setDescription('Catégorie Discord où créer les tickets')
          .addChannelTypes(ChannelType.GuildCategory)
          .setRequired(true)
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild
      ),

    async execute(interaction) {
      const type =
        interaction.options.getString('type');

      const category =
        interaction.options.getChannel('categorie');

      const guildData =
        db.getGuild(interaction.guild.id);

      if (!guildData.ticketCategories) {
        guildData.ticketCategories = {
          support: null,
          achat: null,
          partenariat: null,
          signalement: null
        };
      }

      guildData.ticketCategories[type] =
        category.id;

      db.saveGuild(
        interaction.guild.id,
        guildData
      );

      const names = {
        support: '🛠️ Support',
        achat: '💰 Achat',
        partenariat: '🤝 Partenariat',
        signalement: '🚨 Signalement'
      };

      await interaction.reply({
        content:
          `✅ La catégorie pour **${names[type]}** ` +
          `est maintenant définie sur **${category.name}**.`,
        ephemeral: true
      });
    }
  },

  {
    category: CATEGORY,

    data: new SlashCommandBuilder()
      .setName('setticketlog')
      .setDescription('[Admin] Définir le salon de logs des tickets')

      .addChannelOption(option =>
        option
          .setName('salon')
          .setDescription('Salon de logs')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild
      ),

    async execute(interaction) {
      const channel =
        interaction.options.getChannel('salon');

      const guildData =
        db.getGuild(interaction.guild.id);

      guildData.ticketLogChannel =
        channel.id;

      db.saveGuild(
        interaction.guild.id,
        guildData
      );

      await interaction.reply({
        content:
          `✅ Logs des tickets définis sur ${channel}.`,
        ephemeral: true
      });
    }
  },

  {
    category: CATEGORY,

    data: new SlashCommandBuilder()
      .setName('ticket-close')
      .setDescription('Fermer le ticket actuel')
      .setDefaultMemberPermissions(
        PermissionFlagsBits.SendMessages
      ),

    async execute(interaction, client) {
      if (
        !interaction.channel ||
        !interaction.channel.topic ||
        !interaction.channel.topic.startsWith('ticket-')
      ) {
        return interaction.reply({
          content:
            '❌ Cette commande ne fonctionne que dans un salon de ticket.',
          ephemeral: true
        });
      }

      await require('../handlers/tickets').closeTicket(
        interaction,
        client
      );
    }
  }
];