import { bot } from '../../tServer.js'
import * as coreErrors from '../Utilities/coreErrors.js'
import { makeSafe } from '../Utilities/telegramUtilities.js'
import { Markup } from 'telegraf'

const botPostButtons = Markup.inlineKeyboard([
    [Markup.button.url("Повторять слова в боте!", process.env.TELEGRAM_BOT_LINK)]
])

export async function assembleBotPost(chatId) {
    try {
        bot.telegram.sendMessage(chatId, getPostMessage(), {
            parse_mode: "MarkdownV2",
            reply_markup: botPostButtons.reply_markup
        })
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.error(error)
    }
}

function getPostMessage() {
    const message = "Не хочешь целый день ждать новой викторины? Переходи в нашего бота по ссылке!"
    const safeMessage = `*${makeSafe(message)}*`
    const botImageUrl = "https://s3.timeweb.cloud/9673e7b0-029f7203-223a-429e-9011-58133f6828a7/botDesc.jpg"
    const imageMessage = `[\u200B](${botImageUrl})`

    const fullMessage = safeMessage + imageMessage
    return fullMessage
}