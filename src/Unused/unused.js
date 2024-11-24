export async function assembleWordQuiz(chatId) {
    try {
        // Вытаскиваем 4 случайны записи из БД
        const words = await dbFunctions.fetchRandomWords(4)

        // Проверка на пустой список
        if (words.length < 1) {
            throw new coreErrors.QuizError("empty")
        }

        // Зададим первое слово из списка, как главное
        const mainWord = words[0]

        // Формируем сообщение и викторину
        const message = getWordQuizMessage("Новое слово дня! Угадаешь ли ты?", mainWord)
        const hint = getWordHint(mainWord)
        const quizVariants = getWordQuizVariants(mainWord, words)

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

export async function assembleWordFavoritesQuiz(chatId) {
    try {
        // Вытаскиваем 4 случайны записи из БД
        const words = await dbFunctions.fetchRandomFavorites(chatId, 4)

        // Проверка на пустой список
        if (words.length < 1) {
            throw new coreErrors.QuizError("empty")
        }

        // Зададим первое слово из списка, как главное
        const mainWord = words[0]

        // Формируем сообщение и викторину
        const message = getWordQuizMessage("Новое слово дня! Угадаешь ли ты?", mainWord)
        const hint = getWordHint(mainWord)
        const quizVariants = getWordQuizVariants(mainWord, words)

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

function getWordQuizMessage(title, word) {
    const titleMessage = `*${makeSafe(`${title}`)}* \n\n`
    const postMessage = makeSafe(word.message)
    const imageMessage = `[\u200B](${word.image})`

    const fullMessage = titleMessage + postMessage + imageMessage
    return fullMessage
}

function getWordHint(word) {
    return word.accent
}

async function assemblePost(chatId, word) {
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

        // Формируем пост
        const postMessage = getPostMessage(postWord)
        const quizData = await getQuizForWord(chatId, postWord)
        const hint = quizData[0]
        const quizVariants = quizData[1]

        // Отсылаем пост в бот
        await bot.telegram.sendMessage(chatId, postMessage, {
            parse_mode: "MarkdownV2",
            reply_markup: postFooterButtons.reply_markup
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

export async function assembleScheduledPost(chatId) {
    try {
        // Вытаскиваем счетчик
        const counter = await dbFunctions.fetchChannelCounter(chatId)
        if (counter.length === 0) {
            throw new Error("Can't fetch channel counter")
        }

        // По id из счетчика вытаскиваем слово
        const wordId = counter[0].id
        const searchResult = await dbFunctions.fetchWordById(wordId)
        if (searchResult.length === 0) {
            throw new Error("Reached the end of the Database")
        }
        const postWord = searchResult[0]
        if (postWord.length === 0) {
            throw new Error("Found word is empty")
        }

        // Формируем пост
        const postMessage = getPostMessage(postWord)
        const quizData = await getQuizForWord(chatId, postWord)
        const hint = quizData[0]
        const quizVariants = quizData[1]

        // Отсылаем пост в бот
        await bot.telegram.sendMessage(chatId, postMessage, {
            parse_mode: "MarkdownV2",
            reply_markup: postFooterButtons.reply_markup
        })
        await bot.telegram.sendQuiz(chatId, "Какое это слово?", quizVariants[0], {
            correct_option_id: quizVariants[1],
            explanation: hint
        })

        dbFunctions.setChannelCounter(chatId, wordId + 1)
    } catch (error) {
        console.error(error)
    }
}

bot.action('word', async (ctx) => {
    await assembleQuiz(ctx.chat.id)
    sendMenu(ctx)
  })
  
  bot.action('wordfavorites', async (ctx) => {
    await assembleFavoritesQuiz(ctx.chat.id)
    sendFavorites(ctx)
  })
  
  bot.action('tofavorites', async (ctx) => {
    openFavorites(ctx)
  })
  
  bot.action('tofavoriteslist', async (ctx) => {
    openFavoritesList(ctx)
  })
  
  bot.action(/listfavorites.+/, async (ctx) => {
    assembleFavoritesList(ctx.chat.id, ctx.callbackQuery.data)
  })
  
  bot.action('favorite', async (ctx) => {
    const message = await bot.telegram.sendMessage(ctx.chat.id, "Добавить в избранное", {
      reply_markup: {
        force_reply: true,
        input_field_placeholder: "Введи слово"
      }
    })
  
    ctx.session = {
      favoriteMessageId: message?.message_id
    }
  })
  
  bot.action('unfavorite', async (ctx) => {
    const message = await bot.telegram.sendMessage(ctx.chat.id, "Удалить из избранного", {
      reply_markup: {
        force_reply: true,
        input_field_placeholder: "Введи слово"
      }
    })
  
    ctx.session = {
      unfavoriteMessageId: message?.message_id
    }
  })
  
  bot.action('tomenu', async (ctx) => {
    openMenu(ctx)
  })

  bot.command('start', async (ctx) => {
    sendStart(ctx)
  })
  
  bot.command('word', async (ctx) => {
    assembleQuiz(ctx.chat.id)
  })
  
  bot.command('wordfavorites', async (ctx) => {
    assembleFavoritesQuiz(ctx.chat.id)
  })
  
  bot.command('list', async (ctx) => {
    assembleList(ctx.chat.id, ctx.message.text)
  })
  
  bot.command('favorite', async (ctx) => {
    favorite(ctx.chat.id, ctx.message.text)
  })
  
  bot.command('unfavorite', async (ctx) => {
    unfavorite(ctx.chat.id, ctx.message.text)
  })
  
  bot.command('listfavorites', async (ctx) => {
    assembleFavoritesList(ctx.chat.id, ctx.message.text)
  })

  bot.on(message('text'), async (ctx) => {
    const replyMessageId = ctx.message?.reply_to_message?.message_id || "NoReply"
    const favoriteMessageId = ctx.session?.favoriteMessageId || "NoFavorite"
    const unfavoriteMessageId = ctx.session?.unfavoriteMessageId || "NoUnfavorite"
  
    switch (replyMessageId) {
      case favoriteMessageId:
        await favorite(ctx.chat.id, "/favorite " + ctx.message.text)
        await sendFavoritesList(ctx)
        break
      case unfavoriteMessageId:
        await unfavorite(ctx.chat.id, "/unfavorite " + ctx.message.text)
        await sendFavoritesList(ctx)
        break
      case "NoReply":
        // Распознаем сообщения только от админа
        if (ctx.message.from.username === process.env.TELEGRAM_ADMIN_NAME) {
          // Читаем сообщение от админа и передаем в обработчик комманд
          await handleAdminMessage(ctx.message.chat.id, ctx.message.text)
        }
        break
      default:
        return
    }
  })

  export function getNumberArgument(text, commandTag) {
    const result = getWordArgument(text, commandTag)
    const word = result[0]
    const pageWord = result[1]

    const page = parseInt(pageWord, 10)
    if (isNaN(page)) {
        throw new ArgumentParseError(commandTag)
    }
    if (page < 1) {
        throw new ArgumentParseError(commandTag)
    }
    return [word, page]
}