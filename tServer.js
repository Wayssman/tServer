import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import 'dotenv/config'
import express from 'express'
import mysql from 'mysql2'
import bodyParser from 'body-parser'

// Setup Connections
const bot = new Telegraf(String(process.env.BOT_TOKEN))
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

bot.on(message('text'), async (ctx) => {
  getMessage(ctx)
})

function getMessage(ctx) {
  mysqlConnection.query(
    "SELECT * FROM content",
    (err, results, fields) => {
      if (!err) {
        console.log(results[0].Message)
        sendToBot(ctx, results[0].Message)
      } else {
        console.log(err)
      }
    }
  )
}

async function sendToBot(ctx, message) {
  await ctx.sendMessage(`Message is: ${message}`)
}