import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync } from 'fs';

class Controller {
    constructor() {
        const gamesFile = readFileSync('./src/data/games.json', 'utf8');
        this.games = JSON.parse(gamesFile) || {};
        setInterval(() => {
            this.saveGames();
        }, 1000);
    }

    newGame(userId, wordObj) {
        const game = new Game(userId, wordObj);
        this.games[userId] = game;
        return game;
    }

    deleteGame(userId) {
        const { word } = this.games[userId];
        delete this.games[userId];
        return word;
    }

    saveGames() {
        writeFileSync('./src/data/games.json', JSON.stringify(this.games));
    }
}

class Game {
    constructor(userId, wordObj) {
        this.id = uuidv4();
        this.userId = userId;
        this.word = wordObj.word;
        this.difficulity = wordObj.difficulity;
        this.wordLen = wordObj.length;
        this.wordDashed = wordObj.word.split('').map((letter) => '\\_').join(' ');
        this.guesses = [];
        this.guessesLeft = 20;
        this.won = false;
    }

    guess(word) {
        const regex = /^[a-zA-Z _]+$/;
        if (!regex.test(word)) {
            throw new Error("Word contains invalid characters");
        }
        if (word.length > this.wordLen) throw new Error("Word is too long");
        let guessedWord = word
        for (let i = 0; i < this.wordLen - word.length; i++) {
            guessedWord += '_'
        }
        guessedWord = guessedWord.replace(" ", "_")
        const guess = checkGuess(this.word, guessedWord)
        this.guesses.push(guess)
        this.guessesLeft--

        if (guess.result[0] === this.wordLen) this.won = true;
        return guess.result;
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