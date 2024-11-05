import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import 'dotenv/config'
import mysql from 'mysql2'
import schedule from 'node-schedule'
import { parse } from 'path'
import express from 'express'

// Setup Connections
const bot = new Telegraf(String(process.env.BOT_TOKEN))
const app = express();
app.use(express.static('public'))
app.listen(3000, function () {
  console.log('Listening on http://localhost:3000/');
});
const mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'tserver',
  password: process.env.DB_PASS
})

// Launch Bot
bot.launch()
if (bot) bot.telegram.getMe().then((res) => console.log(`Bot started on https://t.me/${res.username}`))

// Bot bindings to graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Connect to database
mysqlConnection.connect((err) => {
  if (!err) {
    console.log("Connected")
  } else {
    console.log("Connection Failed")
    console.log(err)
  }
})

// Listeners
bot.on(message('text'), async (ctx) => {
  console.log(`Chat id is: ${ctx.message.chat.id}`)
  getMessage()
})

const job = schedule.scheduleJob('* * * * *', function() {
  getMessage()
})

// Internal Functions
function getMessage() {
  mysqlConnection.query(
    "SELECT * FROM content",
    (err, results, fields) => {
      if (!err) {
        sendToBot(process.env.CHAT_ID, results[0].Message)
      } else {
        console.log(err)
      }
    }
  )
}

function sendToBot(chatId, message) {
  bot.telegram.sendMessage(chatId, `Message from DB is: ${message}`)
  .then(() => {
    bot.telegram.sendMessage(process.env.CHAT_ID, "Message and etc...[\u200B](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8lF2jbNFBy7X4D6F43tRiCxG2oRWLP9v8LQ&s)", {
      //bot.telegram.sendMessage(process.env.CHAT_ID, "Message and etc...[\u200B](https://i.ibb.co/nBPqbmD/1.png)", {
      parse_mode: "markdown"
    })
    .then(() => {
      bot.telegram.sendQuiz(process.env.CHAT_ID, "Hello?", ["1", "2"], {
        correct_option_id: 0,
        explanation: "Правильное слово - воть"
      })
    })
  })
}