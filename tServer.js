import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import 'dotenv/config'
import { sshConnection } from './Database/sshDatabaseConnection.js'
import { defaultConnection } from './Database/defaultDatabaseConnection.js'
import { shuffle, getWordArgument, getNumberArgument } from './Utilities/coreUtilities.js'
import { makeSafe } from './Utilities/telegramUtilities.js'
import schedule from 'node-schedule'
import * as dbFunctions from './Database/databaseRequests.js'
import * as coreErrors from './Utilities/coreErrors.js'

// Setup
const isRelease = (process.env.BUILD === "release")
const bot = new Telegraf(String(isRelease ? process.env.BOT_TOKEN : process.env.DEBUG_BOT_TOKEN))
const connection = isRelease ? await defaultConnection() : await sshConnection()
const channelId = isRelease ? process.env.TELEGRAM_CHANNEL_ID : process.env.TELEGRAM_ADMIN_CHAT_ID

// Launch Bot
bot.launch()
if (bot) bot.telegram.getMe().then((res) => console.log(`Bot started on https://t.me/${res.username}`))

// Bot bindings to graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Listeners
bot.command('word', async (ctx) => {
  assembleQuiz(ctx.chat.id)
})

bot.command('list', async (ctx) => {
  assembleList(ctx.chat.id, ctx.message.text)
})

/*bot.command('favorite', async (ctx) => {
  try {
    const text = ctx.message.text
    const words = text.split(" ")
    const searchWord = words[1]
    const word = await await dbFunctions.fetchFirstWord(connection, searchWord)
    const wordId = word[0].id
    //const results = await dbFunctions.setChannelFavorite(connection, ctx.chat.id, wordId)
    //const results = await dbFunctions.deleteChannelFavorite(connection, ctx.chat.id, wordId)
    console.log(results)
  } catch (error) {
    console.log(error)
  }
})

bot.command('listFavorites', async (ctx) => {
  try {
    const text = ctx.message.text
    const words = text.split(" ")
    const pageWord = words[1]
    const page = parseInt(pageWord)
    const list = await dbFunctions.fetchFavoritesList(connection, ctx.chat.id, page)
    const listString = list.map(x => x.title).join(", ")
    console.log(listString)
  } catch (error) {
    console.log(error)
  }
})*/

bot.on(message('text'), async (ctx) => {
  // Распознаем сообщения только от админа
  if (ctx.message.from.username === process.env.TELEGRAM_ADMIN_NAME) {
    // Читаем сообщение от админа и передаем в обработчик комманд
    handleAdminMessage(ctx.message.chat.id, ctx.message.text)
  }
})

const job = schedule.scheduleJob('0 10 * * *', function() {
  assembleScheduledPost(channelId)
})

async function handleAdminMessage(chatId, text) {
  try {
    // Проверяем формат ввода
    const checkResult = getWordArgument(text, "word")
    const word = checkResult[0]
    const argument = checkResult[1]
    
    if (argument === process.env.COMMAND_TOGROUP) {
      await assemblePost(channelId, word)
    } else if (!argument) {
      await assemblePost(chatId, word)
    } else {
      throw new coreErrors.ArgumentParseError("word")
    }
  } catch(error) {
    await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
    console.error(error)
  }
}

async function assembleScheduledPost(chatId) {
  try {
    // Вытаскиваем счетчик
    const counter = await dbFunctions.fetchChannelCounter(connection, chatId)
    if (counter.length === 0) {
      throw new Error("Can't fetch channel counter")
    }

    // По id из счетчика вытаскиваем слово
    const wordId = counter[0].id
    const searchResult = await dbFunctions.fetchWordById(connection, wordId)
    if (searchResult.length === 0) {
      throw new Error("Reached the end of the Database")
    }
    const postWord = searchResult[0]
    if (postWord.length === 0) {
      throw new Error("Found word is empty")
    }

    // Формируем пост
    const postMessage = getPostMessage(postWord)

    // Отсылаем пост в бот
    await sendPostToBot(chatId, postMessage)

    dbFunctions.setChannelCounter(connection, chatId, wordId + 1)
  } catch (error) {
    console.error(error)
  }
}

// Internal
async function assembleList(chatId, text) {
  try {
    const checkResult = getNumberArgument(text, "list")
    const command = checkResult[0]
    const page = checkResult[1]

    const list = await dbFunctions.fetchWordsList(connection, page)
    const listString = list.map(x => x.title).join(", ")
    
    await bot.telegram.sendMessage(chatId, `Страница ${page}: ` + listString)
  } catch (error) {
    await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
    console.error(error)
  }
}

async function assembleQuiz(chatId) {
  try {
    // Вытаскиваем 4 случайны записи из БД
    const words = await dbFunctions.fetchRandomWords(connection, 4)

    // Проверка на пустой список
    if (words.length < 1) {
      throw new coreErrors.CommandWordError("Words list is empty")
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
    await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
    console.error(error)
  }
}

async function assemblePost(chatId, word) {
  try {
    // Ищем это слово
    const searchResult = await dbFunctions.fetchFirstWord(connection, word)

    // Проверяем результат поиск
    if (searchResult.length === 0) {
      throw new coreErrors.PostError("not found")
    }
    const postWord = searchResult[0]
    if (postWord.length === 0) {
      throw new coreErrors.PostError("not found")
    }

    // Формируем пост
    const postMessage = getPostMessage(postWord)

    // Отсылаем пост в бот
    await sendPostToBot(chatId, postMessage)
  } catch (error) {
    await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
    console.error(error)
  }
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