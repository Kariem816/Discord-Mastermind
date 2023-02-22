import db from '../db/conn.js';

class Controller {
    constructor() { }

    async newGame(userId, wordObj) {
        const game = new Game(userId, wordObj);
        await db.insertOne(game);
        return game;
    }

    async checkGame(userId) {
        const gamesCount = await db.countDocuments({ userId: userId });
        if (gamesCount === 0) return false;
        return true
    }

    async getGame(userId) {
        const game = await db.findOne({ userId: userId });
        if (!game) return false;
        return Game.shape(game);
    }

    async deleteGame(userId) {
        const { word } = await db.findOne({ userId: userId }, { projection: { word: 1, _id: 0 } });
        await db.deleteOne({ userId: userId });
        return word;
    }
}

class Game {
    constructor(userId, wordObj, options = {
        guessesLeft: 20,
        guesses: [],
        won: false,
    }) {
        this.userId = userId;
        this.word = wordObj.word;
        this.difficulity = wordObj.difficulity;
        this.wordLen = wordObj.length;
        this.wordDashed = wordObj.wordDashed || wordObj.word.split('').map((letter) => '\\_').join(' ');
        this.guesses = options.guesses;
        this.guessesLeft = options.guessesLeft;
        this.won = options.won;
    }

    async guess(word) {
        const regex = /^[a-zA-Z _]+$/;
        if (!regex.test(word)) {
            throw new Error("Word contains invalid characters");
        }
        if (word.length > this.wordLen) throw new Error("Word is too long");
        let guessedWord = word
        for (let i = 0; i < this.wordLen - word.length; i++) {
            guessedWord += '_'
        }
        guessedWord = guessedWord.replaceAll(" ", "_")
        const guess = checkGuess(this.word, guessedWord)
        this.guesses.push(guess)
        this.guessesLeft--

        if (guess.result[0] === this.wordLen) this.won = true;
        await db.updateOne({ userId: this.userId }, { $set: this });
        return guess.result;
    }

    static shape(game) {
        const { _id, ...rest } = game;
        const wordObj = {
            word: rest.word,
            difficulity: rest.difficulity,
            length: rest.wordLen,
            wordDashed: rest.wordDashed,
        }
        return new Game(rest.userId, wordObj, {
            guessesLeft: rest.guessesLeft,
            guesses: rest.guesses,
            won: rest.won,
        });
    }
}

class Guess {
    constructor(word, result) {
        this.word = word;
        this.result = result;
    }
}

function checkGuess(word, guess) {
    let correctTakenArr = [];
    let answerTakenArr = [];
    const arr = guess.toUpperCase();
    const correctArr = word.toUpperCase();
    let correctInPlace = 0,
        correctMisPlaced = 0,
        rest;

    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === correctArr[i]) {
            correctInPlace++;
            correctTakenArr.push(i);
        }
    }

    for (let i = 0; i < arr.length; i++) {
        if (!correctTakenArr.includes(i)) {
            for (let j = 0; j < correctArr.length; j++) {
                if (
                    arr[i] === correctArr[j] &&
                    !answerTakenArr.includes(j) &&
                    !correctTakenArr.includes(j)
                ) {
                    correctMisPlaced++;
                    answerTakenArr.push(j);
                    break;
                }
            }
        }
    }

    rest = word.length - correctInPlace - correctMisPlaced;

    return new Guess(guess, [correctInPlace, correctMisPlaced, rest])
}

export default Controller;