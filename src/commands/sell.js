import { SlashCommandBuilder } from "discord.js";
import fs from "fs";

const USERS_FILE = "./src/data/users.json";
const PLAYERS_FILE = "./src/data/players.json";

export const data = new SlashCommandBuilder()
  .setName("sell")
  .setDescription("Sell one of your owned players.")
  .addStringOption(option =>
    option
      .setName("player")
      .setDescription("Select a player to sell")
      .setAutocomplete(true)
      .setRequired(true)
  );

export async function execute(interaction) {
  const playerName = interaction.options.getString("player");
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  const players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));

  const user = users.find(u => u.id === interaction.user.id);
  if (!user) {
    await interaction.reply("❌ You don’t have any players yet. Use `/claim` first.");
    return;
  }

  const player = players.find(p => p.username.toLowerCase() === playerName.toLowerCase());
  if (!player) {
    await interaction.reply("❌ Player not found.");
    return;
  }

  if (!user.cards.includes(player.id)) {
    await interaction.reply("❌ You don’t own this player.");
    return;
  }

  const sellValue = calculateSellValue(player.rating, player.rarity);

  // Remove from club
  user.cards = user.cards.filter(id => id !== player.id);

  // Remove from starters if they’re in it
  if (user.starters && user.starters.includes(player.id)) {
    user.starters = user.starters.filter(id => id !== player.id);
  }

  // Add coins
  user.coins = (user.coins || 0) + sellValue;

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  await interaction.reply(
    `💸 You sold **${player.username} (${player.position})** (${player.rating} • ${player.rarity.toUpperCase()}) for **$${formatNumber(sellValue)}**!\n` +
    `They have been removed from your club and starters.`
  );
}

export async function autocomplete(interaction) {
  const focusedValue = interaction.options.getFocused();
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  const players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));

  const user = users.find(u => u.id === interaction.user.id);
  if (!user || !user.cards || user.cards.length === 0) {
    await interaction.respond([]);
    return;
  }

  const ownedPlayers = players.filter(p => user.cards.includes(p.id));
  const filtered = ownedPlayers.filter(p =>
    p.username.toLowerCase().includes(focusedValue.toLowerCase())
  );

  await interaction.respond(
    filtered.slice(0, 25).map(p => ({
      name: `${p.username} (${p.position}) • ${p.rating} ${p.rarity.toUpperCase()}`,
      value: p.username
    }))
  );
}

// Helper functions
function calculateSellValue(rating, rarity) {
  let base;
  switch (rarity.toLowerCase()) {
    case "gold": base = 100_000; break;
    case "silver": base = 10_000; break;
    case "bronze": base = 1_000; break;
    default: base = 5_000;
  }
  const value = base * Math.pow(1.15, rating - 60);
  return Math.floor(value * (0.2 + Math.random() * 0.15));
}

function formatNumber(num) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
