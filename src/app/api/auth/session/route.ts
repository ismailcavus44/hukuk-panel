import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const access_token: string | undefined = body?.access_token
    const refresh_token: string | undefined = body?.refresh_token

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'missing tokens' }, { status: 400 })
    }

    // Basit Origin kontrolü (aynı origin'den gelmeyen istekleri reddet)
    const origin = req.headers.get('origin') || ''
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || ''
    if (allowedOrigin && origin && origin !== allowedOrigin) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const sb = supabaseServer()
    const { error } = await sb.auth.setSession({ access_token, refresh_token })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (_e: unknown) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
}


