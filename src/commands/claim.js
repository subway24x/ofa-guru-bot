import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from "discord.js";
import fs from "fs";

export const data = new SlashCommandBuilder()
  .setName("claim")
  .setDescription("Claim a random player card!");

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const players = JSON.parse(fs.readFileSync("./src/data/players.json", "utf8"));
    const users = JSON.parse(fs.readFileSync("./src/data/users.json", "utf8"));

    const player = players[Math.floor(Math.random() * players.length)];

    // Ensure user exists
    let user = users.find(u => u.id === interaction.user.id);
    if (!user) {
      user = { id: interaction.user.id, username: interaction.user.username, coins: 0, cards: [] };
      users.push(user);
    }

    // Check if user already owns card
    const alreadyOwns = user.cards.includes(player.id);
    const value = calculateValue(player.rating, player.rarity);
    const sellValue = Math.floor(value * (Math.random() * 0.2 + 0.15));

    let description, title;

    if (alreadyOwns) {
      // Duplicate reward
      user.coins += sellValue;
      title = `Duplicate! ${player.username} sold automatically 💰`;
      description = `You already own **${player.username}**, so it sold for **$${formatNumber(sellValue)}**.`;
    } else {
      user.cards.push(player.id);
      description = `**Value:** 💰 $${formatNumber(value)}\n**Sells for:** 💵 $${formatNumber(sellValue)}`;
      title = `${player.username} joins your club!`;
    }

    fs.writeFileSync("./src/data/users.json", JSON.stringify(users, null, 2));

    const cardImage = new AttachmentBuilder(`./assets/cards/${player.image}`);
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(
        player.rarity === "gold"
          ? 0xffd700
          : player.rarity === "silver"
          ? 0xc0c0c0
          : 0xcd7f32
      )
      .setImage(`attachment://${player.image}`)
      .setFooter({ text: `${player.rarity.toUpperCase()} • ${player.rating} RATED` });

    await interaction.editReply({ embeds: [embed], files: [cardImage] });
  } catch (err) {
    console.error("Error in /claim:", err);
    await interaction.editReply("❌ Something went wrong while claiming your card.");
  }
}

function calculateValue(rating, rarity) {
  let base;
  switch (rarity.toLowerCase()) {
    case "gold": base = 100_000; break;
    case "silver": base = 10_000; break;
    case "bronze": base = 1_000; break;
    default: base = 5_000;
  }
  const value = base * Math.pow(1.15, rating - 60);
  return Math.floor(value * (0.9 + Math.random() * 0.2));
}

function formatNumber(num) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
