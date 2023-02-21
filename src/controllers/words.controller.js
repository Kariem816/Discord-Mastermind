import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

export function lengthToDiff(len) {
    if (len <= 3) {
        return 'kids';
    } else if (len === 4) {
        return 'easy';
    } else if (len === 5) {
        return 'medium';
    } else if (len === 6) {
        return 'hard';
    } else if (len > 6 && len <= 31 && len !== 26) {
        return 'impossible';
    }
    return null;
}

export function getWordByDiff(diff) {
    const pathToData = join(__dirname, `../data/words`);
    const diffsNames = readdirSync(pathToData);

    let pathToWords;

    for (let i = 0; i < diffsNames.length; i++) {
        const fileName = diffsNames[i]
        const diffName = fileName.split('.')[1]
        if (fileName.match(diff) && diffName.length === diff.length)
            pathToWords = join(pathToData, fileName);
    }
    if (!pathToWords) throw new Error("This difficulity was not found")

    const wordsFile = readFileSync(pathToWords, 'utf8')
    const wordsObj = JSON.parse(wordsFile);
    const wordsArr = Object.keys(wordsObj)
    const randomIndex = Math.floor(Math.random() * wordsArr.length)
    const word = wordsArr[randomIndex]

    return ({
        word: word,
        difficulity: diff,
        length: word.length,
        random: false,
    })
}

export function getWordByLength(len) {
    const length = Number(len)
    const diff = lengthToDiff(length);
    if (!diff) throw new Error("No words with this length was found")

    const pathToData = join(__dirname, `../data/words`);
    const diffsNames = readdirSync(pathToData);

    let pathToWords;

    for (let i = 0; i < diffsNames.length; i++) {
        const diffName = diffsNames[i]
        if (diffName.match(diff))
            pathToWords = join(pathToData, diffName);
    }

    const wordsFile = readFileSync(pathToWords, 'utf8')
    const wordsObj = JSON.parse(wordsFile);
    const wordsArr = Object.keys(wordsObj).filter(x => x.length === length)
    if (wordsArr.length === 0) {
        return null
    }
    const randomIndex = Math.floor(Math.random() * wordsArr.length)
    const word = wordsArr[randomIndex]

    return ({
        word: word,
        difficulity: diff,
        length: word.length,
        random: false,
    })
}

export function getRandomWord() {
    let length = 0, hardDecider;
    hardDecider = Math.random() > 0.9;
    if (hardDecider) {
        do {
            length = Math.ceil(Math.random() * 22) + 8;
        } while (length > 31 || length === 30 || length === 26);
    } else {
        do {
            length = Math.ceil(Math.random() * 7);
        } while (length < 2);
    }
    const word = getWordByLength(length);
    word.random = true;
    return word;
}