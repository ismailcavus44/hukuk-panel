export interface CaseProgress {
  id: string
  case_id: string
  progress_type: string
  custom_description?: string
  progress_date: string
  notes?: string
  created_by: string
  created_at: string
  case?: {
    id: string
    title: string
    case_no?: string
  }
}

export const PROGRESS_TYPES = [
  { value: 'sigorta_başvurusu', label: 'Sigorta Başvurusu Yapıldı' },
  { value: 'tahkim_başvurusu', label: 'Tahkim Başvurusu Yapıldı' },
  { value: 'hasar_fark', label: 'Hasar Fark Bedel Başvurusu Yapıldı' },
  { value: 'bilirkişi_verildi', label: 'Bilirkişiye Verildi' },
  { value: 'bilirkişi_raporu', label: 'Bilirkişi Raporu Geldi' },
  { value: 'değer_artırım', label: 'Değer Artırım Yapıldı' },
  { value: 'diğer', label: 'Diğer' }
] as const

export type ProgressType = typeof PROGRESS_TYPES[number]['value']
