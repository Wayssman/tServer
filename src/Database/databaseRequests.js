import { defaultConnection } from './defaultDatabaseConnection.js'
import { DatabaseError } from '../Utilities/coreErrors.js'

export async function fetchRandomWords(limit) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM words ORDER BY RAND( ) LIMIT ${limit}`, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function fetchRandomWordsWithout(limit, word) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM words WHERE not(LOWER(title) = '${word.toLowerCase()}') ORDER BY RAND( ) LIMIT ${limit}`, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function fetchFirstWord(word) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM words WHERE LOWER(title) = '${word.toLowerCase()}' LIMIT 1`, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function fetchWordById(wordId) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM words WHERE id = '${wordId}' LIMIT 1`, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function fetchFactById(factId) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM facts WHERE id = '${factId}' LIMIT 1`, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function fetchChannelCounter(channelId) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM channels_data WHERE channelId = '${channelId}' LIMIT 1`, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function setWordChannelCounter(channelId, newId) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`UPDATE channels_data SET wordId = ${newId} WHERE channelId = '${channelId}'`, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function setFactChannelCounter(channelId, newId) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`UPDATE channels_data SET factId = ${newId} WHERE channelId = '${channelId}'`, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function fetchWordsList(page) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`SELECT title FROM words ORDER BY id LIMIT 10 OFFSET ${(page - 1) * 10}`, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function setChannelFavorite(channelId, wordId) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`
      INSERT INTO user_favorites (chatId, contentId)
      VALUES ('${channelId}', '${wordId}')
      ON DUPLICATE KEY UPDATE chatId = chatId
      `, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function deleteChannelFavorite(channelId, wordId) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`
      DELETE FROM user_favorites
      WHERE chatId = '${channelId}' AND contentId = '${wordId}'
      `, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function fetchFavoritesList(channelId, page) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`
      SELECT * FROM user_favorites JOIN content ON contentId = id 
      WHERE chatId = '${channelId}' ORDER BY id LIMIT 10 OFFSET ${(page - 1) * 10}
      `, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export async function fetchRandomFavorites(channelId, limit) {
  const connection = await defaultConnection()
  return new Promise((resolve, reject) => {
    connection.query(`
      SELECT * FROM user_favorites JOIN content ON contentId = id
      WHERE chatId = '${channelId}' ORDER BY RAND( ) LIMIT ${limit}
      `, (error, results) => {
      connection.release()
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}