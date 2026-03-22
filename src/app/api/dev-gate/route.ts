import { NextRequest, NextResponse } from 'next/server';

const DEV_PASSWORD = 'duck123';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password !== DEV_PASSWORD) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set('mise-dev-access', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
