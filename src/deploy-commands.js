import "dotenv/config";
import { REST, Routes } from "discord.js";
import fs from "fs";

const commands = [];
const commandFiles = fs.readdirSync("./src/commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const { data } = await import(`./commands/${file}`);
  commands.push(data.toJSON());
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
  console.error(error);
}
