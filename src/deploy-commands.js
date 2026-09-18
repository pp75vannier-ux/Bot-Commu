require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN ou CLIENT_ID manquant dans le fichier .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of files) {
  const list = require(path.join(commandsPath, file));
  for (const cmd of list) {
    commands.push(cmd.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🚀 Déploiement de ${commands.length} commande(s)...`);

    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log('✅ Commandes déployées sur le serveur (instantané).');
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Commandes déployées globalement (peut prendre jusqu\'à 1h pour apparaître).');
    }
  } catch (error) {
    console.error('❌ Erreur lors du déploiement :', error);
  }
})();
