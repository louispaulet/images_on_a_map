#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_BATCH_DIR = '.cache/openai-image-batches';
const DEFAULT_INPUT_JSONL = `${DEFAULT_BATCH_DIR}/input.jsonl`;
const DEFAULT_OUTPUT_DIR = `${DEFAULT_BATCH_DIR}/images`;
const DEFAULT_MODEL = 'gpt-image-2';
const DEFAULT_ENDPOINT = '/v1/images/generations';
const DEFAULT_COMPLETION_WINDOW = '24h';
const TERMINAL_BATCH_STATUSES = new Set(['completed', 'failed', 'expired', 'cancelled']);
const OPTIONAL_IMAGE_FIELDS = ['size', 'quality', 'output_format', 'background'];

export function parseCliArgs(argv) {
  const [command = 'help', ...tokens] = argv;
  const options = {};

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    const key = rawKey.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());

    if (inlineValue !== undefined) {
      options[key] = inlineValue;
      continue;
    }

    const nextToken = tokens[index + 1];
    if (!nextToken || nextToken.startsWith('--')) {
      options[key] = true;
      continue;
    }

    options[key] = nextToken;
    index += 1;
  }

  return { command, options };
}

export function parsePromptInput(source, inputPath = '') {
  const extension = extname(inputPath).toLowerCase();
  const trimmed = source.trim();

  if (!trimmed) {
    return [];
  }

  if (extension === '.csv') {
    return normalizePromptRows(parseCsv(trimmed));
  }

  if (extension === '.jsonl' || extension === '.ndjson') {
    return normalizePromptRows(
      trimmed
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line, index) => parseJsonLine(line, index + 1)),
    );
  }

  const parsed = JSON.parse(trimmed);
  if (!Array.isArray(parsed)) {
    throw new Error('Prompt JSON input must be an array of objects.');
  }

  return normalizePromptRows(parsed);
}

export function buildBatchRequest(record, defaults = {}) {
  const body = {
    model: defaults.model ?? DEFAULT_MODEL,
    prompt: record.prompt,
  };

  for (const field of OPTIONAL_IMAGE_FIELDS) {
    const value = record[field] ?? defaults[field];
    if (value !== undefined && value !== null && value !== '') {
      body[field] = value;
    }
  }

  return {
    custom_id: record.custom_id,
    method: 'POST',
    url: defaults.endpoint ?? DEFAULT_ENDPOINT,
    body,
  };
}

export function buildBatchJsonl(records, defaults = {}) {
  return records.map((record) => JSON.stringify(buildBatchRequest(record, defaults))).join('\n') + '\n';
}

export function sanitizeFileStem(customId) {
  const stem = String(customId)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

  return stem || 'image';
}

export function extractImageResults(outputJsonl) {
  const images = [];
  const failures = [];

  for (const line of outputJsonl.split(/\r?\n/).filter(Boolean)) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch (error) {
      failures.push({ line, error: `Invalid JSONL output line: ${error.message}` });
      continue;
    }

    const response = entry.response;
    const body = response?.body;
    const image = body?.data?.[0];

    if (entry.error || response?.status_code !== 200 || !image?.b64_json) {
      failures.push(entry);
      continue;
    }

    images.push({
      customId: entry.custom_id,
      b64Json: image.b64_json,
      outputFormat: normalizeOutputFormat(body.output_format ?? image.output_format),
      raw: entry,
    });
  }

  return { images, failures };
}

export async function prepareBatchInput({ inputPath, outputPath = DEFAULT_INPUT_JSONL, defaults = {} }) {
  if (!inputPath) {
    throw new Error('Missing --input path.');
  }

  const source = await readFile(resolve(inputPath), 'utf8');
  const records = parsePromptInput(source, inputPath);
  const jsonl = buildBatchJsonl(records, defaults);
  const resolvedOutputPath = resolve(outputPath);

  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, jsonl, 'utf8');

  return { outputPath: resolvedOutputPath, count: records.length };
}

export async function submitBatch({ inputPath = DEFAULT_INPUT_JSONL, apiKey = getApiKey() }) {
  const resolvedInputPath = resolve(inputPath);
  const inputFile = await uploadBatchFile(resolvedInputPath, apiKey);
  const batch = await openAiJson('/batches', apiKey, {
    method: 'POST',
    body: {
      input_file_id: inputFile.id,
      endpoint: DEFAULT_ENDPOINT,
      completion_window: DEFAULT_COMPLETION_WINDOW,
      metadata: {
        description: 'OpenAI image generation batch',
      },
    },
  });

  return { inputFile, batch };
}

export async function retrieveBatch({ batchId, apiKey = getApiKey() }) {
  if (!batchId) {
    throw new Error('Missing --batch-id.');
  }

  return openAiJson(`/batches/${encodeURIComponent(batchId)}`, apiKey);
}

export async function downloadBatchResults({ batchId, outDir = DEFAULT_OUTPUT_DIR, apiKey = getApiKey() }) {
  const batch = await retrieveBatch({ batchId, apiKey });

  if (!batch.output_file_id) {
    throw new Error(`Batch ${batch.id} does not have an output_file_id yet. Current status: ${batch.status}`);
  }

  const resolvedOutDir = resolve(outDir);
  await mkdir(resolvedOutDir, { recursive: true });

  const outputJsonl = await openAiText(`/files/${encodeURIComponent(batch.output_file_id)}/content`, apiKey);
  const rawOutputPath = resolve(resolvedOutDir, 'batch_output.jsonl');
  await writeFile(rawOutputPath, outputJsonl, 'utf8');

  const { images, failures } = extractImageResults(outputJsonl);
  const writtenImages = await writeDecodedImages(images, resolvedOutDir);
  let errorPath = null;

  if (batch.error_file_id) {
    errorPath = resolve(resolvedOutDir, 'batch_errors.jsonl');
    const errorJsonl = await openAiText(`/files/${encodeURIComponent(batch.error_file_id)}/content`, apiKey);
    await writeFile(errorPath, errorJsonl, 'utf8');
  } else if (failures.length > 0) {
    errorPath = resolve(resolvedOutDir, 'decode_errors.jsonl');
    await writeFile(errorPath, failures.map((failure) => JSON.stringify(failure)).join('\n') + '\n', 'utf8');
  }

  return {
    batch,
    rawOutputPath,
    errorPath,
    writtenImages,
    failureCount: failures.length,
  };
}

export async function runBatch({ inputPath, outDir = DEFAULT_OUTPUT_DIR, pollIntervalMs = 30000, apiKey = getApiKey() }) {
  const prepared = await prepareBatchInput({ inputPath });
  const submitted = await submitBatch({ inputPath: prepared.outputPath, apiKey });
  const batch = await waitForBatch(submitted.batch.id, { apiKey, pollIntervalMs });

  if (batch.status !== 'completed') {
    throw new Error(`Batch ${batch.id} ended with status: ${batch.status}`);
  }

  const downloaded = await downloadBatchResults({ batchId: batch.id, outDir, apiKey });
  return { prepared, submitted, batch, downloaded };
}

async function waitForBatch(batchId, { apiKey, pollIntervalMs }) {
  let batch = await retrieveBatch({ batchId, apiKey });

  while (!TERMINAL_BATCH_STATUSES.has(batch.status)) {
    console.log(`Batch ${batch.id} status: ${batch.status}. Checking again in ${pollIntervalMs}ms.`);
    await sleep(pollIntervalMs);
    batch = await retrieveBatch({ batchId, apiKey });
  }

  return batch;
}

async function writeDecodedImages(images, outDir) {
  const usedNames = new Map();
  const written = [];

  for (const image of images) {
    const baseStem = sanitizeFileStem(image.customId);
    const seen = usedNames.get(baseStem) ?? 0;
    usedNames.set(baseStem, seen + 1);

    const stem = seen === 0 ? baseStem : `${baseStem}-${seen + 1}`;
    const path = resolve(outDir, `${stem}.${image.outputFormat}`);
    await writeFile(path, Buffer.from(image.b64Json, 'base64'));
    written.push({ customId: image.customId, path });
  }

  return written;
}

async function uploadBatchFile(inputPath, apiKey) {
  const formData = new FormData();
  const fileBuffer = await readFile(inputPath);
  const fileBlob = new Blob([fileBuffer], { type: 'application/jsonl' });

  formData.append('purpose', 'batch');
  formData.append('file', fileBlob, basename(inputPath));

  return openAiJson('/files', apiKey, {
    method: 'POST',
    body: formData,
  });
}

async function openAiJson(path, apiKey, options = {}) {
  const response = await openAiFetch(path, apiKey, options);
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(formatApiError(response.status, json));
  }

  return json;
}

async function openAiText(path, apiKey) {
  const response = await openAiFetch(path, apiKey);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`OpenAI API request failed with status ${response.status}: ${text}`);
  }

  return text;
}

async function openAiFetch(path, apiKey, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set('Authorization', `Bearer ${apiKey}`);

  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  });
}

function parseJsonLine(line, lineNumber) {
  try {
    return JSON.parse(line);
  } catch (error) {
    throw new Error(`Invalid JSON on line ${lineNumber}: ${error.message}`);
  }
}

function normalizePromptRows(rows) {
  return rows.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`Prompt row ${index + 1} must be an object.`);
    }

    const customId = String(row.custom_id ?? '').trim();
    const prompt = String(row.prompt ?? '').trim();

    if (!customId) {
      throw new Error(`Prompt row ${index + 1} is missing custom_id.`);
    }

    if (!prompt) {
      throw new Error(`Prompt row ${index + 1} is missing prompt.`);
    }

    const normalized = {
      custom_id: customId,
      prompt,
    };

    for (const field of OPTIONAL_IMAGE_FIELDS) {
      if (row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '') {
        normalized[field] = String(row[field]).trim();
      }
    }

    return normalized;
  });
}

function parseCsv(source) {
  const rows = parseCsvRows(source);
  const [headers, ...dataRows] = rows;

  if (!headers) {
    return [];
  }

  return dataRows
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) =>
      Object.fromEntries(headers.map((header, index) => [header.trim(), row[index]?.trim() ?? ''])),
    );
}

function parseCsvRows(source) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += character;
  }

  row.push(cell);
  rows.push(row);

  return rows;
}

function normalizeOutputFormat(format) {
  if (format === 'jpeg' || format === 'webp') {
    return format;
  }

  return 'png';
}

function formatApiError(status, json) {
  const message = json?.error?.message ?? JSON.stringify(json);
  return `OpenAI API request failed with status ${status}: ${message}`;
}

function getApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required.');
  }

  return apiKey;
}

function sleep(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function printHelp() {
  console.log(`Usage:
  node scripts/openai-image-batch.mjs prepare --input prompts.json --output ${DEFAULT_INPUT_JSONL}
  node scripts/openai-image-batch.mjs submit --input ${DEFAULT_INPUT_JSONL}
  node scripts/openai-image-batch.mjs status --batch-id batch_...
  node scripts/openai-image-batch.mjs download --batch-id batch_... --out-dir ${DEFAULT_OUTPUT_DIR}
  node scripts/openai-image-batch.mjs run --input prompts.json --out-dir ${DEFAULT_OUTPUT_DIR}

Input rows must include custom_id and prompt. JSON, JSONL, and CSV are supported.
Set OPENAI_API_KEY in the environment before calling OpenAI.`);
}

async function main(argv) {
  const { command, options } = parseCliArgs(argv);

  if (command === 'help' || options.help) {
    printHelp();
    return;
  }

  if (command === 'prepare') {
    const result = await prepareBatchInput({ inputPath: options.input, outputPath: options.output ?? DEFAULT_INPUT_JSONL });
    console.log(`Wrote ${result.count} batch requests to ${result.outputPath}`);
    return;
  }

  if (command === 'submit') {
    const result = await submitBatch({ inputPath: options.input ?? DEFAULT_INPUT_JSONL });
    console.log(JSON.stringify(result.batch, null, 2));
    return;
  }

  if (command === 'status') {
    const batch = await retrieveBatch({ batchId: options.batchId });
    console.log(JSON.stringify(batch, null, 2));
    return;
  }

  if (command === 'download') {
    const result = await downloadBatchResults({ batchId: options.batchId, outDir: options.outDir ?? DEFAULT_OUTPUT_DIR });
    console.log(`Downloaded ${result.writtenImages.length} images to ${resolve(options.outDir ?? DEFAULT_OUTPUT_DIR)}`);
    if (result.errorPath) {
      console.log(`Wrote errors to ${result.errorPath}`);
    }
    return;
  }

  if (command === 'run') {
    const result = await runBatch({
      inputPath: options.input,
      outDir: options.outDir ?? DEFAULT_OUTPUT_DIR,
      pollIntervalMs: Number(options.pollIntervalMs ?? 30000),
    });
    console.log(`Batch ${result.batch.id} completed. Downloaded ${result.downloaded.writtenImages.length} images.`);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
