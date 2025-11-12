import fs from "fs";
import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("sellall")
    .setDescription("Sell all your cards at once."),

  async execute(interaction) {
    const users = JSON.parse(fs.readFileSync("./src/data/users.json", "utf-8"));
    const user = users.find(u => u.id === interaction.user.id);

    if (!user || user.cards.length === 0) {
      await interaction.reply({ content: "❌ You have no cards to sell.", ephemeral: true });
      return;
    }

    const soldCount = user.cards.length;
    const earned = soldCount * 50000;

    user.cards = [];
    user.coins += earned;

    fs.writeFileSync("./src/data/users.json", JSON.stringify(users, null, 2));
    await interaction.reply(`💰 You sold **${soldCount} cards** for **${earned.toLocaleString()} coins!**`);
  }
};
