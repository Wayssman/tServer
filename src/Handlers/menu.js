import { Markup } from 'telegraf'
import { makeSafe } from '../Utilities/telegramUtilities.js'

const menuTitle = `*${makeSafe("Нажимай и угадывай!")}*`
const menuButtons = Markup.inlineKeyboard([
    [Markup.button.callback('📚 Угадать случайное слово!', 'word')],
    [Markup.button.callback('💭 Угадать случайный факт!', 'fact')]
])

const againTitle = `*${makeSafe("Понравилось?")}*`
const againWordButtons = Markup.inlineKeyboard([
    [
    Markup.button.callback('♻️ Играть ещё!', 'word'),
    Markup.button.callback('🏠 В меню', 'tomenu')
    ]
])

const againFactButtons = Markup.inlineKeyboard([
    [
    Markup.button.callback('♻️ Играть ещё!', 'fact'),
    Markup.button.callback('🏠 В меню', 'tomenu')
    ]
])

export async function sendMenu(ctx) {
    try {
        await ctx.sendMessage(
            menuTitle,
            { 
                parse_mode: "MarkdownV2",
                reply_markup: menuButtons.reply_markup,
            }
        )
    } catch(error) {
        console.log(error)
    }
}

export async function openMenu(ctx) {
    try {
        await ctx.editMessageText(
            menuTitle,
            { 
                parse_mode: "MarkdownV2",
                reply_markup: menuButtons.reply_markup,
            }
        )
    } catch(error) {
        console.log(error)
    }
}

export async function sendAgainWord(ctx) {
    try {
        await ctx.sendMessage(
            againTitle,
            { 
                parse_mode: "MarkdownV2",
                reply_markup: againWordButtons.reply_markup,
            }
        )
    } catch(error) {
        console.log(error)
    }
}

export async function sendAgainFact(ctx) {
    try {
        await ctx.sendMessage(
            againTitle,
            { 
                parse_mode: "MarkdownV2",
                reply_markup: againFactButtons.reply_markup,
            }
        )
    } catch(error) {
        console.log(error)
    }
}