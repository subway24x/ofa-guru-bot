import fs from "fs";
import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from "discord.js";

const players = JSON.parse(fs.readFileSync("./src/data/players.json", "utf-8"));

const rarityWeights = { bronze: 40, silver: 25, gold: 20, totw: 8, toty: 5, icon: 2 };
const rarityColors = { bronze: 0x8c7853, silver: 0xc0c0c0, gold: 0xffd700, totw: 0x1e90ff, toty: 0x00bfff, icon: 0xffffff };
const rarityMultipliers = { bronze: 1, silver: 1.5, gold: 2.5, totw: 3.5, toty: 5, icon: 6 };

function getWeightedRandomRarity() {
  const total = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (const [rarity, weight] of Object.entries(rarityWeights)) {
    if (random < weight) return rarity;
    random -= weight;
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Claim a random player card!"),

  async execute(interaction) {
    try {
      const chosenRarity = getWeightedRandomRarity();

      const possibleCards = players.flatMap((p) =>
        p.cards.map((card) => ({
          ...card,
          username: p.username,
          position: p.position
        }))
      );

      const filtered = possibleCards.filter(
        (card) => card.rarity.toLowerCase() === chosenRarity.toLowerCase()
      );
      if (filtered.length === 0) {
        await interaction.reply({
          content: "⚠️ No cards found for this rarity in players.json.",
          ephemeral: true
        });
        return;
      }

      const player = filtered[Math.floor(Math.random() * filtered.length)];

      const baseValue = Math.floor(Math.random() * 250000 + 50000);
      const value = Math.floor(baseValue * (rarityMultipliers[player.rarity] || 1));
      const sellValue = Math.floor(value * 0.7);

      const embed = new EmbedBuilder()
        .setTitle(`${player.username} joins your club!`)
        .setDescription(
          `⭐ **${player.rarity.toUpperCase()} CARD**\n` +
          `💪 Rating: **${player.rating}**\n` +
          `🏷️ Position: **${player.position}**\n\n` +
          `💰 Value: **${value.toLocaleString()} coins**\n` +
          `🪙 Sells for: **${sellValue.toLocaleString()} coins**`
        )
        .setColor(rarityColors[player.rarity.toLowerCase()] || 0xffffff)
        .setThumbnail(`attachment://${player.image}`);

      const filePath = `./assets/cards/${player.image}`;
      const files = fs.existsSync(filePath) ? [new AttachmentBuilder(filePath)] : [];

      await interaction.reply({ embeds: [embed], files });
    } catch (err) {
      console.error("❌ Claim command failed:", err);
      await interaction.reply({
        content: "❌ Something went wrong while claiming your card.",
        ephemeral: true
      });
    }
  }
};
