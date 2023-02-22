import { capitalize, DiscordRequest } from './utils.js';

export async function HasGuildCommands(appId, commands, options = {}) {
  if (appId === '') return;

  // GET guilds
  const guilds = await GetGuilds(appId);
  guilds.forEach(async (guild) => {
    // GET commands
    commands.forEach(async (command) => {
      await HasGuildCommand(appId, guild['id'], command, guild['name'], options.patch);
    });
  });
}

// Gets all guilds the bot is in
async function GetGuilds() {
  // API endpoint to get guilds
  const endpoint = 'users/@me/guilds';
  const res = await DiscordRequest(endpoint, { method: 'GET' });
  return await res.json();
}

// Checks for a command
async function HasGuildCommand(appId, guildId, command, guildName = "", patch) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const data = await res.json();

    if (data) {
      const installedNames = data.map((c) => c['name']);
      // This is just matching on the name, so it's not good for updates
      if (!installedNames.includes(command['name'])) {
        console.log(`Installing "${command['name']}" command in ${guildName}`);
        InstallGuildCommand(appId, guildId, command);
      } else if (patch) {
        const commandId = data.find((c) => c['name'] === command['name'])['id'];
        PatchGuildCommand(appId, guildId, command, commandId);
        console.log(`"${command['name']}" command is being patched in ${guildName}`);
      } else {
        console.log(`"${command['name']}" command already installed in ${guildName}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// Installs a command
export async function InstallGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  // install command
  try {
    await DiscordRequest(endpoint, { method: 'POST', body: command });
  } catch (err) {
    console.error(err);
  }
}

// Patches a command
export async function PatchGuildCommand(appId, guildId, command, commandId) {
  // API endpoint to patch guild command
  const endpoint = `applications/${appId}/guilds/${guildId}/commands/${commandId}`;

  // install command
  try {
    await DiscordRequest(endpoint, { method: 'PATCH', body: command });
  } catch (err) {
    console.error(err);
  }
}


// Installs a command
export async function DeleteAllCommands(appId, guildId) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  // Delete commands
  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const data = await res.json();

    if (data) {
      for (let command of data) {
        await DiscordRequest(
          endpoint + `/${command['id']}`,
          { method: 'DELETE' }
        );
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// Command handlers
const PLAY_COMMAND = {
  name: 'mastermind',
  description: 'Play a game of mastermind',
  options: [
    {
      type: 3,
      name: 'difficulity',
      description: 'Pick your difficulty',
      required: false,
      choices: [
        {
          name: 'Kids',
          value: 'kids',
        },
        {
          name: 'Easy',
          value: 'easy',
        },
        {
          name: 'Medium',
          value: 'medium',
        },
        {
          name: 'Hard',
          value: 'hard',
        },
        {
          name: 'Impossible',
          value: 'impossible',
        },
      ],
    },
    {
      type: 4,
      name: 'length',
      description: 'Pick your length',
      required: false,
    }
  ],
  type: 1,
};

const GUESS_COMMAND = {
  name: 'guess',
  description: 'Guess the word',
  options: [
    {
      type: 3,
      name: 'word',
      description: 'Guess the word',
      required: true,
    },
  ],
  type: 1,
};

const STATUS_COMMAND = {
  name: 'status',
  description: 'Get the status of the game',
  type: 1,
};

const LEAVE_COMMAND = {
  name: 'leave',
  description: 'Leave the game',
  type: 1,
};

const HOWTO_COMMAND = {
  name: 'howtoplay',
  description: 'Get info about how to play mastermind',
  type: 1,
};

const INFO_COMMAND = {
  name: 'info',
  description: 'Get info about the bot',
  type: 1,
};

const HELP_COMMAND = {
  name: 'help',
  description: 'Get list of commands',
  type: 1,
};

export const COMMANDS = [
  PLAY_COMMAND,
  GUESS_COMMAND,
  STATUS_COMMAND,
  LEAVE_COMMAND,
  HOWTO_COMMAND,
  INFO_COMMAND,
  HELP_COMMAND,
];
