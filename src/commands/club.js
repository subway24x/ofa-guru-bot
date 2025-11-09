import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fs from "fs";

const PLAYER_FILE = "./src/data/players.json";
const USERS_FILE = "./src/data/users.json";

function loadJSON(path) {
  if (!fs.existsSync(path)) return [];
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

export const data = new SlashCommandBuilder()
  .setName("club")
  .setDescription("View all the players in your club!");

export async function execute(interaction) {
  await interaction.deferReply();

  const players = loadJSON(PLAYER_FILE);
  const users = loadJSON(USERS_FILE);
  const userId = interaction.user.id;

  const user = users.find(u => u.id === userId);

  if (!user || !user.cards || user.cards.length === 0) {
    await interaction.editReply("You don't have any players in your club yet! Use `/claim` to get some.");
    return;
  }

  const clubPlayers = players.filter(p => user.cards.includes(p.id));
  if (clubPlayers.length === 0) {
    await interaction.editReply("Your club seems empty or your saved players are missing from the database.");
    return;
  }

  // group players by role
  const groups = {
    GKS: [],
    DEFENDERS: [],
    MIDFIELDERS: [],
    STRIKERS: []
  };

  for (const p of clubPlayers) {
    if (["GK"].includes(p.position)) groups.GKS.push(p);
    else if (["CB", "LB", "RB", "LWB", "RWB"].includes(p.position)) groups.DEFENDERS.push(p);
    else if (["CDM", "CM", "CAM", "RM", "LM"].includes(p.position)) groups.MIDFIELDERS.push(p);
    else groups.STRIKERS.push(p);
  }

  // build sections
  const makeSection = (title, arr) =>
    arr.length > 0
      ? `**${title}**\n${arr.map(p => `${p.username} — ${p.position} (${p.rating} • ${p.rarity.toUpperCase()})`).join("\n")}\n`
      : "";

  const description = [
    makeSection("GKS", groups.GKS),
    makeSection("DEFENDERS", groups.DEFENDERS),
    makeSection("MIDFIELDERS", groups.MIDFIELDERS),
    makeSection("STRIKERS", groups.STRIKERS)
  ].filter(Boolean).join("\n");

  const embed = new EmbedBuilder()
    .setTitle(`${interaction.user.username}'s Club`)
    .setDescription(description)
    .setColor("#2b2d31")
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
