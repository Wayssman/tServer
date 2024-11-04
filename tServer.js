import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import 'dotenv/config'

const bot = new Telegraf(String(process.env.BOT_TOKEN))

bot.on(message('text'), async (ctx) => {
  // Explicit usage
  await ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`)
  // Using context shortcut
  await ctx.reply(`Hello ${ctx.state.role}`)
})

bot.launch()
if (bot) bot.telegram.getMe().then((res) => console.log(`Bot started on https://t.me/${res.username}`))

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))