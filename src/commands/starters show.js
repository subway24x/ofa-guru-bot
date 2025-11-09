import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fs from "fs";

const USERS_FILE = "./src/data/users.json";
const PLAYERS_FILE = "./src/data/players.json";

export const data = new SlashCommandBuilder()
  .setName("starters-show")
  .setDescription("View your current starting lineup.");

export async function execute(interaction) {
  await interaction.deferReply();

  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  const players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));
  const user = users.find(u => u.id === interaction.user.id);

  if (!user || !user.starters || user.starters.length === 0) {
    await interaction.editReply("You don’t have any starters yet. Use `/starters-add` to set them.");
    return;
  }

  const starters = players.filter(p => user.starters.includes(p.id));

  // group by role
  const groups = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: []
  };

  for (const p of starters) {
    if (p.position.startsWith("GK")) groups.GK.push(p);
    else if (["CB", "LB", "RB", "LWB", "RWB"].includes(p.position)) groups.DEF.push(p);
    else if (["CM", "CDM", "CAM", "RM", "LM"].includes(p.position)) groups.MID.push(p);
    else groups.FWD.push(p);
  }

  const format = arr =>
    arr.map(p => `**${p.position}** ${p.username} — ${p.rating}`).join("\n") || "_None_";

  const embed = new EmbedBuilder()
    .setTitle(`${interaction.user.username}'s Starters`)
    .addFields(
      { name: "GK", value: format(groups.GK), inline: false },
      { name: "Defenders", value: format(groups.DEF), inline: false },
      { name: "Midfielders", value: format(groups.MID), inline: false },
      { name: "Forwards", value: format(groups.FWD), inline: false }
    )
    .setColor("#2b2d31")
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
