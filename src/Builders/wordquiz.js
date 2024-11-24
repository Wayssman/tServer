import { bot } from '../../tServer.js'
import { Markup } from 'telegraf'
import * as dbFunctions from '../Database/databaseRequests.js'
import * as coreErrors from '../Utilities/coreErrors.js'
import { shuffle } from '../Utilities/coreUtilities.js'
import { makeSafe } from '../Utilities/telegramUtilities.js'

export async function assembleWordQuizPost(chatId, word) {
    try {
        // Ищем это слово
        const searchResult = await dbFunctions.fetchFirstWord(word)

        // Проверяем результат поиск
        if (searchResult.length === 0) {
            throw new coreErrors.PostError("not found")
        }
        const postWord = searchResult[0]
        if (postWord.length === 0) {
            throw new coreErrors.PostError("not found")
        }

        await sendWordPost(chatId, postWord)
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.error(error)
    }
}

export async function assembleWordScheduledPost(chatId) {
    try {
        // Вытаскиваем счетчик
        const counter = await dbFunctions.fetchChannelCounter(chatId)
        if (counter.length === 0) {
            throw new Error("Can't fetch channel counter")
        }

        // По id из счетчика вытаскиваем слово
        const wordId = counter[0].wordId
        const searchResult = await dbFunctions.fetchWordById(wordId)
        if (searchResult.length === 0) {
            throw new Error("Reached the end of the Database")
        }
        const postWord = searchResult[0]
        if (postWord.length === 0) {
            throw new Error("Found word is empty")
        }

        await sendWordPost(chatId, postWord)
        dbFunctions.setWordChannelCounter(chatId, wordId + 1)
    } catch (error) {
        console.error(error)
    }
}

async function sendWordPost(chatId, postWord) {
    try {
        // Формируем пост
        const postMessage = getPostMessage(postWord)
        const quizVariants = await getQuizDataForWord(chatId, postWord)
        const variants = quizVariants[0]
        const rightVariantIndex = quizVariants[1]

        // Формируем кнопки ответов
        var buttonsFirstLine = []
        var buttonsSecondLine = []
        for (var index = 0; index < variants.length; index++) {
            const button = Markup.button.callback(`${variants[index]}`, `variant,${index},${rightVariantIndex},false`)
            index < 2 ? buttonsFirstLine.push(button) : buttonsSecondLine.push(button)
        }
        const buttonsMarkup = Markup.inlineKeyboard([
            buttonsFirstLine,
            buttonsSecondLine
        ])

        // Отсылаем пост в бот
        await bot.telegram.sendMessage(chatId, postMessage, {
            parse_mode: "MarkdownV2",
            reply_markup: buttonsMarkup.reply_markup
        })
    } catch (error) {
        console.error(error)
    }
}

function getPostMessage(word) {
    const headerMessage = "📭 *Новое слово на сегодня:* \n\n"
    const postMessage = makeSafe(word.message)
    const imageMessage = `[\u200B](${word.image})`

    const fullMessage = headerMessage + postMessage + imageMessage
    return fullMessage
}

async function getQuizDataForWord(chatId, word) {
    try {
        // Вытаскиваем 3 случайных записи из БД
        var words = await dbFunctions.fetchRandomWordsWithout(3, word.title)

        // Проверка на пустой список
        if (words.length < 1) {
            throw new coreErrors.QuizError("empty")
        }

        // Зададим первое слово из списка, как главное
        const mainWord = word
        words.push(mainWord)

        // Формируем викторину
        const quizVariants = getWordQuizVariants(mainWord, words)
        return quizVariants
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.error(error)
    }
}

function getWordQuizVariants(mainWord, words) {
    var pagesTitles = words.map(x => x.title) // Формируем список вариантов по title
    shuffle(pagesTitles) // Перемешиваем их
    const mainIndex = pagesTitles.findIndex(x => x === mainWord.title) // Правильный вариант
    return [pagesTitles, mainIndex]
}
