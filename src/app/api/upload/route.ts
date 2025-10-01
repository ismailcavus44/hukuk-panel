import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File
  const caseId = String(form.get('case_id') || '')
  if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 })

  // Temel içerik doğrulama: boyut ve mime/uzantı kısıtları
  const MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25MB
  if ((file as any)?.size && (file as any).size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'file too large' }, { status: 413 })
  }
  const allowedMime = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  ]
  if (file.type && !allowedMime.includes(file.type)) {
    return NextResponse.json({ error: 'unsupported file type' }, { status: 415 })
  }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${caseId || 'unassigned'}/${randomUUID()}.${ext || 'bin'}`

  // Storage upload (owner metadata ile)
  const { error: upErr } = await sb.storage.from('documents')
    .upload(path, file, { upsert: false, contentType: file.type, metadata: { owner: user.id } })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  // DB kaydı
  const { error: dbErr } = await sb.from('documents').insert({
    case_id: caseId || null,
    name: file.name,
    storage_path: path,
    mime_type: file.type,
    uploaded_by: user.id
  })
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

  return NextResponse.json({ ok: true, path })
}




