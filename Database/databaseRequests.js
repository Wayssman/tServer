import { DatabaseError } from '../Utilities/coreErrors.js'

export function fetchRandomWords(connection, limit) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM content ORDER BY RAND( ) LIMIT ${limit}`, (error, results) => {
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export function fetchFirstWord(connection, word) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM content WHERE LOWER(title) = '${word.toLowerCase()}' LIMIT 1`, (error, results) => {
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export function fetchChannelCounter(connection, channelId) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM channels_data WHERE channelId = '${channelId}' LIMIT 1`, (error, results) => {
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export function setChannelCounter(connection, channelId, newId) {
  return new Promise((resolve, reject) => {
    connection.query(`UPDATE channels_data SET id = ${newId} WHERE channelId = '${channelId}'`, (error, results) => {
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export function fetchWordById(connection, wordId) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM content WHERE id = '${wordId}' LIMIT 1`, (error, results) => {
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export function fetchWordsList(connection, page) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT title FROM content LIMIT 10 OFFSET ${(page - 1) * 10}`, (error, results) => {
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export function setChannelFavorite(connection, channelId, wordId) {
  return new Promise((resolve, reject) => {
    connection.query(`
      INSERT INTO user_favorites (chatId, contentId)
      VALUES ('${channelId}', '${wordId}')
      ON DUPLICATE KEY UPDATE chatId = chatId
      `, (error, results) => {
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export function deleteChannelFavorite(connection, channelId, wordId) {
  return new Promise((resolve, reject) => {
    connection.query(`
      DELETE FROM user_favorites
      WHERE chatId = '${channelId}' AND contentId = '${wordId}'
      `, (error, results) => {
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}

export function fetchFavoritesList(connection, channelId, page) {
  return new Promise((resolve, reject) => {
    connection.query(`
      SELECT * FROM user_favorites JOIN content ON contentId = id 
      WHERE chatId = '${channelId}' LIMIT 10 OFFSET ${(page - 1) * 10}
      `, (error, results) => {
      if (error) {
        reject(new DatabaseError(error.sqlMessage))
      }
      resolve(results)
    })
  })
}