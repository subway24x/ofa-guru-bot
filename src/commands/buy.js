import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import fs from "fs";

const PLAYERS_FILE = "./src/data/players.json";
const USERS_FILE = "./src/data/users.json";
const CACHE_FILE = "./src/data/cache.json";

function calcValue(rating, rarity) {
  const base =
    rarity === "gold" ? 100_000 : rarity === "silver" ? 10_000 : 1_000;
  return Math.floor(base * Math.pow(1.15, rating - 60));
}

export const data = new SlashCommandBuilder()
  .setName("buy")
  .setDescription("Buy a player from your current transfer list page.")
  .addStringOption((option) =>
    option
      .setName("player")
      .setDescription("Select a player to buy")
      .setAutocomplete(true)
      .setRequired(true)
  );

export async function autocomplete(interaction) {
  const players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  const userCache = cache.find((c) => c.id === interaction.user.id);
  const page = userCache ? userCache.page : 0;
  const perPage = 5;

  const slice = players
    .map((p) => ({ ...p, price: calcValue(p.rating, p.rarity) }))
    .sort((a, b) => b.rating - a.rating)
    .slice(page * perPage, page * perPage + perPage);

  const list = slice.map((p) => ({
    name: `${p.username} (${p.position} • ${p.rarity.toUpperCase()}) • ${p.price.toLocaleString()} coins`,
    value: p.id.toString(),
  }));

  await interaction.respond(list);
}

export async function execute(interaction) {
  const playerId = parseInt(interaction.options.getString("player"));
  const players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  const player = players.find((p) => p.id === playerId);
  if (!player)
    return interaction.reply({ content: "❌ Player not found.", ephemeral: true });

  const price = calcValue(player.rating, player.rarity);
  let user = users.find((u) => u.id === interaction.user.id);
  if (!user) {
    user = { id: interaction.user.id, username: interaction.user.username, coins: 500000, cards: [] };
    users.push(user);
  }

  if (user.cards.includes(player.id))
    return interaction.reply({ content: "⚠️ You already own this player.", ephemeral: true });
  if (user.coins < price)
    return interaction.reply({
      content: `💸 You need **${price.toLocaleString()}** coins but only have **${user.coins.toLocaleString()}**.`,
      ephemeral: true,
    });

  user.coins -= price;
  user.cards.push(player.id);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  const embed = new EmbedBuilder()
    .setColor("#00B869")
    .setTitle("✅ Purchase Successful")
    .setDescription(
      `You bought **${player.username} (${player.position} • ${player.rarity.toUpperCase()})** for **${price.toLocaleString()}** coins!\n\n💰 New balance: **${user.coins.toLocaleString()} coins**`
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
