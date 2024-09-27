import { getMessaging } from 'firebase-admin/messaging'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../config/config.js'
import { Provider, Notification } from '@parse/node-apn'
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function sendNotification (title, body, data, token, deviceType) {
  try {
    if (deviceType === 'android') {
      const message = {
        data,
        notification: {
          title,
          body
        },
        android: {
          notification: {
            title,
            body
          }
        },
        token
      };

      await getMessaging().send(message)
        .then((response) => {
          console.log('Successfully sent message:', response);
        })
        .catch((error) => {
          console.log('Error sending message:', error);
        })
    } else {
      const options = {
        token: {
          key: path.join(__dirname, '..', '..', 'AuthKey.p8'),
          keyId: config.apn.key_id,
          teamId: config.apn.team_id
        },
        production: true
      };

      const apnProvider = new Provider(options);

      const note = new Notification({
        alert: {
          title,
          body
        },
        sound: 'default',
        badge: 1,
        payload: data,
        topic: config.apn.topic
      });

      apnProvider.send(note, token).then((result) => {
        console.log('result send: ', JSON.stringify(result))
      }).catch((e) => console.log('e: ', e));
    }
  } catch (e) {
    console.log('something wrong with sending notification')
    console.error(e)
  }
}
