import { ArgumentParseError } from './coreErrors.js'

Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
}

export function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

export function getWordArgument(text, commandTag) {
    const words = text.split(" ")
    if (words.length === 0) {
        throw new ArgumentParseError(commandTag)
    }
    const word = words[0]
    const argument = words[1]
    if (word.length === 0) {
        throw new ArgumentParseError(commandTag)
    }
    return [word, argument]
}

export function getNumberArgument(text, commandTag) {
    const result = getWordArgument(text, commandTag)
    const word = result[0]
    const pageWord = result[1]

    const page = parseInt(pageWord, 10)
    if (isNaN(page)) {
        throw new ArgumentParseError(commandTag)
    }
    if (page < 1) {
        throw new ArgumentParseError(commandTag)
    }
    return [word, page]
}