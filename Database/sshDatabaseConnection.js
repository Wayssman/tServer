import 'dotenv/config'
import { Client } from 'ssh2'
import { databaseConfig } from './defaultDatabaseConnection.js'
import mysql from 'mysql2'

const sshClient = new Client()

const tunnelConfig = {
    host: process.env.SSH_HOST,
    port: 22,
    username: process.env.SSH_LOGIN,
    password: process.env.SSH_PASSWORD
}

const forwardConfig = {
    srcHost: '127.0.0.1',
    srcPort: 3306,
    dstHost: databaseConfig.host,
    dstPort: databaseConfig.port
}

export function sshConnection() {
    return new Promise((resolve, reject) => {
        sshClient.on('ready', () => {
            sshClient.forwardOut(
                forwardConfig.srcHost,
                forwardConfig.srcPort,
                forwardConfig.dstHost,
                forwardConfig.dstPort,
                (err, stream) => {
                    if (err) reject(err);

                    const updateDbServer = {
                        ...databaseConfig,
                        stream
                    }

                    const database = mysql.createConnection(updateDbServer)
                    database.connect((error) => {
                        if (error) {
                            console.error(error)
                            reject(error)
                        }
                        console.log("TEST: new connection!")
                        resolve(database)
                    })
                })
        }).connect(tunnelConfig)
    })
}