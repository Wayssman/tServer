import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import 'dotenv/config'
import { sshConnection } from './Database/sshDatabaseConnection.js'
import { defaultConnection } from './Database/defaultDatabaseConnection.js'
import schedule from 'node-schedule'

import { handleAdminMessage, assembleScheduledPost } from './post.js'
import { assembleQuiz, assembleFavoritesQuiz } from './quiz.js'
import { assembleList } from './list.js'
import { assembleFavoritesList, favorite, unfavorite } from './favorites.js'
import { openFavorites, openSettings, sendStart, sendMenu, sendFavorites, openMenu, openFavoritesList } from './menu.js'

// Setup
const isRelease = (process.env.BUILD === "release")
export const bot = new Telegraf(String(isRelease ? process.env.BOT_TOKEN : process.env.DEBUG_BOT_TOKEN))
export const connection = isRelease ? await defaultConnection() : await sshConnection()
export const channelId = isRelease ? process.env.TELEGRAM_CHANNEL_ID : process.env.TELEGRAM_ADMIN_CHAT_ID

// Launch Bot
bot.launch()
if (bot) bot.telegram.getMe().then((res) => console.log(`Bot started on https://t.me/${res.username}`))

// Bot bindings to graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Действия кнопок
bot.action('word', async (ctx) => {
  await assembleQuiz(ctx.chat.id)
  //sendMenu(ctx)
})

bot.action('wordfavorites', async (ctx) => {
  await assembleFavoritesQuiz(ctx.chat.id)
  //sendFavorites(ctx)
})

bot.action('tofavorites', async (ctx) => {
  openFavorites(ctx)
})

bot.action('tofavoriteslist', async (ctx) => {
  openFavoritesList(ctx)
})

bot.action(/listfavorites.+/, async (ctx) => {
  assembleFavoritesList(ctx.chat.id, ctx.callbackQuery.data)
})

bot.action('tosettings', async (ctx) => {
  openSettings(ctx)
})

bot.action('tomenu', async (ctx) => {
  openMenu(ctx)
})

// Команды
bot.command('start', async (ctx) => {
  //sendStart(ctx)
})

bot.command('word', async (ctx) => {
  assembleQuiz(ctx.chat.id)
})

bot.command('wordfavorites', async (ctx) => {
  assembleFavoritesQuiz(ctx.chat.id)
})

bot.command('list', async (ctx) => {
  assembleList(ctx.chat.id, ctx.message.text)
})

bot.command('favorite', async (ctx) => {
  favorite(ctx.chat.id, ctx.message.text)
})

bot.command('unfavorite', async (ctx) => {
  unfavorite(ctx.chat.id, ctx.message.text)
})

bot.command('listfavorites', async (ctx) => {
  assembleFavoritesList(ctx.chat.id, ctx.message.text)
})

bot.on(message('text'), async (ctx) => {
  // Распознаем сообщения только от админа
  if (ctx.message.from.username === process.env.TELEGRAM_ADMIN_NAME) {
    // Читаем сообщение от админа и передаем в обработчик комманд
    handleAdminMessage(ctx.message.chat.id, ctx.message.text)
  }
})

const job = schedule.scheduleJob('20 14 * * *', function () {
  assembleScheduledPost(channelId)
})