import { SlashCommandBuilder } from "discord.js";
import fs from "fs";

const USERS_FILE = "./src/data/users.json";
const PLAYERS_FILE = "./src/data/players.json";

export const data = new SlashCommandBuilder()
  .setName("starters-remove")
  .setDescription("Remove a player from your starting lineup.")
  .addStringOption(option =>
    option
      .setName("player")
      .setDescription("Select a starter to remove")
      .setAutocomplete(true)
      .setRequired(true)
  );

export async function execute(interaction) {
  const playerName = interaction.options.getString("player");

  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  const players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));

  const user = users.find(u => u.id === interaction.user.id);
  if (!user || !user.starters || user.starters.length === 0) {
    await interaction.reply("❌ You have no starters set.");
    return;
  }

  const player = players.find(p => p.username.toLowerCase() === playerName.toLowerCase());
  if (!player) {
    await interaction.reply("❌ Player not found.");
    return;
  }

  if (!user.starters.includes(player.id)) {
    await interaction.reply("❌ That player isn’t in your starters.");
    return;
  }

  user.starters = user.starters.filter(id => id !== player.id);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  await interaction.reply(`✅ Removed **${player.username}** from your starters.`);
}

export async function autocomplete(interaction) {
  const focusedValue = interaction.options.getFocused();
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  const players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));

  const user = users.find(u => u.id === interaction.user.id);
  if (!user || !user.starters || user.starters.length === 0) {
    await interaction.respond([]);
    return;
  }

  const starterPlayers = players.filter(p => user.starters.includes(p.id));

  const filtered = starterPlayers.filter(p =>
    p.username.toLowerCase().includes(focusedValue.toLowerCase())
  );

  await interaction.respond(
    filtered.slice(0, 25).map(p => ({
      name: `${p.username} (${p.position}) • ${p.rating} ${p.rarity.toUpperCase()}`,
      value: p.username
    }))
  );
}
