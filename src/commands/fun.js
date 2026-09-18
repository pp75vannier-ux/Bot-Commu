const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

const CATEGORY = 'Fun';

const EIGHT_BALL_ANSWERS = [
  'Oui, absolument.', 'Non, certainement pas.', 'C\'est probable.', 'Demande à nouveau plus tard.',
  'Difficile à dire...', 'Sans aucun doute !', 'Je ne parierais pas là-dessus.', 'Les signes indiquent oui.',
  'Concentre-toi et redemande.', 'Très douteux.'
];

const JOKES = [
  'Pourquoi les développeurs confondent-ils Halloween et Noël ? Parce que Oct 31 == Dec 25.',
  'Qu\'est-ce qu\'un algorithme ? Une suite d\'instructions qui plante toujours au pire moment.',
  'Un octet dit à un autre : "T\'as l\'air bit fatigué aujourd\'hui."',
  'J\'ai voulu compter les moutons pour dormir... j\'ai fini par écrire une boucle infinie.',
  'Pourquoi le programmeur est-il resté bloqué sous la douche ? Le shampoing disait "rincer, répéter".'
];

module.exports = [
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('8ball')
      .setDescription('Poser une question à la boule magique')
      .addStringOption(o => o.setName('question').setDescription('Ta question').setRequired(true)),
    async execute(interaction) {
      const question = interaction.options.getString('question');
      const answer = EIGHT_BALL_ANSWERS[Math.floor(Math.random() * EIGHT_BALL_ANSWERS.length)];
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .addFields({ name: '❓ Question', value: question }, { name: '🎱 Réponse', value: answer });
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('coinflip').setDescription('Lancer une pièce (pile ou face)'),
    async execute(interaction) {
      const result = Math.random() < 0.5 ? 'Pile 🪙' : 'Face 🪙';
      await interaction.reply(`🎲 Résultat : **${result}**`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('dice')
      .setDescription('Lancer un dé')
      .addIntegerOption(o => o.setName('faces').setDescription('Nombre de faces (par défaut 6)').setMinValue(2).setMaxValue(1000)),
    async execute(interaction) {
      const faces = interaction.options.getInteger('faces') || 6;
      const result = Math.floor(Math.random() * faces) + 1;
      await interaction.reply(`🎲 Vous avez lancé un dé à **${faces}** faces : **${result}** !`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder()
      .setName('rps')
      .setDescription('Jouer à Pierre-Feuille-Ciseaux contre le bot')
      .addStringOption(o =>
        o.setName('choix').setDescription('Ton choix').setRequired(true)
          .addChoices({ name: 'Pierre 🪨', value: 'pierre' }, { name: 'Feuille 📄', value: 'feuille' }, { name: 'Ciseaux ✂️', value: 'ciseaux' })
      ),
    async execute(interaction) {
      const choices = ['pierre', 'feuille', 'ciseaux'];
      const userChoice = interaction.options.getString('choix');
      const botChoice = choices[Math.floor(Math.random() * 3)];

      let result;
      if (userChoice === botChoice) result = '🤝 Égalité !';
      else if (
        (userChoice === 'pierre' && botChoice === 'ciseaux') ||
        (userChoice === 'feuille' && botChoice === 'pierre') ||
        (userChoice === 'ciseaux' && botChoice === 'feuille')
      ) result = '🎉 Vous avez gagné !';
      else result = '😢 Vous avez perdu !';

      await interaction.reply(`Vous : **${userChoice}** | Bot : **${botChoice}**\n${result}`);
    }
  },
  {
    category: CATEGORY,
    data: new SlashCommandBuilder().setName('meme').setDescription('Recevoir une blague aléatoire'),
    async execute(interaction) {
      const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
      await interaction.reply(`😂 ${joke}`);
    }
  }
];
