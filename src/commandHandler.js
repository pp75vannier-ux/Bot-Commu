const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, 'commands');
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const list = require(path.join(commandsPath, file));
    for (const cmd of list) {
      client.commands.set(cmd.data.name, cmd);
    }
  }

  console.log(`📦 ${client.commands.size} commande(s) chargée(s).`);
  return client.commands;
}

module.exports = { loadCommands };
