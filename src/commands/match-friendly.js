import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import fs from "fs";

const USERS_FILE = "./src/data/users.json";
const PLAYERS_FILE = "./src/data/players.json";

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

export const data = new SlashCommandBuilder()
  .setName("match-friendly")
  .setDescription("Simulate a PRS-style friendly match between two managers.")
  .addUserOption((opt) =>
    opt.setName("opponent").setDescription("Opponent manager").setRequired(true)
  );

export async function execute(interaction) {
  const homeUser = interaction.user;
  const awayUser = interaction.options.getUser("opponent");

  if (homeUser.id === awayUser.id)
    return interaction.reply({
      content: "❌ You can’t play a match against yourself!",
      ephemeral: true,
    });

  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  const players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));

  const home = users.find((u) => u.id === homeUser.id);
  const away = users.find((u) => u.id === awayUser.id);

  if (!home || !home.cards || home.cards.length === 0)
    return interaction.reply({
      content: `⚠️ ${homeUser.username} has no players.`,
      ephemeral: true,
    });
  if (!away || !away.cards || away.cards.length === 0)
    return interaction.reply({
      content: `⚠️ ${awayUser.username} has no players.`,
      ephemeral: true,
    });

  const getPlayer = (id) => players.find((p) => p.id === id);
  const homeSquad = home.cards.map(getPlayer).filter(Boolean);
  const awaySquad = away.cards.map(getPlayer).filter(Boolean);

  // find GK (prefer actual GK position)
  const homeGK =
    homeSquad.find((p) => p.position === "GK") ||
    homeSquad[randomBetween(0, homeSquad.length - 1)];
  const awayGK =
    awaySquad.find((p) => p.position === "GK") ||
    awaySquad[randomBetween(0, awaySquad.length - 1)];

  // events stored as objects for safe rendering
  const homeEvents = []; // { minute, type, text }
  const awayEvents = [];
  const homeGoals = [];
  const awayGoals = [];

  let minute = 0;

  const embedBase = new EmbedBuilder()
    .setColor("#2b2d31")
    .setTitle(`🔵 ${homeUser.username} 0–0 ${awayUser.username} 🟢`)
    .setDescription("Status: *Kickoff!*")
    .setFooter({ text: "Friendly Match Simulation" });

  await interaction.reply({ embeds: [embedBase] });
  const msg = await interaction.fetchReply();

  // Simulation loop (1 second = 1 minute)
  for (minute = 1; minute <= 90; minute++) {
    const chance = Math.random();

    // Halftime moment
    if (minute === 45) {
      // push a marker (handled in renderer as single shared HT line)
      homeEvents.push({ minute, type: "HT" });
      awayEvents.push({ minute, type: "HT" });
      await render(false);
      await sleep(1500);
      continue;
    }

    // Goal chance ( ~6% )
    if (chance < 0.06) {
      const isHome = Math.random() < 0.5;
      const squad = isHome ? homeSquad : awaySquad;
      const scorer = squad[randomBetween(0, squad.length - 1)];
      const obj = { minute, type: "goal", text: `${minute}' ⚽ ${scorer.username}` };
      if (isHome) {
        homeEvents.push(obj);
        homeGoals.push({ scorer: scorer.username, minute });
      } else {
        awayEvents.push(obj);
        awayGoals.push({ scorer: scorer.username, minute });
      }
    }
    // GK Save (~7%)
    else if (chance < 0.13) {
      const isHomeSave = Math.random() < 0.5;
      if (isHomeSave) {
        homeEvents.push({ minute, type: "save", text: `${minute}' 🧤 Save by ${homeGK.username}` });
      } else {
        awayEvents.push({ minute, type: "save", text: `${minute}' 🧤 Save by ${awayGK.username}` });
      }
    }
    // Yellow (~3%)
    else if (chance < 0.16) {
      const isHome = Math.random() < 0.5;
      const squad = isHome ? homeSquad : awaySquad;
      const player = squad[randomBetween(0, squad.length - 1)];
      const obj = { minute, type: "yellow", text: `${minute}' 🟨 ${player.username}` };
      if (isHome) homeEvents.push(obj);
      else awayEvents.push(obj);
    }
    // Red (~1%)
    else if (chance < 0.17) {
      const isHome = Math.random() < 0.5;
      const squad = isHome ? homeSquad : awaySquad;
      const player = squad[randomBetween(0, squad.length - 1)];
      const obj = { minute, type: "red", text: `${minute}' 🟥 ${player.username}` };
      if (isHome) homeEvents.push(obj);
      else awayEvents.push(obj);
    }

    // periodic update
    if (minute % 4 === 0 || chance < 0.1) {
      await render(false);
    }

    await sleep(1000);
  }

  // Full time - push FT marker to both sides
  homeEvents.push({ minute: 90, type: "FT" });
  awayEvents.push({ minute: 90, type: "FT" });
  await render(true);

  // ---- renderer ----
   async function render(final = false) {
    const shorten = (name = "") => {
      if (name.length > 15) return name.slice(0, 6) + "…";
      return name;
    };

    const formatEvent = (event) => {
      if (!event) return "";
      const minute = `${event.minute}'`;
      if (event.type === "goal") return `${minute} ⚽ ${shorten(event.text.split("⚽ ")[1] || "")}`;
      if (event.type === "save") return `${minute} 🧤 ${shorten(event.text.split("Save by ")[1] || "")}`;
      if (event.type === "yellow") return `${minute} 🟨 ${shorten(event.text.split("🟨 ")[1] || "")}`;
      if (event.type === "red") return `${minute} 🟥 ${shorten(event.text.split("🟥 ")[1] || "")}`;
      return `${minute} ${shorten(event.text)}`;
    };

    const leftColWidth = 30; // make wider to even out spacing
    const rightIndent = 5;   // fixed indentation for away column

    const padLeft = (s = "") => {
      const truncated = s.length > leftColWidth ? s.slice(0, leftColWidth - 1) + "…" : s;
      return truncated.padEnd(leftColWidth, " ");
    };

    const padRight = (s = "") => {
      const truncated = s.length > 25 ? s.slice(0, 24) + "…" : s;
      return " ".repeat(rightIndent) + truncated;
    };

    const splitHalf = (events) => ({
      first: events.filter((e) => e.minute <= 45 && e.type !== "FT"),
      second: events.filter((e) => e.minute > 45 && e.type !== "FT"),
    });

    const homeSplit = splitHalf(homeEvents);
    const awaySplit = splitHalf(awayEvents);

    const maxFirst = Math.max(homeSplit.first.length, awaySplit.first.length);
    const maxSecond = Math.max(homeSplit.second.length, awaySplit.second.length);

    const lines = [];
    const header =
      `Home: ${homeUser.username}`.padEnd(leftColWidth + rightIndent, " ") +
      `Away: ${awayUser.username}`;
    lines.push(header);
    lines.push("");

    // first half
    for (let i = 0; i < maxFirst; i++) {
      const left = padLeft(formatEvent(homeSplit.first[i]));
      const right = padRight(formatEvent(awaySplit.first[i]));
      lines.push(`${left}${right}`);
    }

    lines.push("");
    lines.push("───────────────────────  HT  ───────────────────────");
    lines.push("");

    // second half
    for (let i = 0; i < maxSecond; i++) {
      const left = padLeft(formatEvent(homeSplit.second[i]));
      const right = padRight(formatEvent(awaySplit.second[i]));
      lines.push(`${left}${right}`);
    }

    if (final) {
      lines.push("");
      lines.push("───────────────────────  FT  ───────────────────────");
    }

    const score = `${homeGoals.length}–${awayGoals.length}`;
    const title = final
      ? `🔵 ${homeUser.username} ${score} ${awayUser.username} 🟢`
      : `🔵 ${homeUser.username} ${homeGoals.length}–${awayGoals.length} ${awayUser.username} 🟢`;
    const desc = final ? "Status: *Full Time*" : `Status: *${minute}'*`;

    const code = "```" + lines.join("\n") + "```";

    const newEmbed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle(title)
      .setDescription(desc)
      .addFields([
        {
          name: "Match Events",
          value: code,
        },
      ])
      .setFooter({ text: final ? "⚽ Match ended" : "Friendly Match Simulation" });

    await msg.edit({ embeds: [newEmbed] });
  }


}
