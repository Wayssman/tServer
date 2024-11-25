const rightAnswerText = "💡 Верно!"
const wrongAnswerText = "🙅🏻‍♂️ Не угадал. Попробуй еще раз!"

export function handleButtonAction(ctx) {
    const data = ctx.callbackQuery.data
    const parsed = data.split(",")
    const variantIndex = parsed[1]
    const rightVariantIndex = parsed[2]
  
    ctx.answerCbQuery(variantIndex === rightVariantIndex ? rightAnswerText : wrongAnswerText, {
      show_alert: true
    })
}