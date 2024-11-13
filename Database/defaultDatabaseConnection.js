import 'dotenv/config'
import mysql from 'mysql2'

export const databaseConfig = {
    host: "127.0.0.1",
    port: 3306,
    user: process.env.DB_LOGIN,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}

export function defaultConnection() {
    return new Promise((resolve, reject) => {
        const database = mysql.createConnection(databaseConfig)
        database.connect((error) => {
            if (error) {
                reject(error)
            }
            resolve(database)
        })
        database.on('error', function (err) {
            console.log(err)
        })
    })
}