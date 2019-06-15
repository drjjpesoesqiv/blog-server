import { notEqual } from 'assert';
import { MAIL_SERVICE_URL } from '../config';
import axios from 'axios';

import * as qs from 'querystring';

export default class MailService {
  to:string;
  subject:string;
  message:string;

  constructor(params:any) {
    notEqual(params.to, undefined);
    notEqual(params.subject, undefined);
    notEqual(params.message, undefined);

    this.to = params.to;
    this.subject = params.subject;
    this.message = params.message;
  }

  send() {
    axios.post(MAIL_SERVICE_URL, qs.stringify({
      to: this.to,
      subject: this.subject,
      message: this.message
    }),{
      headers: {
        'Content-Type': "application/x-www-form-urlencoded"
      }
    });
  }
}
