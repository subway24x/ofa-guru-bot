import { Client, GatewayIntentBits, Collection } from "discord.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection();

// Load commands dynamically
const commandsPath = path.join(process.cwd(), "src", "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(
      `[⚠️] The command at ${filePath} is missing "data" or "execute".`
    );
  }
}

// Handle all interactions (commands + autocomplete)
client.on("interactionCreate", async interaction => {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);
    }

    // Handle autocomplete
    else if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;

      await command.autocomplete(interaction);
    }
  } catch (error) {
    console.error("❌ Interaction error:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error executing that command.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error executing that command.",
        ephemeral: true,
      });
    }
  }
});

// Log when ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
