import { KeyValues } from "types";
import { ContentKey } from "./send";

const htmlValues: KeyValues = {
  verification: {
    '1': `
      <div style='color: #666;line-height: 1.5;margin-bottom: 30px;'>
        <h2>Verify Your Email Address</h2>
        <p>Please enter the following security code:</p>
      </div>
      <div style='text-align: center;font-size: 32px;letter-spacing: 8px;font-weight: bold;color: #333;margin: 30px 0;padding: 20px;background: #f8f8f8;border-radius: 8px;'>`,
    '2': `
          <div class="instructions" style='font-size: 14px;letter-spacing: 0px;'>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, you can safely ignore this email.</p>
          </div>
        </div>
    `
  },
  invitation: {
    '1': `<div style='color: #666;line-height: 1.5;margin-bottom: 30px;'>`,
    '2': `</div>`
  },
  generic: {
    '1': `<div style='color: #666;line-height: 1.5;margin-bottom: 30px;'>`,
    '2': `</div>`
  }
}

export function generateBodyContent({
  data,
  contentKey
}: {
  data: string;
  contentKey: ContentKey;
}) {
  const body = htmlValues[contentKey]
  return `
    ${body[1]}
    ${data ? data : ''}
    ${body[2] ? body[2] : ''}
  `
}