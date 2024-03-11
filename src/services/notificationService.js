const firebaseAdmin = require('firebase-admin')
const database = require('../models')
const models = database.models

// Инициализация Firebase Admin SDK
// TODO актуальный ключик

// const serviceAccount = require('path/to/your/serviceAccountKey.json')
// firebaseAdmin.initializeApp({
//   credential: firebaseAdmin.credential.cert(serviceAccount)
// })

/**
 * Отправка уведомления конкретному пользователю
 *
 * @param {Number} userId - ID пользователя
 * @param {String} title - Заголовок уведомления
 * @param {String} body - Текст уведомления
 */
async function sendNotification (userId, title, body) {
  try {
    const user = await models.User.findByPk(userId)
    if (!user || !user.fcm_token) {
      throw new Error('User not found or FCM Token not available')
    }

    const message = {
      token: user.fcm_token,
      notification: {
        title,
        body
      }
    }

    const response = await firebaseAdmin.messaging().send(message)
    console.log('Successfully sent message:', response)
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

module.exports = {
  sendNotification
}
