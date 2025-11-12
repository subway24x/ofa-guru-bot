import fs from "fs";
import { EmbedBuilder } from "discord.js";

const players = JSON.parse(fs.readFileSync("./src/data/players.json", "utf-8"));

// Weighted rarities (optional but recommended)
const rarityWeights = {
  bronze: 40,
  silver: 25,
  gold: 20,
  totw: 7,
  toty: 5,
  icon: 2
};

function getWeightedRandomRarity() {
  const total = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (const [rarity, weight] of Object.entries(rarityWeights)) {
    if (random < weight) return rarity;
    random -= weight;
  }
}

export default {
  data: {
    name: "claim",
    description: "Claim a random player card!"
  },
  async execute(interaction) {
    const chosenRarity = getWeightedRandomRarity();

    // Find all cards across all players that match rarity
    const possibleCards = players.flatMap((p) =>
      p.cards
        .filter((card) => card.rarity === chosenRarity)
        .map((card) => ({ ...card, username: p.username, position: p.position }))
    );

    // Pick one at random
    const player = possibleCards[Math.floor(Math.random() * possibleCards.length)];

    const rarityColors = {
      bronze: 0x8c7853,
      silver: 0xc0c0c0,
      gold: 0xffd700,
      tots: 0x1e90ff,
      toty: 0x00bfff,
      icon: 0xffffff
    };

    // Calculate coin value (adjust to your system)
    const baseValue = Math.floor(Math.random() * 250000 + 50000);
    const multipliers = {
      bronze: 1,
      silver: 1.5,
      gold: 2.5,
      tots: 4,
      toty: 5,
      icon: 6
    };
    const value = Math.floor(baseValue * (multipliers[player.rarity] || 1));
    const sellValue = Math.floor(value * 0.7);

    const embed = new EmbedBuilder()
      .setTitle(`${player.username} joins your club!`)
      .setDescription(
        `⭐ ${player.rarity.toUpperCase()} CARD\n` +
          `🏷️ Position: **${player.position}**\n` +
          `💪 Rating: **${player.rating}**\n\n` +
          `💰 Value: **${value.toLocaleString()} coins**\n` +
          `🪙 Sells for: **${sellValue.toLocaleString()} coins**`
      )
      .setColor(rarityColors[player.rarity] || 0xffffff)
      .setThumbnail(`attachment://${player.image}`);

    await interaction.reply({ embeds: [embed] });
  }
};
