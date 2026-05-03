import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import {
  buildBatchJsonl,
  extractImageResults,
  parsePromptInput,
  sanitizeFileStem,
} from './openai-image-batch.mjs';

describe('parsePromptInput', () => {
  it('parses JSON prompt arrays', () => {
    const records = parsePromptInput(
      JSON.stringify([
        {
          custom_id: 'france-1',
          prompt: 'A watercolor map portrait of France',
          size: '1024x1024',
        },
      ]),
      'prompts.json',
    );

    expect(records).toEqual([
      {
        custom_id: 'france-1',
        prompt: 'A watercolor map portrait of France',
        size: '1024x1024',
      },
    ]);
  });

  it('parses JSONL prompt records', () => {
    const records = parsePromptInput(
      [
        '{"custom_id":"italy-1","prompt":"Italian coastal architecture","quality":"medium"}',
        '{"custom_id":"spain-1","prompt":"Spanish mountain village"}',
      ].join('\n'),
      'prompts.jsonl',
    );

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      custom_id: 'italy-1',
      quality: 'medium',
    });
  });

  it('parses CSV prompt records with quoted commas', () => {
    const records = parsePromptInput(
      'custom_id,prompt,output_format\nportugal-1,"A poster of Lisbon, with blue tiles",webp',
      'prompts.csv',
    );

    expect(records).toEqual([
      {
        custom_id: 'portugal-1',
        prompt: 'A poster of Lisbon, with blue tiles',
        output_format: 'webp',
      },
    ]);
  });

  it('requires custom IDs and prompts', () => {
    expect(() => parsePromptInput('[{"custom_id":"missing-prompt"}]', 'prompts.json')).toThrow(
      'missing prompt',
    );
  });
});

describe('buildBatchJsonl', () => {
  it('builds image generation batch request lines', () => {
    const jsonl = buildBatchJsonl([
      {
        custom_id: 'france-1',
        prompt: 'A French impressionist garden',
        quality: 'high',
      },
    ]);

    expect(jsonl.trim().split('\n').map((line) => JSON.parse(line))).toEqual([
      {
        custom_id: 'france-1',
        method: 'POST',
        url: '/v1/images/generations',
        body: {
          model: 'gpt-image-2',
          prompt: 'A French impressionist garden',
          quality: 'high',
        },
      },
    ]);
  });
});

describe('sanitizeFileStem', () => {
  it('keeps file names stable and filesystem-safe', () => {
    expect(sanitizeFileStem(' France / batch #1! ')).toBe('France-batch-1');
    expect(sanitizeFileStem('')).toBe('image');
  });
});

describe('extractImageResults', () => {
  it('extracts base64 images and preserves failed entries', () => {
    const imageBase64 = Buffer.from('fake png bytes').toString('base64');
    const jsonl = [
      JSON.stringify({
        custom_id: 'france-1',
        response: {
          status_code: 200,
          body: {
            output_format: 'webp',
            data: [{ b64_json: imageBase64 }],
          },
        },
        error: null,
      }),
      JSON.stringify({
        custom_id: 'italy-1',
        response: {
          status_code: 400,
          body: { error: { message: 'Bad request' } },
        },
        error: null,
      }),
    ].join('\n');

    const results = extractImageResults(jsonl);

    expect(results.images).toEqual([
      {
        customId: 'france-1',
        b64Json: imageBase64,
        outputFormat: 'webp',
        raw: expect.any(Object),
      },
    ]);
    expect(results.failures).toHaveLength(1);
    expect(results.failures[0].custom_id).toBe('italy-1');
  });
});
