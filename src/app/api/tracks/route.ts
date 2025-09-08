
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const jsonFilePath = path.join(process.cwd(), 'src', 'lib', 'tracks.json');

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { tracks } = data;

    if (!tracks) {
      return NextResponse.json({ message: 'Invalid data format' }, { status: 400 });
    }

    const fileData = await fs.readFile(jsonFilePath, 'utf-8');
    const jsonObj = JSON.parse(fileData);
    jsonObj.tracks = tracks;

    await fs.writeFile(jsonFilePath, JSON.stringify(jsonObj, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Tracks updated successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error writing to file' }, { status: 500 });
  }
}
