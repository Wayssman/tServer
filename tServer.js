import { Telegraf, session } from 'telegraf'
import { MySQL } from '@telegraf/session/mysql'
import { message } from 'telegraf/filters'
import 'dotenv/config'
import schedule from 'node-schedule'

import { handleAdminMessage } from './src/Handlers/adminHandler.js'
import { assembleWordScheduledPost } from './src/Builders/wordquiz.js'
import { pool } from './src/Database/defaultDatabaseConnection.js'
import { assembleFactScheduledPost } from './src/Builders/factquiz.js'

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
bot.action(/variant,+/, async (ctx) => {
  const data = ctx.callbackQuery.data
  const parsed = data.split(",")
  const variantIndex = parsed[1]
  const rightVariantIndex = parsed[2]

  ctx.answerCbQuery(variantIndex === rightVariantIndex ? "Верно!" : "Не угадал. Попробуй еще раз!", {
    show_alert: true
  })
})

// Команды
bot.on(message('text'), async (ctx) => {
  // Распознаем сообщения только от админа
  if (ctx.message.from.username === process.env.TELEGRAM_ADMIN_NAME) {
    // Читаем сообщение от админа и передаем в обработчик комманд
    await handleAdminMessage(ctx.message.chat.id, ctx.message.text)
  }
})

const wordPost = schedule.scheduleJob('0 10 * * *', function () {
  assembleWordScheduledPost(channelId)
})

const factPost = schedule.scheduleJob('0 18 * * *', function() {
  assembleFactScheduledPost(channelId)
})