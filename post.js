import { bot, connection, channelId } from './tServer.js'
import * as dbFunctions from './Database/databaseRequests.js'
import * as coreErrors from './Utilities/coreErrors.js'
import { getWordArgument } from './Utilities/coreUtilities.js'
import { makeSafe } from './Utilities/telegramUtilities.js'

export async function handleAdminMessage(chatId, text) {
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
        await bot.telegram.sendMessage(chatId, postMessage, {
            parse_mode: "MarkdownV2"
        })
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.error(error)
    }
}

function getPostMessage(word) {
    const titleMessage = `*${makeSafe(`${word.title}`)}* \n\n`
    const postMessage = makeSafe(word.message)
    const imageMessage = `[\u200B](${word.image})`

    const fullMessage = titleMessage + postMessage + imageMessage
    return fullMessage
}

export async function assembleScheduledPost(chatId) {
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
      await bot.telegram.sendMessage(chatId, postMessage, {
        parse_mode: "MarkdownV2"
    })
  
      dbFunctions.setChannelCounter(connection, chatId, wordId + 1)
    } catch (error) {
      console.error(error)
    }
  }