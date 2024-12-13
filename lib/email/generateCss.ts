import { KeyValues } from "types";
import { ContentKey } from "./send";

const cssToAdd : KeyValues = {
  verification: `
    .instructions {
      color: #666;
      line-height: 1.5;
      margin-bottom: 30px;
    }
    .code {
      text-align: center;
      font-size: 32px;
      letter-spacing: 8px;
      font-weight: bold;
      color: #333;
      margin: 30px 0;
      padding: 20px;
      background: #f8f8f8;
      border-radius: 8px;
    }
  `
}

export function generateCss({ contentKey }: { contentKey: ContentKey }) {
  return cssToAdd[contentKey]
}