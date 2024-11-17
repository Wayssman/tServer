import { bot, connection } from './tServer.js'
import * as dbFunctions from './Database/databaseRequests.js'
import * as coreErrors from './Utilities/coreErrors.js'
import { getNumberArgument } from './Utilities/coreUtilities.js'

export async function assembleList(chatId, text) {
    try {
        const checkResult = getNumberArgument(text, "list")
        const command = checkResult[0]
        const page = checkResult[1]

        const list = await dbFunctions.fetchWordsList(connection, page)
        const listString = list.map(x => x.title).join(", ")

        await bot.telegram.sendMessage(chatId, `База слов. Страница ${page}: ` + listString)
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.error(error)
    }
}