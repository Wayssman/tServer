import * as dbFunctions from '../Database/databaseRequests.js'

const rightAnswerText = "💡 Верно!"
const wrongAnswerText = "🙅🏻‍♂️ Не угадал. Попробуй еще раз!"
const errorMessageText = "⚠️ Произошла ошибка с проверкой ответа. Считайте, что вы выиграли!"

export async function handleButtonAction(ctx) {
  const data = ctx.callbackQuery.data
  const parsed = data.split(",")
  const variantIndex = parsed[1]
  const rightVariantIndex = parsed[2]
  const wordId = parsed[4]

  if (variantIndex === rightVariantIndex) {
    await makeRightAnswerMessage(ctx, wordId)
  } else {
    await sendWrongAnswerMessage(ctx)
  }
}

async function makeRightAnswerMessage(ctx, wordId) {
  try {
    if (!wordId) {
      throw new Error("No word id")
    }

    // Ищем слово по id
    const searchResult = await dbFunctions.fetchWordById(wordId)

    // Проверяем результаты
    if (searchResult.length === 0) {
      throw new Error("Reached the end of the Database")
    }
    const postWord = searchResult[0]
    if (postWord.length === 0) {
      throw new Error("Found word is empty")
    }

    await sendRightAnswerMessage(ctx, getWordRightMessage(postWord))
  } catch (error) {
    console.error(error)
    await sendRightAnswerMessage(ctx, rightAnswerText)
  }
}

async function sendRightAnswerMessage(ctx, message) {
  await ctx.answerCbQuery(message, {
    show_alert: true, 
  })
}

async function sendWrongAnswerMessage(ctx) {
  try {
    await ctx.answerCbQuery(wrongAnswerText, {
      show_alert: true
    })
  } catch {

  }
}

async function sendErrorMessage(ctx) {
  try {
    await ctx.answerCbQuery(errorMessageText, {
      show_alert: true
    })
  } catch {
    
  }
}

function getWordRightMessage(word) {
  if (word.context.length === 0) {
    return rightAnswerText
  } else {
    return rightAnswerText + "\n\n" + "💬 " + word.context
  }
}