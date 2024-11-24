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

export function getArguments(text, commandTag) {
    const words = text.split(" ")
    if (words.length === 0) {
        throw new ArgumentParseError(commandTag)
    }
    const word = words[0]
    const argument1 = words[1]
    const argument2 = words[2]
    if (word.length === 0) {
        throw new ArgumentParseError(commandTag)
    }
    return [word, argument1, argument2]
}