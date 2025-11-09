import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} from "discord.js";
import fs from "fs";

const PLAYERS_FILE = "./src/data/players.json";
const CACHE_FILE = "./src/data/cache.json";

function calcValue(rating, rarity) {
  const base =
    rarity === "gold" ? 100_000 : rarity === "silver" ? 10_000 : 1_000;
  return Math.floor(base * Math.pow(1.15, rating - 60));
}

export const data = new SlashCommandBuilder()
  .setName("transfer-list")
  .setDescription("Browse all available players on the market.");

export async function execute(interaction) {
  await interaction.deferReply();

  const players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  const list = players
    .map((p) => ({ ...p, price: calcValue(p.rating, p.rarity) }))
    .sort((a, b) => b.rating - a.rating);

  const perPage = 5;
  let page = 0;
  const totalPages = Math.ceil(list.length / perPage);

  const buildPage = () => {
    const slice = list.slice(page * perPage, page * perPage + perPage);

    const embed = new EmbedBuilder()
      .setTitle("Database Search Results")
      .setDescription(
        slice
          .map(
            (p) =>
              `**${p.username} • ${p.rating} (${p.position} • ${p.rarity.toUpperCase()})**\n💰 **${p.price.toLocaleString()}** coins`
          )
          .join("\n\n")
      )
      .setColor("#2b2d31")
      .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("first").setEmoji("⏮️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("prev").setEmoji("◀️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("next").setEmoji("▶️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("last").setEmoji("⏭️").setStyle(ButtonStyle.Secondary)
    );

    // ✅ Update cache (store user page)
    const existing = cache.find((c) => c.id === interaction.user.id);
    if (existing) existing.page = page;
    else cache.push({ id: interaction.user.id, page });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

    return { embed, row };
  };

  let { embed, row } = buildPage();
  const msg = await interaction.editReply({ embeds: [embed], components: [row] });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120_000,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== interaction.user.id)
      return i.reply({ content: "This isn’t your market view.", ephemeral: true });

    if (i.customId === "next" && page < totalPages - 1) page++;
    if (i.customId === "prev" && page > 0) page--;
    if (i.customId === "first") page = 0;
    if (i.customId === "last") page = totalPages - 1;

    const built = buildPage();
    await i.update({ embeds: [built.embed], components: [built.row] });
  });

  collector.on("end", async () => msg.edit({ components: [] }));
}
