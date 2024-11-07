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
  assemblePost()
})

const job = schedule.scheduleJob('* * * * *', function() {
  
})


// Internal
async function assemblePost() {
  // Вытаскиваем сохраненные переменные
  const databaseId = process.env.NOTION_DB_ID
  const chatId = process.env.CHAT_ID

  // Получаем все записи из БД
  const pagesResponse = await notion.databases.query({
    database_id: databaseId
  })
  
  // Вытаскиваем все страницы и выбираем запись на отображение
  const pages = pagesResponse.results
  const mainPage = pages.random()

  // Формируем сообщение и викторину
  const message = getMessage("Новое слово дня! Угадаешь ли ты? 😜", mainPage)
  const quizVariants = getQuizVariants(mainPage, pages)

  // Отсылаем все в бот
  await sendMessageToBot(chatId, message)
  await sendQuizToBot(chatId, "Какое это слово?", quizVariants[0], quizVariants[1], "Позже добавлю")
}

function getMessage(title, page) {
  const pageMessage = getPageMessage(page)
  const pageImageUrl = getPageImage(page)

  var message = `*${title}*\n`
  message += `${pageMessage}`

  const safeMessage = message
    .replace("-", "\\-")
    .replace("!", "\\!")
  const imageMessage = `[\u200B](${pageImageUrl})`
  const fullMessage = safeMessage + imageMessage

  return fullMessage
}

function getQuizVariants(mainPage, pages) {
  // Формируем список вариантов текстов
  const pagesTitles = pages.map(x => getPageTitle(x))

  // Правильный вариант
  const mainPageTitle = getPageTitle(mainPage)

  // Создаем из правильного варианта заготовку на список всех вариантов
  var savedVariants = [mainPageTitle]

  // В идеале нам нужны еще 3 рандомных варианта, которые не пересекаются друг с другом
  for (var i = 0; i < 3; i++) {
    const toRemove = new Set(savedVariants)  // Set для быстрого фильтра
    const filteredTitles = pagesTitles.filter(x => !toRemove.has(x));  // Исключаем на каждой итерации уже сохраненные
    const randomTitle = filteredTitles.random()  // Среди отфильтрованных ищем случайный

    if (randomTitle) {
      savedVariants.push(randomTitle) // Добавляем, если нашли
    }
  }

  shuffle(savedVariants)
  const mainIndex = savedVariants.findIndex(x => x === mainPageTitle)
  return [savedVariants, mainIndex]
}

async function sendMessageToBot(chatId, message) {
  await bot.telegram.sendMessage(chatId, message, {
    parse_mode: "MarkdownV2"
  })
}

async function sendQuizToBot(chatId, introduction, variants, rightIndex, explanation) {
  await bot.telegram.sendQuiz(chatId, introduction, variants, {
    correct_option_id: rightIndex,
    explanation: explanation
  })
}

function getPageTitle(page) {
  return page.properties.title.title[0].text.content
}

function getPageMessage(page) {
  return page.properties.message.rich_text[0].text.content
}

function getPageImage(page) {
  return page.properties.image.files[0].file.url
}

// Extensions
Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}