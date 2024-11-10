import 'dotenv/config'

const config = {
  development: {
    sms: {
      apiKey: process.env.SMS_RU_API_KEY,
      apiUrl: 'https://sms.ru/sms/send?json=1',
      testMode: process.env.SMS_RU_TEST_MODE || false,
      senderName: process.env.SMS_RU_SENDER_NAME || false,
      passwordRecoveryCodeSMSText: process.env.SMS_PASSWORD_RECOVERY_CODE_TEXT || 'Code for password recovery:'
    },
    database: {
      username: process.env.DEV_DB_USERNAME,
      password: process.env.DEV_DB_PASSWORD,
      database: process.env.DEV_DB_NAME || 'postgres',
      host: process.env.DEV_DB_HOST || '127.0.0.1',
      port: process.env.DEV_DB_PORT || 5432,
      dialect: 'postgres',
      dialectOptions: {
        bigNumberStrings: true
      },
      logging: false
    },
    apn: {
      key_id: process.env.APN_KEY_ID,
      team_id: process.env.APN_TEAM_ID,
      topic: process.env.APN_TOPIC
    },
    order_geo_update_interval: process.env.ORDER_GEO_UPDATE_INTERVAL || 3600000
  }
  // production: {
  //   username: process.env.PROD_DB_USERNAME,
  //   password: process.env.PROD_DB_PASSWORD,
  //   database: process.env.PROD_DB_NAME,
  //   host: process.env.PROD_DB_HOST,
  //   port: process.env.PROD_DB_PORT || 5432,
  //   dialect: 'postgres',
  //   dialectOptions: {
  //     bigNumberStrings: true,
  //     ssl: {
  //       require: true,
  //       rejectUnauthorized: false
  //     }
  //   },
  //   logging: false
  // }
}

/**
 * @typedef {Object} DatabaseConfig
 * @property {string} username
 * @property {string} password
 * @property {string} database
 * @property {string} host
 * @property {number} port
 * @property {string} dialect
 * @property {Object} dialectOptions
 * @property {boolean} [logging]
 */

/**
 * @typedef {Object} Config
 * @property {Object.<string, number>} roles
 * @property {DatabaseConfig} database
 */

/** @type {Config} */
export default config[process.env.NODE_ENV || 'development']
