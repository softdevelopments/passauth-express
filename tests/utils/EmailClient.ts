import { EmailClient } from "@passauth/email-plugin/interfaces";

export class EmailClientTest implements EmailClient {
  async send(_emailData: {
    senderName: string;
    from: string;
    to: string[];
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {}
}
