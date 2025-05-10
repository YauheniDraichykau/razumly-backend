import OpenAI from 'openai';
import { setTimeout as sleep } from 'node:timers/promises';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @param prompt
 * @param model
 */

export async function callOpenAi(
  prompt: string,
  model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo-0125',
): Promise<string> {
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const res = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });

      const text = res.choices?.[0]?.message?.content?.trim() ?? '';
      if (!text) throw new Error('LLM returned empty response');

      return text;
    } catch (err: any) {
      const isLast = attempt === maxAttempts;
      const delay = 500 * 2 ** (attempt - 1); // 0.5s, 1s, 2s

      if (isLast) {
        // try 3 times ‑ throwing an error if fails
        throw new Error(
          `OpenAI error after ${attempt} attempts: ${err.message ?? err}`,
        );
      }

      //log and wait before retrying
      console.warn(
        '[OpenAI] attempt',
        attempt,
        'failed → retry in',
        delay,
        'ms',
      );
      await sleep(delay);
    }
  }

  throw new Error('OpenAI failed');
}
