export class DatabaseError extends Error {
    constructor(args){
        super(args)
    }
}

export class ArgumentParseError extends Error {
    constructor(args) {
        super(args)
    }
}

export class PostError extends Error {
    constructor(args) {
        super(args)
    }
}

export function getErrorDescription(error) {
    switch(true) {
        case error instanceof DatabaseError:
            return "Ошибка! Ошибка чтения данных на сервере."
        case error instanceof ArgumentParseError:
            switch (error.message) {
                case "list":
                    return "Ошибка! Ошибка формата ввода команды. Перепроверьте формат.\nФормат: /list x, где x - номер страницы.\nНа странице умещается 10 слов. Страницы начинаются с 1." 
                case "word":
                    return "Ошибка! Ошибка формата ввода команды. Перепроверьте формат. \nФормат: word, где word - нужное слово. Или word togroup для отправки в канал."
                case "quiz":
                    return "Ошибка! Ошибка формата ввода команды. Перепроверьте формат.\nФормат: /word"
                default:
                    return "Ошибка! Ошибка формата ввода."
            }
        case error instanceof PostError:
            switch (error.message) {
                case "not found":
                    return "Ошибка! Не найдено слово в базе."
                default:
                    return "Ошибка! Неизвестная ошибка."
            }
        default:
            return "Ошибка! Неизвестная ошибка."
    }
}