module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: `/help | ${client.guilds.cache.size} serveur(s)` }],
      status: 'online'
    });
  }
};
