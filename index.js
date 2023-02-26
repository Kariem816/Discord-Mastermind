import 'dotenv/config';
import express from 'express';
import {
    InteractionType,
    InteractionResponseType,
    InteractionResponseFlags,
    MessageComponentTypes,
    ButtonStyleTypes,
} from 'discord-interactions';
import { VerifyDiscordRequest, getRandomEmoji, DiscordRequest } from './src/utils.js';
import { getWord, parseGame } from './src/game.js';
import GameController from './src/controllers/game.controller.js';
import {
    COMMANDS,
    HasGuildCommands
} from './src/commands.js';

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

const gameController = new GameController();

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async (req, res) => {
    // Interaction type and data
    const { type, id, data } = req.body;
    const userId = req.body?.member?.user?.id ?? null;

    try {
        if (type === InteractionType.PING) {
            return res.send({ type: InteractionResponseType.PONG });
        }

        if (type === InteractionType.APPLICATION_COMMAND) {
            const { name } = data;

            // "mastermind" guild command
            if (name === 'mastermind') {
                if (await gameController.checkGame(userId)) {
                    throw new Error('You already have an active game');
                }

                const params = data.options || [];
                const options = {};

                params.forEach((param) => {
                    options[param.name] = param.value;
                });

                const word = getWord(options);

                const game = await gameController.newGame(userId, word);

                // Send a message into the channel where command was triggered from
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: `Mastermind game started!\n\n${parseGame(game)}`,
                        components: [
                            {
                                type: MessageComponentTypes.ACTION_ROW,
                                components: [
                                    {
                                        type: MessageComponentTypes.BUTTON,
                                        style: ButtonStyleTypes.PRIMARY,
                                        label: 'Guess',
                                        custom_id: 'start_guess',
                                    },
                                    {
                                        type: MessageComponentTypes.BUTTON,
                                        style: ButtonStyleTypes.DANGER,
                                        label: 'Leave',
                                        custom_id: 'leave_game',
                                    },
                                ],
                            },
                        ],
                    }
                });
            }

            // "guess" guild command
            if (name === 'guess' && id) {
                const params = data.options || [];
                const options = {};

                params.forEach((param) => {
                    options[param.name] = param.value;
                });

                const game = await gameController.getGame(userId);
                if (!game) {
                    throw new Error('You currently have no active games\n\nUse `/mastermind` to start a new game');
                }

                const word = options.word;
                await game.guess(word);

                res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: parseGame(game),
                        components: !game.won ? [
                            {
                                type: MessageComponentTypes.ACTION_ROW,
                                components: [
                                    {
                                        type: MessageComponentTypes.BUTTON,
                                        style: ButtonStyleTypes.PRIMARY,
                                        label: 'Guess',
                                        custom_id: 'start_guess',
                                    },
                                    {
                                        type: MessageComponentTypes.BUTTON,
                                        style: ButtonStyleTypes.DANGER,
                                        label: 'Leave',
                                        custom_id: 'leave_game',
                                    },
                                ],
                            }
                        ] : [],
                    },
                });

                if (game.won) {
                    await gameController.deleteGame(userId);
                }
            }

            // "game-status" guild command
            if (name === 'status' && id) {
                const game = await gameController.getGame(userId);
                if (!game) {
                    throw new Error('You currently have no active games\n\nUse `/mastermind` to start a new game');
                }

                res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: parseGame(game),
                        components: [
                            {
                                type: MessageComponentTypes.ACTION_ROW,
                                components: [
                                    {
                                        type: MessageComponentTypes.BUTTON,
                                        style: ButtonStyleTypes.PRIMARY,
                                        label: 'Guess',
                                        custom_id: 'start_guess',
                                    },
                                    {
                                        type: MessageComponentTypes.BUTTON,
                                        style: ButtonStyleTypes.DANGER,
                                        label: 'Leave',
                                        custom_id: 'leave_game',
                                    },
                                ],
                            }
                        ],
                    },
                });
            }

            // "leave" guild command
            if (name === 'leave' && id) {
                const game = gameController.checkGame(userId);
                if (!game) {
                    throw new Error('You currently have no active games\n\nUse `/mastermind` to start a new game');
                }

                const answer = await gameController.deleteGame(userId);

                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Game successfully ended\n\nThe word was: ' + answer,
                    },
                });
            }

            // "howto" guild command
            if (name === 'howtoplay' && id) {
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    flags: InteractionResponseFlags.EPHEMERAL,
                    data: {
                        content: `
                    **How to play Mastermind**\n\n
                    The goal of the game is to guess the word in as few tries as possible.\n

                    - Commands\n
                    
                    - \`/mastermind\`\n
                    To start a game, use the command \`/mastermind\`.\n
                    Specify the word length or the word difficulty to change the game settings.\n
                    If you don't specify any settings, the game will choose a random word.\n\n

                    - \`/guess\`\n

                    To guess the word, press the button and type the word\n
                    alternatively you can use the command \`/guess\`.\n
                    > note that the command does NOT erase the previous guess and will make your server messy.\n
                    Specify the word you think is the answer.\n
                    You can replace the letters you don't know with spaces of underscores \` _ \`.\n
                    You will get a feedback on your guess.\n
                    - 🟢 means that the letter is in the word and in the right position.\n
                    - 🟡 means that the letter is in the word but in the wrong position.\n
                    - ⚪ means that the letter is not in the word.\n\n

                    - \`/game-status\`\n

                    You can use the \`/game-status\` command to check the current game status.\n\n
                    For example if you lost your original message.\n\n

                    - \`/leave\`\n

                    You can also use the \`/leave\` command to end the game.\n

                    - \`/howtoplay\`\n

                    You can use the \`/howtoplay\` command to get the instructions again.\n\n

                    - \`/info\`\n

                    You can use the \`/info\` command to get the game info.\n\n

                    - \`/help\`\n

                    You can use the \`/help\` command to get the list of commands.\n\n
                    `
                    },
                });
            }

            // "info" guild command
            if (name === 'info' && id) {
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    flags: InteractionResponseFlags.EPHEMERAL,
                    data: {
                        content: "A game by @Bumble#4172\n\nCheck also the website version: https://mastermind-bumble.netlify.app",
                    },
                });
            }

            // "help" guild command
            if (name === 'help' && id) {
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    flags: InteractionResponseFlags.EPHEMERAL,
                    data: {
                        content: `
                    **Commands**\n\n
                    - \`/mastermind\`\n
                    - \`/guess\`\n
                    - \`/game-status\`\n
                    - \`/leave\`\n
                    - \`/howtoplay\`\n
                    - \`/info\`\n
                    - \`/help\`\n
                    `,
                    },
                });
            }
        }

        if (type === InteractionType.MESSAGE_COMPONENT) {
            // custom_id set in payload when sending message component
            const componentId = data.custom_id;

            if (componentId === 'start_guess') {
                const game = await gameController.getGame(userId);
                if (!game) {
                    throw new Error('You currently have no active games\n\nUse `/mastermind` to start a new game');
                }
                const messageId = req.body.message.id;

                return res.send({
                    type: InteractionResponseType.MODAL,
                    data: {
                        custom_id: 'guess_modal_' + messageId,
                        title: 'Guess the word',
                        components: [
                            {
                                // Text inputs must be inside of an action component
                                type: MessageComponentTypes.ACTION_ROW,
                                components: [
                                    {
                                        // See https://discord.com/developers/docs/interactions/message-components#text-inputs-text-input-structure
                                        type: MessageComponentTypes.INPUT_TEXT,
                                        custom_id: 'my_text',
                                        style: 1,
                                        label: 'Enter your guess',
                                        placeholder: 'e.g. ham_da',
                                        max_length: game.wordLen,
                                    },
                                ],
                            }
                        ],
                    },
                })
            } else if (componentId === 'leave_game') {
                const game = await gameController.checkGame(userId);
                if (!game) {
                    throw new Error('You currently have no active games\n\nUse `/mastermind` to start a new game');
                }

                const answer = await gameController.deleteGame(userId);

                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Game successfully ended\n\nThe word was: ' + answer,
                    },
                });
            }
        }

        if (type === InteractionType.MODAL_SUBMIT) {
            const game = await gameController.getGame(userId);
            if (!game) {
                throw new Error('You currently have no active games\n\nUse `/mastermind` to start a new game');
            }

            const messageId = data.custom_id.split('_')[2];
            if (!messageId) {
                gameController.deleteGame(userId);
                throw new Error('Error: Error getting your game');
            }

            const guess = data.components[0].components[0].value;
            const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${messageId}`;

            await game.guess(guess);
            const parsedGame = parseGame(game);

            res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: parsedGame,
                    components: !game.won ? [
                        {
                            type: MessageComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: MessageComponentTypes.BUTTON,
                                    style: ButtonStyleTypes.PRIMARY,
                                    label: 'Guess',
                                    custom_id: 'start_guess',
                                },
                                {
                                    type: MessageComponentTypes.BUTTON,
                                    style: ButtonStyleTypes.DANGER,
                                    label: 'Leave',
                                    custom_id: 'leave_game',
                                },
                            ],
                        }
                    ] : [],
                },
            });
            // Delete previous message
            await DiscordRequest(endpoint, { method: 'DELETE' });
            if (game.won) {
                await gameController.deleteGame(userId);
            }
        }
    } catch (err) {
        console.error(err)
        res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            flags: InteractionResponseFlags.EPHEMERAL,
            data: {
                content: 'Error: ' + err.message,
            },
        });
    }
});

app.listen(PORT, () => {
    console.log('Listening on port', PORT);

    // Check if guild commands from commands.js are installed (if not, install them)
    HasGuildCommands(process.env.APP_ID, COMMANDS, { patch: false });
});
