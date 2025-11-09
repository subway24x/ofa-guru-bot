import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fs from "fs";

const PLAYER_FILE = "./src/data/players.json";
const USERS_FILE = "./src/data/users.json";

function loadJSON(path) {
  if (!fs.existsSync(path)) return [];
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

export const data = new SlashCommandBuilder()
  .setName("sellall")
  .setDescription("Sell all players in your club for coins.");

export async function execute(interaction) {
  await interaction.deferReply();

  const players = loadJSON(PLAYER_FILE);
  const users = loadJSON(USERS_FILE);
  const userId = interaction.user.id;

  const user = users.find(u => u.id === userId);

  if (!user || !user.cards || user.cards.length === 0) {
    await interaction.editReply("You have no players to sell!");
    return;
  }

  const ownedPlayers = players.filter(p => user.cards.includes(p.id));
  let totalValue = 0;

  for (const player of ownedPlayers) {
    const sellValue = Math.floor(player.rating * 80);
    totalValue += sellValue;
  }

  // clear cards
  user.cards = [];
  // also clear starters
  user.starters = [];

  // add coins
  user.coins = (user.coins || 0) + totalValue;

  saveJSON(USERS_FILE, users);

  const embed = new EmbedBuilder()
    .setTitle("💰 Sell All Players")
    .setDescription(
      `You sold all your players for **${totalValue.toLocaleString()} coins!**\nYour starters have been reset.`
    )
    .setColor("#FFD700")
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
