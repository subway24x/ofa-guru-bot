import fs from "fs";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your current coin balance."),

  async execute(interaction) {
    const users = JSON.parse(fs.readFileSync("./src/data/users.json", "utf-8"));
    const user = users.find(u => u.id === interaction.user.id);

    const coins = user ? user.coins : 0;

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.user.username}'s Balance`)
      .setDescription(`💰 You have **${coins.toLocaleString()}** coins.`)
      .setColor(0xf1c40f);

    await interaction.reply({ embeds: [embed] });
  }
};
