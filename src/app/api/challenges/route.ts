
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const jsonFilePath = path.join(process.cwd(), 'src', 'lib', 'challenges.ts');

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { challenges } = data;

    if (!challenges) {
      return NextResponse.json({ message: 'Invalid data format' }, { status: 400 });
    }

    const fileContent = `
import type { Challenge } from './types';

export const challenges: Challenge[] = ${JSON.stringify(challenges, null, 2)};
`;

    // We need to un-quote the keys to make it a valid TS file
    const formattedContent = fileContent.replace(/"([^"]+)":/g, '$1:');

    await fs.writeFile(jsonFilePath, formattedContent, 'utf-8');

    return NextResponse.json({ message: 'Challenges updated successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error writing to file' }, { status: 500 });
  }
}
