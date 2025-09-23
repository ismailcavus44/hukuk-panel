export type KidemInput = { brutUcret: number; yil: number; ay: number; gun: number; tavan?: number }
export type KidemResult = { tutar: number; kalemler: {label: string; value: number}[] }

export function calculateKidem(i: KidemInput): KidemResult {
  const totalYear = i.yil + i.ay/12 + i.gun/365
  let tutar = i.brutUcret * totalYear
  if (i.tavan) tutar = Math.min(tutar, i.tavan * totalYear)
  return { tutar, kalemler: [{label: 'Toplam yıl', value: Number(totalYear.toFixed(4))}] }
}
