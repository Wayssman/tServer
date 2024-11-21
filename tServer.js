import { Telegraf, session } from 'telegraf'
import { MySQL } from '@telegraf/session/mysql'
import { message } from 'telegraf/filters'
import 'dotenv/config'
import schedule from 'node-schedule'

import { handleAdminMessage, assembleScheduledPost } from './post.js'
import { assembleQuiz, assembleFavoritesQuiz } from './quiz.js'
import { assembleList } from './list.js'
import { assembleFavoritesList, favorite, unfavorite } from './favorites.js'
import { openFavorites, sendStart, sendMenu, sendFavorites, openMenu, openFavoritesList, sendFavoritesList } from './menu.js'
import { pool } from './Database/defaultDatabaseConnection.js'

// Setup
export const isRelease = (process.env.BUILD === "release")
export const bot = new Telegraf(String(isRelease ? process.env.BOT_TOKEN : process.env.DEBUG_BOT_TOKEN))
export const channelId = isRelease ? process.env.TELEGRAM_CHANNEL_ID : process.env.TELEGRAM_ADMIN_CHAT_ID

// Launch Bot
const store = MySQL({ pool })
bot.use(session(store))
bot.launch()
if (bot) bot.telegram.getMe().then((res) => console.log(`Bot started on https://t.me/${res.username}`))

// Bot bindings to graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Действия кнопок
bot.action('word', async (ctx) => {
  await assembleQuiz(ctx.chat.id)
  sendMenu(ctx)
})

bot.action('wordfavorites', async (ctx) => {
  await assembleFavoritesQuiz(ctx.chat.id)
  sendFavorites(ctx)
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

bot.action('favorite', async (ctx) => {
  const message = await bot.telegram.sendMessage(ctx.chat.id, "Добавить в избранное", {
    reply_markup: {
      force_reply: true,
      input_field_placeholder: "Введи слово"
    }
  })

  ctx.session = {
    favoriteMessageId: message?.message_id
  }
})

bot.action('unfavorite', async (ctx) => {
  const message = await bot.telegram.sendMessage(ctx.chat.id, "Удалить из избранного", {
    reply_markup: {
      force_reply: true,
      input_field_placeholder: "Введи слово"
    }
  })

  ctx.session = {
    unfavoriteMessageId: message?.message_id
  }
})

bot.action('tomenu', async (ctx) => {
  openMenu(ctx)
})

// Команды
bot.command('start', async (ctx) => {
  sendStart(ctx)
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
  const replyMessageId = ctx.message?.reply_to_message?.message_id || "NoReply"
  const favoriteMessageId = ctx.session?.favoriteMessageId || "NoFavorite"
  const unfavoriteMessageId = ctx.session?.unfavoriteMessageId || "NoUnfavorite"

  switch (replyMessageId) {
    case favoriteMessageId:
      await favorite(ctx.chat.id, "/favorite " + ctx.message.text)
      await sendFavoritesList(ctx)
      break
    case unfavoriteMessageId:
      await unfavorite(ctx.chat.id, "/unfavorite " + ctx.message.text)
      await sendFavoritesList(ctx)
      break
    case "NoReply":
      // Распознаем сообщения только от админа
      if (ctx.message.from.username === process.env.TELEGRAM_ADMIN_NAME) {
        // Читаем сообщение от админа и передаем в обработчик комманд
        await handleAdminMessage(ctx.message.chat.id, ctx.message.text)
      }
      break
    default:
      return
  }
})

const job = schedule.scheduleJob('0 10 * * *', function () {
  assembleScheduledPost(channelId)
})