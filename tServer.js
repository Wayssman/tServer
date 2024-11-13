import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import 'dotenv/config'
import { sshConnection } from './Database/sshDatabaseConnection.js'
import { defaultConnection } from './Database/defaultDatabaseConnection.js'
import { shuffle } from './Utilities/coreUtilities.js'
import { makeSafe } from './Utilities/telegramUtilities.js'

// Setup Bot
const bot = new Telegraf(String(process.env.BOT_TOKEN))

// Launch Bot
bot.launch()
if (bot) bot.telegram.getMe().then((res) => console.log(`Bot started on https://t.me/${res.username}`))

// Bot bindings to graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Listeners
bot.command('word', async (ctx) => {
  assembleQuiz(ctx.message.chat.id)
})

bot.on(message('text'), async (ctx) => {
  // Распознаем сообщения только от админа
  if (ctx.message.from.username === process.env.TELEGRAM_ADMIN_NAME) {
    // Читаем сообщение от админа и передаем в обработчик комманд
    handleAdminMessage(ctx.message.chat.id, ctx.message.text)
  }
})

function handleAdminMessage(chatId, text) {
  // Проверяем формат ввода
  const words = text.split(" ")
  if (words.length == 1) {
    assemblePost(chatId, words[0])
  } else if (words.length == 2) {
    if (words[0] === process.env.COMMAND_TOGROUP) {
      assemblePost(process.env.TELEGRAM_CHANNEL_ID, words[1])
    } else {
      console.error("Unknown command")
    }
  } else {
    console.error("Unknown text format")
    return
  }
}

// Internal
async function assembleQuiz(chatId) {
  try {
    // Соединяемся с БД
    //const connection = await defaultConnection()
    const connection = await sshConnection()
    // Вытаскиваем 4 случайны записи из БД
    const words = await fetchRandomWords(connection, 4)

    // Проверка на пустой список
    if (words.length < 1) {
      throw new Error("Words list is empty")
    }

    // Зададим первое слово из списка, как главное
    const mainWord = words[0]

    // Формируем сообщение и викторину
    const message = getQuizMessage("Новое слово дня! Угадаешь ли ты?", mainWord)
    const hint = getHint(mainWord)
    const quizVariants = getQuizVariants(mainWord, words)

    // Отсылаем все в бот
    await sendPostToBot(chatId, message)
    await sendQuizToBot(chatId, "Какое это слово?", quizVariants[0], quizVariants[1], hint)
  } catch (error) {
    console.error(error)
  }
}

async function assemblePost(chatId, word) {
  try {
    if (word.length === 0) {
      throw new Error("Word is empty")
    }

    // Соединяемся с БД
    //const connection = await defaultConnection()
    const connection = await sshConnection()
    // Ищем это слово
    const searchResult = await fetchFirstWord(connection, word)

    // Проверяем результат поиск
    if (searchResult.length === 0) {
      throw new Error("Search is empty")
    }
    const postWord = searchResult[0]
    if (postWord.length === 0) {
      throw new Error("Found word is empty")
    }

    // Формируем пост
    const postMessage = getPostMessage(postWord)

    // Отсылаем пост в бот
    await sendPostToBot(chatId, postMessage)
  } catch (error) {
    console.error(error)
  }
}

function fetchRandomWords(connection, limit) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM content ORDER BY RAND( ) LIMIT ${limit}`, (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results)
    })
  })
}

function fetchFirstWord(connection, word) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM content WHERE LOWER(title) = '${word.toLowerCase()}' LIMIT 1`, (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results)
    })
  })
}

function getQuizMessage(title, word) {
  const titleMessage = `*${makeSafe(`${title}`)}* \n\n`
  const postMessage = makeSafe(word.message)
  const imageMessage = `[\u200B](${word.image})`

  const fullMessage = titleMessage + postMessage + imageMessage
  return fullMessage
}

function getQuizVariants(mainWord, words) {
  var pagesTitles = words.map(x => x.title) // Формируем список вариантов по title
  shuffle(pagesTitles) // Перемешиваем их
  const mainIndex = pagesTitles.findIndex(x => x === mainWord.title) // Правильный вариант
  return [pagesTitles, mainIndex]
}

function getHint(word) {
  return word.accent
}

function getPostMessage(word) {
  const titleMessage = `*${makeSafe(`${word.title}`)}* \n\n`
  const postMessage = makeSafe(word.message)
  const imageMessage = `[\u200B](${word.image})`

  const fullMessage = titleMessage + postMessage + imageMessage
  return fullMessage
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