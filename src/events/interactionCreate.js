module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        const payload = { content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      const { customId } = interaction;

      if (customId === 'ticket_create') {
        return require('../handlers/tickets').createTicket(interaction, client);
      }
      if (customId === 'ticket_close') {
        return require('../handlers/tickets').closeTicket(interaction, client);
      }
      if (customId === 'giveaway_join') {
        return require('../handlers/giveaway').joinGiveaway(interaction, client);
      }
    }
  }
};
