import { SlashCommandBuilder } from "discord.js";
import fs from "fs";

const USERS_FILE = "./src/data/users.json";
const PLAYERS_FILE = "./src/data/players.json";

export const data = new SlashCommandBuilder()
  .setName("starters-add")
  .setDescription("Add an owned player to your starting lineup.")
  .addStringOption(option =>
    option
      .setName("player")
      .setDescription("Select a player to add")
      .setAutocomplete(true)
      .setRequired(true)
  );

export async function execute(interaction) {
  const playerName = interaction.options.getString("player");

  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  const players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));

  const user = users.find(u => u.id === interaction.user.id);
  if (!user) {
    await interaction.reply("❌ You don’t have a club yet. Use `/claim` first.");
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

  if (!user.starters) user.starters = [];
  if (user.starters.includes(player.id)) {
    await interaction.reply("⚠️ That player is already in your starters.");
    return;
  }

  user.starters.push(player.id);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  await interaction.reply(`✅ Added **${player.username} (${player.position})** to your starters!`);
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

  // show only owned players not already in starters
  const ownedPlayers = players.filter(
    p => user.cards.includes(p.id) && (!user.starters || !user.starters.includes(p.id))
  );

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
