import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import 'dotenv/config'
import mysql from 'mysql2'
import schedule from 'node-schedule'
import { Client } from '@notionhq/client'
import { escapers } from "@telegraf/entity";

// Setup Connections
const bot = new Telegraf(String(process.env.BOT_TOKEN))
const notion = new Client({
  auth: process.env.NOTION_KEY
})
const telegramAdminName = process.env.TELEGRAM_ADMIN_NAME
const commandPrefix = "togroup"
var adminChatId = ""
const telegramGroupChatId = process.env.CHAT_ID

// Launch Bot
bot.launch()
if (bot) bot.telegram.getMe().then((res) => console.log(`Bot started on https://t.me/${res.username}`))

// Bot bindings to graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Listeners
bot.on(message('text'), async (ctx) => {
  // Распознаем сообщения только от админа
  if (ctx.message.from.username === telegramAdminName) {
    // Сохраняем id чата с админом для отправки тестового поста
    adminChatId = ctx.message.chat.id
    console.log(`Admin chat id is: ${adminChatId}`)
    // Читаем сообщение от админа и передаем в обработчик комманд
    const text = ctx.message.text
    console.log(text)

    if (text) {
      handleCommand(text)
    }
  }
})

const job = schedule.scheduleJob('* * * * *', function() {
  
})

// Internal
function handleCommand(text) {
  const words = text.split(" ")
  if (words.length === 2 && words[0] === commandPrefix) {
    assemblePost(words[1], adminChatId)
  } else if (words.length === 1) {
    assemblePost(words[0], process.env.CHAT_ID)
  }
}

async function assemblePost(word, chatId) {
  // Проверки слова
  if (word.length === 0) {
    console.log("Error. Word of the day is Empty!")
    await bot.telegram.sendMessage(adminChatId, `Невозможно распознать слово.`)
    return
  }

  // Вытаскиваем сохраненные переменные
  const databaseId = process.env.NOTION_DB_ID

  // Получаем все записи из БД
  const pagesResponse = await notion.databases.query({
    database_id: databaseId
  })
  
  // Вытаскиваем все страницы и ищем страницу для слова в БД
  const pages = pagesResponse.results
  const mainPage = pages.find(x => getPageTitle(x).toLowerCase() === word.toLowerCase())

  if (!mainPage) {
    console.log("Error. Page not found!")
    await bot.telegram.sendMessage(adminChatId, `Слово ${word} не найдено.`)
    return
  }

  // Формируем сообщение и викторину
  const message = getMessage("Новое слово дня! Угадаешь ли ты?", mainPage)
  const accent = getPageAccent(mainPage)
  const quizVariants = getQuizVariants(mainPage, pages)

  // Отсылаем все в бот
  await sendPostToBot(chatId, message)
  await sendQuizToBot(chatId, "Какое это слово?", quizVariants[0], quizVariants[1], accent)
}

function getMessage(title, page) {
  const pageMessage = getPageMessage(page)
  const pageImageUrl = getPageImage(page)
  
  const titleMessage = `*${makeSafe(`${title}`)}* \n\n`
  const postMessage = makeSafe(pageMessage)
  const imageMessage = `[\u200B](${pageImageUrl})`

  const fullMessage = titleMessage + postMessage + imageMessage
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

async function sendPostToBot(chatId, message) {
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

function getPageAccent(page) {
  return page.properties.accent.rich_text[0].text.content
}

function getPageMessage(page) {
  return page.properties.message.rich_text[0].text.content
}

function getPageImage(page) {
  return page.properties.image.files[0].file.url
}

// Extensions
function makeSafe(text) {
  return escapers.MarkdownV2(text)
}

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