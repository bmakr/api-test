import { generateBodyContent } from "./generateBodyContent"
import { htmlLogo } from "./htmlLogo"
import { ContentKey } from "./send"

const stylesDefault = `
  @media only screen and (max-width: 600px) {
  .container {
    width: 100% !important;
    padding: 20px !important;
  }
}
`

export function generateHtmlTemplate({
  contentKey,
  data = '',
}: {
  data?: string;
  contentKey: ContentKey;
}) {
  return `
    <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          ${stylesDefault}
        </style>
      </head>
      <body style='font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;'>
        <div style='padding: 40px; max-width: 600px; margin: 0 auto; padding: 40px; background: white;'>
          ${htmlLogo}
          ${generateBodyContent({ data, contentKey })}

          <div style='color: #999; font-size: 14px; margin-top: 30px; max-width: 350px;'>
            <p>This is an automated message, but you can respond to this email with any questions and a human will respond.</p>
          </div>
        </div>
        <p style='color: #999; font-size: 12px; text-align: center;'>
          &copy; ${new Date().getFullYear()} Actualed, Inc. All rights reserved.
        </p>
      </body>
      </html>`
}