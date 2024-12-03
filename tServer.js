import { Telegraf, session } from 'telegraf'
import { MySQL } from '@telegraf/session/mysql'
import { message } from 'telegraf/filters'
import 'dotenv/config'
import schedule from 'node-schedule'

import { handleAdminMessage } from './src/Handlers/adminHandler.js'
import { assembleWordScheduledPost, assembleWordRandomPost } from './src/Builders/wordquiz.js'
import { pool } from './src/Database/defaultDatabaseConnection.js'
import { assembleFactScheduledPost, assembleFactRandomPost } from './src/Builders/factquiz.js'
import { assembleBotPost } from './src/Builders/botpost.js'
import { openMenu, sendAgainFact, sendAgainWord, sendMenu } from './src/Handlers/menu.js'
import { handleButtonAction } from './src/Handlers/answers.js'

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
  await handleButtonAction(ctx)
})

bot.action('word', async (ctx) => {
  wordAction(ctx)
})

bot.action('fact', async (ctx) => {
  factAction(ctx)
})

bot.action('tomenu', async (ctx) => {
  toMenuAction(ctx)
})

async function wordAction(ctx) {
  await ctx.answerCbQuery()
  await assembleWordRandomPost(ctx.chat.id)
  await sendAgainWord(ctx)
}

async function factAction(ctx) {
  await ctx.answerCbQuery()
  await assembleFactRandomPost(ctx.chat.id)
  await sendAgainFact(ctx)
}

async function toMenuAction(ctx) {
  await ctx.answerCbQuery()
  await openMenu(ctx)
}

// Команды
bot.start((ctx) => {
  sendMenu(ctx)
})

bot.on(message('text'), async (ctx) => {
  // Распознаем сообщения только от админа
  if (ctx.message.from.username === process.env.TELEGRAM_ADMIN_NAME) {
    // Читаем сообщение от админа и передаем в обработчик комманд
    await handleAdminMessage(ctx.message.chat.id, ctx.message.text)
  }
})

const wordPost = schedule.scheduleJob('0 10 * * *', function() {
  assembleWordScheduledPost(channelId)
})

const factPost = schedule.scheduleJob('0 18 * * *', function() {
  assembleFactScheduledPost(channelId)
})

const botPost = schedule.scheduleJob('0 22 */3 * *', function() {
  assembleBotPost(channelId)
})