export class CommandListError extends Error {
    constructor(args){
        super(args);
    }
}

export class CommandWordError extends Error {
    constructor(args){
        super(args);
    }
}

export class DatabaseError extends Error {
    constructor(args){
        super(args);
    }
}

export function getErrorDescription(error) {
    switch(true) {
        case error instanceof CommandListError:
            return "Ошибка! Ошибка формата ввода комманды. Перепроверьте формат комманды.\nФормат: /list x, где x - номер страницы.\nНа странице умещается 10 слов. Страницы начинаются с 1."
        case error instanceof CommandWordError:
            return "Ошибка! Ошибка формата ввода команды. Перепроверьте формат комманды.\nФормат: /word"
        case error instanceof DatabaseError:
            return "Ошибка! Ошибка чтения данных на сервере."
        default:
            return "Ошибка! Неизвестная ошибка."
    }
}