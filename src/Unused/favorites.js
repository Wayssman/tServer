import { bot } from '../../tServer.js'
import * as dbFunctions from './Database/databaseRequests.js'
import * as coreErrors from './Utilities/coreErrors.js'
import { getWordArgument, getNumberArgument } from './Utilities/coreUtilities.js'

export async function assembleFavoritesList(chatId, text) {
    try {
        const checkResult = getNumberArgument(text, "favoritesList")
        const command = checkResult[0]
        const page = checkResult[1]

        const list = await dbFunctions.fetchFavoritesList(chatId, page)
        const listString = list.map(x => x.title).join(", ")

        await bot.telegram.sendMessage(chatId, `Избранное. Страница ${page}: ` + listString)
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.log(error)
    }
}

export async function favorite(chatId, text) {
    try {
        const checkResult = getWordArgument(text, "favorite")
        const command = checkResult[0]
        const word = checkResult[1]

        if (!word) {
            throw new coreErrors.ArgumentParseError("favorite")
        }

        const wordRecord = await await dbFunctions.fetchFirstWord(word)
        if (wordRecord.length === 0) {
            throw new coreErrors.FavoriteError("not found")
        }
        const wordId = wordRecord[0].id
        if (!wordId) {
            throw new coreErrors.FavoriteError("not found")
        }
        const results = await dbFunctions.setChannelFavorite(chatId, wordId)
        await bot.telegram.sendMessage(chatId, `Успех! Слово "${word}" добавлено в избранное!`)
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.log(error)
    }
}

export async function unfavorite(chatId, text) {
    try {
        const checkResult = getWordArgument(text, "unfavorite")
        const command = checkResult[0]
        const word = checkResult[1]

        if (!word) {
            throw new coreErrors.ArgumentParseError("unfavorite")
        }

        const wordRecord = await await dbFunctions.fetchFirstWord(word)
        if (wordRecord.length === 0) {
            throw new coreErrors.FavoriteError("not found")
        }
        const wordId = wordRecord[0].id
        if (!wordId) {
            throw new coreErrors.FavoriteError("not found")
        }

        const results = await dbFunctions.deleteChannelFavorite(chatId, wordId)
        await bot.telegram.sendMessage(chatId, `Успех! Слово "${word}" удалено из избранного!`)
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.log(error)
    }
}