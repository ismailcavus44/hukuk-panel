'use server'
import { supabaseServer } from '@/lib/supabase/server'

export async function saveCalc(data: {case_id?: string; type: 'kidem'|'ihbar'; input: unknown; result: unknown}) {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Giriş gerekli')
  const { error } = await sb.from('calculations').insert({
    case_id: data.case_id || null,
    type: data.type,
    input: data.input,
    result: data.result,
    created_by: user.id
  })
  if (error) throw error
}
