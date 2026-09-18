require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { loadCommands } = require('./commandHandler');

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN manquant. Copie .env.example en .env et remplis-le.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User]
});

loadCommands(client);

// Chargement des événements
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}
console.log(`🧩 ${eventFiles.length} événement(s) chargé(s).`);

// Vérifie toutes les 15 secondes si un giveaway doit se terminer
setInterval(() => {
  require('./handlers/giveaway').checkGiveaways(client).catch(console.error);
}, 15000);

client.login(process.env.DISCORD_TOKEN);
