import axios from 'axios';
import config from '../config/config.js'

export class SMSService {
  static buildApiUrl(msg, to) {
    if (!config.sms.apiKey) {
      throw new Error('No SMS.RU API key found in .env! Please add SMS_RU_API_KEY to .env.');
    }
    const from = config.sms.senderName ? `&from=${config.sms.senderName}` : '';
    const testMode = config.sms.testMode ? `&test=1` : '';
    const smsApiUrl = `${config.sms.apiUrl}&api_id=${config.sms.apiKey}&to=${to}&msg=${msg}${from}${testMode}`;
    console.log(`SMS API URL is ready: ${smsApiUrl}`);
    return smsApiUrl;
  }

  static normalizePhoneNumber(phone) {
    if (phone.startsWith('8')) {
      return phone.replace(/^8/, '7');
    }
    if (phone.startsWith('+')) {
      return phone.slice(1);
    }
    return phone;
  }

  static async sendSMS(text, phone) {
    try {
      const normalizedPhoneNumber = this.normalizePhoneNumber(phone);
      const smsSendUrl = this.buildApiUrl(text, normalizedPhoneNumber);
      const result = await axios.get(smsSendUrl);

      if (result.status !== 200) {
        console.error(`Error while sending SMS: ${result.statusText}`);
      }
      return result;
    } catch (error) {
      console.error(`Error while sending SMS: ${error}`);
    }
  }

  static async sendPasswordRecoveryCode(code, phone) {
    const text = `${config.sms.passwordRecoveryCodeSMSText} ${code}`;
    return await this.sendSMS(text, phone);
  }
}