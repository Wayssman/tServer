import { Markup } from 'telegraf'

const menuTitle = "*Нажми*"
const menuButtons = Markup.inlineKeyboard([
    [Markup.button.callback('Угадай случайное слово!', 'word')],
    [Markup.button.callback('Избранное', 'tofavorites')/*, Markup.button.callback('Настройки', 'tosettings')*/]
])

const favoritesButtons = Markup.inlineKeyboard([
    [Markup.button.callback('Избранное. Угадай случайное слово!', 'wordfavorites')],
    [Markup.button.callback('Список', 'tofavoriteslist'), Markup.button.callback('Меню', 'tomenu')]
])

const favoritesListButtons = Markup.inlineKeyboard([
    [
        Markup.button.callback('1', 'listfavorites 1'), 
        Markup.button.callback('2', 'listfavorites 2'), 
        Markup.button.callback('3', 'listfavorites 3'), 
        Markup.button.callback('4', 'listfavorites 4'), 
        Markup.button.callback('5', 'listfavorites 5')
    ],
    [Markup.button.callback('Избранное', 'tofavorites')]
])

const settingsButtons = Markup.inlineKeyboard([
    Markup.button.callback('Меню', 'tomenu')
])

export function sendStart(ctx) {
    return ctx.reply(
        menuTitle,
        { 
            parse_mode: "MarkdownV2",
            reply_markup: menuButtons.reply_markup,
        }
    )
}

export async function sendMenu(ctx) {
    try {
        await ctx.answerCbQuery()
        await ctx.sendMessage(
            menuTitle,
            { 
                parse_mode: "MarkdownV2",
                reply_markup: menuButtons.reply_markup,
            }
        )
    } catch {

    }
}

export async function sendFavorites(ctx) {
    try {
        await ctx.answerCbQuery()
        await ctx.sendMessage(
            'Избранное:',
            favoritesButtons
        )
    } catch {

    }
}

export async function openMenu(ctx) {
    try {
        await ctx.answerCbQuery()
        await ctx.editMessageText(
            menuTitle,
            { 
                parse_mode: "MarkdownV2",
                reply_markup: menuButtons.reply_markup,
            }
        )
    } catch {

    }
}

export async function openFavorites(ctx) {
    try {
        await ctx.answerCbQuery()
        await ctx.editMessageText(
            'Избранное:',
            favoritesButtons
        )
    } catch {

    }
}

export async function openFavoritesList(ctx) {
    try {
        await ctx.answerCbQuery()
        await ctx.editMessageText(
            'Избранное. Список:',
            favoritesListButtons
        )
    } catch {

    }
}

export async function openSettings(ctx) {
    try {
        await ctx.answerCbQuery()
        await ctx.editMessageText(
            'Настройки:',
            settingsButtons
        )
    } catch {

    }
}