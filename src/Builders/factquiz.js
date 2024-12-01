import { bot } from '../../tServer.js'
import * as dbFunctions from '../Database/databaseRequests.js'
import * as coreErrors from '../Utilities/coreErrors.js'
import { shuffle } from '../Utilities/coreUtilities.js'

export async function assembleFactQuizPost(chatId, factId) {
    try {
        // Ищем факт
        const searchResult = await dbFunctions.fetchFactById(factId)

        // Проверяем результаты поиска
        if (searchResult.length === 0) {
            throw new coreErrors.PostError("not found")
        }
        const postFact = searchResult[0]
        if (postFact.length === 0) {
            throw new coreErrors.PostError("not found")
        }

        await sendFactPost(chatId, postFact)
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.error(error)
    }
}

export async function assembleFactScheduledPost(chatId) {
    try {
        // Вытаскиваем счетчик
        const counter = await dbFunctions.fetchChannelCounter(chatId)
        if (counter.length === 0) {
            throw new Error("Can't fetch channel counter")
        }

        // По id из счетчика вытаскиваем факт
        const factId = counter[0].factId
        const searchResult = await dbFunctions.fetchFactById(factId)
        
        // Проверяем результаты поиска
        if (searchResult.length === 0) {
            throw new coreErrors.PostError("not found")
        }
        const postFact = searchResult[0]
        if (postFact.length === 0) {
            throw new coreErrors.PostError("not found")
        }

        await sendFactPost(chatId, postFact)
        dbFunctions.setFactChannelCounter(chatId, factId + 1)
    } catch (error) {
        console.error(error)
    }
}

export async function assembleFactRandomPost(chatId) {
    try {
        // Ищем факт
        const searchResult = await dbFunctions.fetchRandomFacts(1)

        // Проверяем результаты поиска
        if (searchResult.length === 0) {
            throw new coreErrors.PostError("not found")
        }
        const postFact = searchResult[0]
        if (postFact.length === 0) {
            throw new coreErrors.PostError("not found")
        }

        await sendFactPost(chatId, postFact)
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.error(error)
    }
}

async function sendFactPost(chatId, postFact) {
    try {
        // Формируем квиз
        const quizVariants = getFactQuizVarinats(postFact)
        const variants = quizVariants[0]
        const rightVariantIndex = quizVariants[1]
        const category = postFact.category + "\n\n"

        // Отсылаем квиз в бот
        await bot.telegram.sendQuiz(chatId, category + postFact.question, variants, {
            correct_option_id: rightVariantIndex,
            explanation: variants[rightVariantIndex]
        })
    } catch (error) {
        await bot.telegram.sendMessage(chatId, coreErrors.getErrorDescription(error))
        console.error(error)
    }
}

function getFactQuizVarinats(fact) {
    var variants = [fact.answer, fact.variant1, fact.variant2, fact.variant3] // Формируем список вариантов
    shuffle(variants)
    const mainIndex = variants.findIndex(x => x === fact.answer) // Правильный ответ
    return [variants, mainIndex]
}
