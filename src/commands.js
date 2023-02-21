import { capitalize, DiscordRequest } from './utils.js';

export async function HasGuildCommands(appId, guildId, commands) {
  if (guildId === '' || appId === '') return;

  commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

// Checks for a command
async function HasGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const data = await res.json();

    if (data) {
      const installedNames = data.map((c) => c['name']);
      // This is just matching on the name, so it's not good for updates
      if (!installedNames.includes(command['name'])) {
        console.log(`Installing "${command['name']}"`);
        InstallGuildCommand(appId, guildId, command);
      } else {
        console.log(`"${command['name']}" command already installed`);
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

// Simple test command
export const PLAY_COMMAND = {
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
    },
    {
      type: 5,
      name: 'random',
      description: 'Let the bot pick a random word',
      required: false,
    }
  ],
  type: 1,
};

export const GUESS_COMMAND = {
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

export const LEAVE_COMMAND = {
  name: 'leave',
  description: 'Leave the game',
  type: 1,
};

export const HOWTO_COMMAND = {
  name: 'howtoplay',
  description: 'Get info about how to play mastermind',
  type: 1,
};

export const INFO_COMMAND = {
  name: 'info',
  description: 'Get info about the bot',
  type: 1,
};
