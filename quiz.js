import { bot, connection } from './tServer.js'
import * as dbFunctions from './Database/databaseRequests.js'
import * as coreErrors from './Utilities/coreErrors.js'
import { shuffle } from './Utilities/coreUtilities.js'
import { makeSafe } from './Utilities/telegramUtilities.js'
import { openFavorites, openSettings, sendStart, sendMenu, sendFavorites, openMenu, openFavoritesList } from './menu.js'

export async function assembleQuiz(chatId) {
    try {
        // Вытаскиваем 4 случайны записи из БД
        const words = await dbFunctions.fetchRandomWords(connection, 4)

        // Проверка на пустой список
        if (words.length < 1) {
            throw new coreErrors.QuizError("empty")
        }

        // Зададим первое слово из списка, как главное
        const mainWord = words[0]

        // Формируем сообщение и викторину
        const message = getQuizMessage("Новое слово дня! Угадаешь ли ты?", mainWord)
        const hint = getHint(mainWord)
        const quizVariants = getQuizVariants(mainWord, words)

        // Отсылаем все в бот
        await bot.telegram.sendMessage(chatId, message, {
            parse_mode: "MarkdownV2"
        })
        await bot.telegram.sendQuiz(chatId, "Какое это слово?", quizVariants[0], {
            correct_option_id: quizVariants[1],
            explanation: hint
        })
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.error(error)
    }
}

export async function assembleFavoritesQuiz(chatId) {
    try {
        // Вытаскиваем 4 случайны записи из БД
        const words = await dbFunctions.fetchRandomFavorites(connection, chatId, 4)

        // Проверка на пустой список
        if (words.length < 1) {
            throw new coreErrors.QuizError("empty")
        }

        // Зададим первое слово из списка, как главное
        const mainWord = words[0]

        // Формируем сообщение и викторину
        const message = getQuizMessage("Новое слово дня! Угадаешь ли ты?", mainWord)
        const hint = getHint(mainWord)
        const quizVariants = getQuizVariants(mainWord, words)

        // Проверка на кол-во вариантов
        if (quizVariants[0].length < 2) {
            throw new coreErrors.QuizError("less")
        }

        // Отсылаем все в бот
        await bot.telegram.sendMessage(chatId, message, {
            parse_mode: "MarkdownV2"
        })
        await bot.telegram.sendQuiz(chatId, "Какое это слово?", quizVariants[0], {
            correct_option_id: quizVariants[1],
            explanation: hint
        })
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
