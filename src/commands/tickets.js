const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType
} = require('discord.js');

const config = require('../config.json');
const db = require('../database');

const CATEGORY = 'Tickets';

/*
============================================================
                  CONFIGURATION DU PANEL
============================================================
Modifie uniquement cette partie.
============================================================
*/

const TICKET_CONFIG = {

  // ----------------------------------------------------------
  // PANEL
  // ----------------------------------------------------------

  panel: {
    title: '🗄️ Voici le Panel Ticket ',

    description:
      'Sélectionnez le type de ticket que vous souhaitez ouvrir.',

    color: '#5865F2'
  },


  // ----------------------------------------------------------
  // CATEGORIES DISCORD
  // ----------------------------------------------------------
  // Mets ici les IDs de tes catégories Discord.
  // Exemple :
  // support: '123456789012345678'
  //
  // Pour obtenir un ID :
  // Discord > Paramètres > Avancé > Mode développeur
  // Puis clic droit sur la catégorie > Copier l'identifiant
  // ----------------------------------------------------------

  categories: {

    support: '1550511724866572368',

    dons: '1550511961349955584',

    partenariat: '1550512061052878909',

    signalement: '1550512124508381385'

  },


  // ----------------------------------------------------------
  // TYPES DE TICKETS
  // ----------------------------------------------------------
  // Tu peux modifier le nom, la description et l'emoji.
  // ----------------------------------------------------------

  types: {

    support: {
      label: 'Support',
      description: 'Besoin d’aide ou problème',
      emoji: '🛠️',
      prefix: 'support'
    },

    dons: {
      label: 'DONS',
      description: 'Par ici pour les dons (les dons ne sont pas obligatoires)',
      emoji: '💰',
      prefix: 'Dons'
    },

    partenariat: {
      label: 'Partenariat',
      description: 'Demande de partenariat',
      emoji: '🤝',
      prefix: 'partenariat'
    },

    signalement: {
      label: 'Signalement',
      description: 'Signaler un problème',
      emoji: '🚨',
      prefix: 'signalement'
    }

  }

};


/*
============================================================
                    COMMANDES
============================================================
*/

module.exports = [

  /*
  ============================================================
                    /ticket-panel
  ============================================================
  */

  {
    category: CATEGORY,

    data: new SlashCommandBuilder()
      .setName('ticket-panel')
      .setDescription(
        '[Admin] Créer le panneau de tickets'
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild
      ),

    async execute(interaction) {

      const panel =
        TICKET_CONFIG.panel;


      /*
      ----------------------------------------------------------
      EMBED
      ----------------------------------------------------------
      */

      const embed =
        new EmbedBuilder()
          .setColor(panel.color)
          .setTitle(panel.title)
          .setDescription(panel.description);


      /*
      ----------------------------------------------------------
      MENU DE SELECTION
      ----------------------------------------------------------
      */

      const menu =
        new StringSelectMenuBuilder()
          .setCustomId('ticket_category')
          .setPlaceholder(
            '🎫 Sélectionnez votre type de ticket'
          )
          .addOptions(

            Object.entries(
              TICKET_CONFIG.types
            ).map(
              ([value, ticket]) => ({

                label: ticket.label,

                description:
                  ticket.description,

                value: value,

                emoji: ticket.emoji

              })
            )

          );


      const row =
        new ActionRowBuilder()
          .addComponents(menu);


      /*
      ----------------------------------------------------------
      ENVOI DU PANEL
      ----------------------------------------------------------
      */

      await interaction.channel.send({

        embeds: [
          embed
        ],

        components: [
          row
        ]

      });


      await interaction.reply({

        content:
          '✅ Panneau de tickets créé.',

        ephemeral: true

      });

    }

  },


  /*
  ============================================================
                    /setticketlog
  ============================================================
  */

  {
    category: CATEGORY,

    data: new SlashCommandBuilder()
      .setName('setticketlog')
      .setDescription(
        '[Admin] Définir le salon de logs des tickets'
      )

      .addChannelOption(option =>
        option
          .setName('salon')
          .setDescription(
            'Salon où envoyer les logs'
          )
          .addChannelTypes(
            ChannelType.GuildText
          )
          .setRequired(true)
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild
      ),

    async execute(interaction) {

      const channel =
        interaction.options.getChannel(
          'salon'
        );

      const guildData =
        db.getGuild(
          interaction.guild.id
        );

      guildData.ticketLogChannel =
        channel.id;

      db.saveGuild(
        interaction.guild.id,
        guildData
      );


      await interaction.reply({

        content:
          `✅ Salon de logs défini sur ${channel}.`,

        ephemeral: true

      });

    }

  },


  /*
  ============================================================
                    /ticket-close
  ============================================================
  */

  {
    category: CATEGORY,

    data: new SlashCommandBuilder()
      .setName('ticket-close')
      .setDescription(
        'Fermer le ticket actuel'
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.SendMessages
      ),

    async execute(interaction, client) {

      if (
        !interaction.channel ||
        !interaction.channel.topic ||
        !interaction.channel.topic.startsWith(
          'ticket-'
        )
      ) {

        return interaction.reply({

          content:
            '❌ Cette commande fonctionne uniquement dans un ticket.',

          ephemeral: true

        });

      }


      await require(
        '../handlers/tickets'
      ).closeTicket(
        interaction,
        client
      );

    }

  }

];