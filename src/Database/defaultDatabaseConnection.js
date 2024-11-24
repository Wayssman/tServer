import 'dotenv/config'
import mysql from 'mysql2'
import { Client } from 'ssh2'

const databaseConfig = {
    host: "127.0.0.1",
    port: 3306,
    user: process.env.DB_LOGIN,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}

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

const sshClient = new Client()
export const pool = await setupPool()

function sshConnection() {
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
                    
                    resolve(updateDbServer)
                })
        }).connect(tunnelConfig)
    })
}

async function setupPool() {
    if (process.env.BUILD === "release") {
        return await createPool(databaseConfig)
    } else {
        const sshConfig = await sshConnection()
        return await createPool(sshConfig)
    }
}

function createPool(config) {
    return new Promise((resolve) => {
        resolve(mysql.createPool(config))
    })
}

export function defaultConnection() {
    return new Promise((resolve, reject) => {
        pool.getConnection((error, connection) => {
            if (error) {
                console.error(error)
                reject(error)
            }
            console.log("TEST: new connection!")
            resolve(connection)
        })
    })
}