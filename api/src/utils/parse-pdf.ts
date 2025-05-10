import { readFile } from 'fs/promises';
import pdfParse from 'pdf-parse';

/**
 * @param path absolute path to the file (s3://… I will do that furher)
 * @throws Error if fails to parse text
 */
export async function parsePdf(path: string): Promise<string> {
  if (!path) throw new Error('PDF path is empty');

  const buffer = await readFile(path);

  // pdf-parse will return { text, numpages, … }
  const data = await pdfParse(buffer);

  if (!data.text?.trim()) {
    throw new Error('Parsed PDF contains no extractable text');
  }

  return data.text.replace(/\n{3,}/g, '\n\n').trim();
}
