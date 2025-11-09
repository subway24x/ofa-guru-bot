import { SlashCommandBuilder } from "discord.js";
import fs from "fs";

export const data = new SlashCommandBuilder()
  .setName("balance")
  .setDescription("Check your coins and owned cards.");

export async function execute(interaction) {
  const users = JSON.parse(fs.readFileSync("./src/data/users.json", "utf8"));
  const user = users.find(u => u.id === interaction.user.id);

  if (!user) {
    await interaction.reply("❌ You don’t have any balance yet. Try `/claim` first!");
    return;
  }

  await interaction.reply(
    `💰 **Coins:** $${user.coins.toLocaleString()}\n🃏 **Owned Cards:** ${user.cards.length}`
  );
}
