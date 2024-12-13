import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { getRedisFromEnv, titlePrompt } from 'lib'
import { ConnectionAndBody } from 'types'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(req: NextRequest) {
  try {
    const path = '/api/create/text'
    const { body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    const { context } = body

    if (!context) {
      return NextResponse.json({ error: 'Prompt cannot be empty' }, { status: 400 })
    }

    const { textStream } = await streamText({
      model: anthropic('claude-2.1'),
      messages: [
        { role: 'system', content: titlePrompt },
        { role: 'user', content: context }
      ],
    });

    // console.log('Stream created')

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode("event: open\n\n"));
          try {
            for await (const chunk of textStream) {
              // console.log('Sending chunk:', chunk);
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
    console.error('Error in API route:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}