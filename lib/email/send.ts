'use server'

import { Resend } from 'resend'
import { generateHtmlTemplate } from './generateHtmlTemplate'
import { subjects } from './subjects'

const RESEND_API_KEY = process.env.RESEND_API_KEY

if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables')
}
const resend = new Resend(RESEND_API_KEY)

export type ContentKey = 'verification' | 
  'welcome' | 
  'subscription' | 
  'query' | 
  'invitation' |
  'generic'
  
export type Send = {
  from?: string;
  to?: string;
  contentKey: ContentKey;
  data?: string;
  subject?: string;
}

export async function send({
  from=process.env.RESEND_EMAIL_FROM as string,
  to=process.env.RESEND_EMAIL_TO as string,
  contentKey,
  data,
  subject
}: Send) {
  const html = generateHtmlTemplate({ data, contentKey })
  return resend.emails.send({
    from,
    to,
    subject: subject ? subject : subjects[contentKey],
    html
  });
}
