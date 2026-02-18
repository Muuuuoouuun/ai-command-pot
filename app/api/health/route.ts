import { NextResponse } from 'next/server';
import { getDashboardConnection } from '@/lib/data';

export async function GET() {
  const connection = await getDashboardConnection();
  return NextResponse.json(connection);
}
