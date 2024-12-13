import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { ConnectionAndBody } from 'types'
import { getRedisFromEnv } from 'lib'
import { NextRequest, NextResponse } from 'next/server'
 
// Create an Anthropic API client (that's edge friendly)
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})
 
function createSystemPrompt({ isLong }: { isLong: boolean }) {
  return `Generate at least ${isLong ? '20' : '10'} multiple-choice questions based on the input. Return ONLY a valid JSON array, without any surrounding text, markdown formatting, or code block indicators. The array should contain objects with this structure:
  [
    {
      "question": string,
      "options": string[],
      "correctOptionIndex": number,
      "explanation": string
    }
  ]

  Rules:
  1. For short subjects, use your knowledge. For longer texts, use the provided content.
  2. Each question must have exactly 4 options.
  3. Do not include any options with 'All of the above' or 'None of the above'.
  4. 'explanation' should justify the correct answer.
  5. Include various difficulty levels.

  IMPORTANT: The output must start with '[' and end with ']', containing only valid JSON. Do not include any explanatory text, headings, or formatting.`
}

 
export async function POST(req: NextRequest) {
  // Extract the `prompt` from the body of the request
  try {
    const path = '/api/create/mcqs'
    const { body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    const { context } = await body
    console.log({ context })

    // calculate the number of questions to generate
    const len = context.length
    const isLong = len > 20_000 ? true : false
    console.log('api/mcqs', { isLong })

    const { textStream } = await streamText({
      model: anthropic('claude-3-haiku-20240307'),
      messages: [
        { role: 'system', content: createSystemPrompt({ isLong }) },
        { role: 'user', content: context }
      ],
    });

    // 
    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode("event: open\n\n"));
          try {
            for await (const chunk of textStream) {
              console.log('Sending chunk:', chunk);
              const message = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(message));
            }
          } catch (error) {
            console.error('Error in stream:', error);
          } finally {
            console.log('Stream ended, sending close event');
            const message = `data: ${JSON.stringify("[DONE]")}\n\n`
            controller.enqueue(encoder.encode(message));
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
