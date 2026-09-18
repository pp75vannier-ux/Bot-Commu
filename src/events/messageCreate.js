const { checkAutomod } = require('../handlers/automod');
const { handleXp } = require('../handlers/leveling');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const blocked = await checkAutomod(message);
    if (blocked) return;

    await handleXp(message);
  }
};
