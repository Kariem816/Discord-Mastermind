import { getRandomWord, getWordByDiff, getWordByLength, lengthToDiff } from './controllers/words.controller.js';

export function getWord(options = {}) {
  const diff = options.difficulity || null;
  const length = options.length || null;

  let response

  if (!diff && !length)
    response = getRandomWord()
  else if (diff && !length)
    response = getWordByDiff(diff)
  else if (!diff && length)
    response = getWordByLength(length)
  else if (lengthToDiff(length) === diff) {
    response = getWordByLength(length)
  } else {
    throw new Error("Length and Difficulity don't match")
  }

  if (!response) {
    throw new Error('No words with this length or with this difficulity were found')
  }

  return response;
}

export function parseGame(game) {
  let returnVal = `Word: ${game.wordDashed}\nLength: ${game.wordLen}\nDifficulity: ${game.difficulity}\nGuesses Left: ${game.guessesLeft}`
  if (game.guessesLeft === 20) {
    returnVal += ""
  } else if (game.guessesLeft === 0) {
    returnVal += `\nPrevious Guesses:\n${parseGuesses(game.guesses)}\n\nYou ${game.won ? "won" : "lost"}! The word was ${game.word.toUpperCase()}`
  } else if (game.won) {
    returnVal += `\nPrevious Guesses:\n${parseGuesses(game.guesses)}\n\nYou Won! :confetti_ball: :tada:\n\nThe word was ${game.word.toUpperCase()}`
  } else {
    returnVal += `\nPrevious Guesses:\n${parseGuesses(game.guesses)}`
  }

  if (game.guessesLeft === 0 || game.won) return returnVal

  returnVal += `\n\nGuess by typing \`/guess <word>\` or by clicking the buttons below`

  return returnVal
}

function parseGuesses(guesses) {
  let returnVal = ""

  guesses.forEach((guess) => {
    const [correctInPlace, correctMisPlaced, rest] = guess.result
    const correctArray = Array(correctInPlace).fill(":green_circle:")
    const correctMisPlacedArray = Array(correctMisPlaced).fill(":yellow_circle:")
    const restArray = Array(rest).fill(":white_circle:")
    const resultArr = [...correctArray, ...correctMisPlacedArray, ...restArray]

    returnVal += `\tGuess: \`${guess.word}\` => ${resultArr.join(" ")}\n\n`
  })

  return returnVal
}