import fs from "fs";
import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Sell one of your cards by ID.")
    .addStringOption(opt =>
      opt.setName("id")
        .setDescription("Card ID to sell (e.g., 3b)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const cardId = interaction.options.getString("id");
    const users = JSON.parse(fs.readFileSync("./src/data/users.json", "utf-8"));
    const user = users.find(u => u.id === interaction.user.id);

    if (!user || !user.cards.includes(cardId)) {
      await interaction.reply({ content: "❌ You don’t own that card.", ephemeral: true });
      return;
    }

    user.cards = user.cards.filter(id => id !== cardId);
    user.coins += 50000; // placeholder value, you can calculate dynamically

    fs.writeFileSync("./src/data/users.json", JSON.stringify(users, null, 2));
    await interaction.reply(`✅ You sold card **${cardId}** for **50,000 coins!**`);
  }
};
