import { REST, Routes } from "discord.js";
import fs from "fs";
import "dotenv/config";

const commands = [];

const foldersPath = "./src/commands";
const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const { default: command } = await import(`./commands/${file}`);
  if (command?.data) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ Skipped ${file}: missing "data" export`);
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

try {
  console.log("🔄 Refreshing slash commands...");
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log("✅ Slash commands registered successfully!");
} catch (error) {
  console.error("❌ Error deploying commands:", error);
}
