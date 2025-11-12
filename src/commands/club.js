import fs from "fs";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("club")
    .setDescription("View all players in your club."),

  async execute(interaction) {
    const users = JSON.parse(fs.readFileSync("./src/data/users.json", "utf-8"));
    const user = users.find(u => u.id === interaction.user.id);

    if (!user || user.cards.length === 0) {
      await interaction.reply({ content: "You have no players in your club! Use /claim first.", ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.user.username}'s Club`)
      .setDescription(user.cards.map(id => `• **${id}**`).join("\n"))
      .setColor(0x00ff88);

    await interaction.reply({ embeds: [embed] });
  }
};
