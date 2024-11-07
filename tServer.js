import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import 'dotenv/config'
import mysql from 'mysql2'
import schedule from 'node-schedule'
import { parse } from 'path'
import express from 'express'
import { Client } from '@notionhq/client'

// Setup Connections
const bot = new Telegraf(String(process.env.BOT_TOKEN))
const app = express();
const notion = new Client({
  auth: process.env.NOTION_KEY
})

app.use(express.static('public'))
app.listen(3000, function () {
  console.log('Listening on http://localhost:3000/');
});


// Launch Bot
bot.launch()
if (bot) bot.telegram.getMe().then((res) => console.log(`Bot started on https://t.me/${res.username}`))

// Bot bindings to graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Listeners
bot.on(message('text'), async (ctx) => {
  console.log(`Chat id is: ${ctx.message.chat.id}`)
   
})

const job = schedule.scheduleJob('* * * * *', function() {
  assemblePost()
})

async function assemblePost() {
  const databaseId = process.env.NOTION_DB_ID
  const pagesResponse = await notion.databases.query({
    database_id: databaseId
  })
  processPages(pagesResponse.results) 
}

async function processPages(pages) {
  for(var i = 0; i < pages.length; i++) {
    const page = pages[i]
    const pageImageUrl = page.properties.image.files[0].file.url
    const pageTitle = page.properties.title.title[0].text.content
    const pageMessage = page.properties.message.rich_text[0].text.content
    
    await sendToBot(process.env.CHAT_ID, pageImageUrl, pageTitle, pageMessage)
  }
}

async function sendToBot(chatId, pageImageUrl, pageTitle, pageMessage) {
  var message = `*${pageTitle}*\n`
  message += `${pageMessage}`

  const safeMessage = message.replace("-", "\\-")
  const imageMessage = safeMessage + `[\u200B](${pageImageUrl})`
  
  await bot.telegram.sendMessage(chatId, imageMessage, {
    parse_mode: "MarkdownV2"
  })

  await bot.telegram.sendQuiz(process.env.CHAT_ID, "Hello?", ["1", "2"], {
    correct_option_id: 0,
    explanation: "Ответ: 1"
  })
}