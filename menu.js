import { Markup } from 'telegraf'

const menuTitle = "*Нажимай и повторяй слова*"
const favoritesTitle = "Повторяй слова из избранного"
const favoriteListTitle = "Твои избранные слова:"
const menuButtons = Markup.inlineKeyboard([
    [Markup.button.callback('Угадать случайное слово!', 'word')],
    [Markup.button.callback('Избранное', 'tofavorites')/*, Markup.button.callback('Настройки', 'tosettings')*/]
])

const favoritesButtons = Markup.inlineKeyboard([
    [Markup.button.callback('Угадать слово в избранном!', 'wordfavorites')],
    [Markup.button.callback('Список', 'tofavoriteslist'), Markup.button.callback('Назад', 'tomenu')]
])

const favoritesListButtons = Markup.inlineKeyboard([
    [
        Markup.button.callback('Стр. 1', 'listfavorites 1'), 
        Markup.button.callback('Стр. 2', 'listfavorites 2'), 
        Markup.button.callback('Стр. 3', 'listfavorites 3'), 
        Markup.button.callback('Стр. 4', 'listfavorites 4'), 
        Markup.button.callback('Стр. 5', 'listfavorites 5')
    ],
    [
        Markup.button.callback('Добавить слово', 'favorite'), 
        Markup.button.callback('Удалить слово', 'unfavorite'), 
    ],
    [Markup.button.callback('Назад', 'tofavorites')]
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
            favoritesTitle,
            {
                parse_mode: "MarkdownV2",
                reply_markup: favoritesButtons.reply_markup
            }
        )
    } catch {

    }
}

export async function openFavoritesList(ctx) {
    try {
        await ctx.answerCbQuery()
        await ctx.editMessageText(
            favoriteListTitle,
            {
                parse_mode: "MarkdownV2",
                reply_markup: favoritesListButtons.reply_markup
            }
        )
    } catch {

    }
}