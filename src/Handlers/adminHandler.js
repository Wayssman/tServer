import { bot, channelId } from '../../tServer.js'
import * as coreErrors from '../Utilities/coreErrors.js'
import { getArguments } from '../Utilities/coreUtilities.js'
import { assembleWordQuizPost } from '../Builders/wordquiz.js'
import { assembleFactQuizPost } from '../Builders/factquiz.js'


export async function handleAdminMessage(chatId, text) {
    try {
        // Проверяем формат ввода
        const checkResult = getArguments(text, "word")
        const base = checkResult[0]
        const argument1 = checkResult[1]
        const argument2 = checkResult[2]
        
        const decidedChatId = (argument2 === process.env.COMMAND_TOGROUP) ? channelId : chatId
        if (argument1 === process.env.COMMAND_WORD) {
            await assembleWordQuizPost(decidedChatId, base)
        } else if (argument1 === process.env.COMMAND_FACT) {
            await assembleFactQuizPost(decidedChatId, base)
        }
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.error(error)
    }
}