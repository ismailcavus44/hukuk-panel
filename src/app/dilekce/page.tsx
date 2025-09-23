'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Download, Eye } from 'lucide-react'
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'

interface DilekceForm {
  dilekceTuru: string
  mahkeme: string
  davaNo: string
  davaci: string
  davali: string
  konu: string
  talep: string
  tarih: string
  avukat: string
}

export default function DilekcePage() {
  const [form, setForm] = useState<DilekceForm>({
    dilekceTuru: '',
    mahkeme: '',
    davaNo: '',
    davaci: '',
    davali: '',
    konu: '',
    talep: '',
    tarih: new Date().toLocaleDateString('tr-TR'),
    avukat: ''
  })

  const dilekceTurleri = [
    'İstinaf Dilekçesi',
    'Temyiz Dilekçesi',
    'İcra İtiraz Dilekçesi',
    'İstirdat Dilekçesi',
    'İhtiyati Tedbir Dilekçesi'
  ]

  const generateDocument = async () => {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Başlık
            new Paragraph({
              children: [
                new TextRun({
                  text: form.dilekceTuru,
                  bold: true,
                  size: 32,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Mahkeme bilgisi
            new Paragraph({
              children: [
                new TextRun({
                  text: `${form.mahkeme} MAHKEMESİ’NE`,
                  bold: true,
                  size: 28,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Dava bilgileri
            new Paragraph({
              children: [
                new TextRun({
                  text: `DAVA NO: ${form.davaNo}`,
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `DAVACI: ${form.davaci}`,
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `DAVALI: ${form.davali}`,
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 400 },
            }),

            // Dilekçe içeriği
            new Paragraph({
              children: [
                new TextRun({
                  text: "KONU:",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: form.konu,
                  size: 24,
                }),
              ],
              spacing: { after: 400 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "TALEP:",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: form.talep,
                  size: 24,
                }),
              ],
              spacing: { after: 400 },
            }),

            // İmza bölümü
            new Paragraph({
              children: [
                new TextRun({
                  text: "Gereğinin saygılarımla arz edilir.",
                  size: 24,
                }),
              ],
              spacing: { after: 600 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: form.tarih,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: form.avukat,
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
        }],
      })

      const blob = await Packer.toBlob(doc)
      const fileName = `${form.dilekceTuru}_${form.davaNo}_${new Date().toISOString().split('T')[0]}.docx`
      saveAs(blob, fileName)
      
      toast.success('Dilekçe başarıyla oluşturuldu ve indirildi!')
    } catch (error) {
      console.error('Dilekçe oluşturulurken hata:', error)
      toast.error('Dilekçe oluşturulurken hata oluştu')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Form validasyonu
    if (!form.dilekceTuru || !form.mahkeme || !form.davaNo || !form.davaci || !form.davali || !form.konu || !form.talep || !form.avukat) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }

    generateDocument()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dilekçe Oluştur</h1>
          <p className="text-gray-600">Otomatik dilekçe oluşturun ve Word dosyası olarak indirin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Önizle
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Dilekçe Bilgileri
            </CardTitle>
            <CardDescription>
              Dilekçe için gerekli bilgileri girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dilekceTuru" className="text-sm font-medium text-gray-700">
                  Dilekçe Türü *
                </Label>
                <Select value={form.dilekceTuru} onValueChange={(value) => setForm({...form, dilekceTuru: value})}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Dilekçe türünü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {dilekceTurleri.map((turu) => (
                      <SelectItem key={turu} value={turu}>
                        {turu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mahkeme" className="text-sm font-medium text-gray-700">
                  Mahkeme *
                </Label>
                <Input
                  id="mahkeme"
                  value={form.mahkeme}
                  onChange={(e) => setForm({...form, mahkeme: e.target.value})}
                  required
                  className="h-11"
                  placeholder="Örn: İstanbul 1. Asliye Hukuk Mahkemesi"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="davaNo" className="text-sm font-medium text-gray-700">
                    Dava No *
                  </Label>
                  <Input
                    id="davaNo"
                    value={form.davaNo}
                    onChange={(e) => setForm({...form, davaNo: e.target.value})}
                    required
                    className="h-11"
                    placeholder="Örn: 2025/123"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tarih" className="text-sm font-medium text-gray-700">
                    Tarih *
                  </Label>
                  <Input
                    id="tarih"
                    value={form.tarih}
                    onChange={(e) => setForm({...form, tarih: e.target.value})}
                    required
                    className="h-11"
                    placeholder="GG/AA/YYYY"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="davaci" className="text-sm font-medium text-gray-700">
                  Davacı *
                </Label>
                <Input
                  id="davaci"
                  value={form.davaci}
                  onChange={(e) => setForm({...form, davaci: e.target.value})}
                  required
                  className="h-11"
                  placeholder="Davacı adı soyadı"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="davali" className="text-sm font-medium text-gray-700">
                  Davalı *
                </Label>
                <Input
                  id="davali"
                  value={form.davali}
                  onChange={(e) => setForm({...form, davali: e.target.value})}
                  required
                  className="h-11"
                  placeholder="Davalı adı soyadı"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="konu" className="text-sm font-medium text-gray-700">
                  Konu *
                </Label>
                <Textarea
                  id="konu"
                  value={form.konu}
                  onChange={(e) => setForm({...form, konu: e.target.value})}
                  required
                  placeholder="Dava konusunu açıklayın"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="talep" className="text-sm font-medium text-gray-700">
                  Talep *
                </Label>
                <Textarea
                  id="talep"
                  value={form.talep}
                  onChange={(e) => setForm({...form, talep: e.target.value})}
                  required
                  placeholder="Mahkemeden talep edilenleri yazın"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avukat" className="text-sm font-medium text-gray-700">
                  Avukat *
                </Label>
                <Input
                  id="avukat"
                  value={form.avukat}
                  onChange={(e) => setForm({...form, avukat: e.target.value})}
                  required
                  className="h-11"
                  placeholder="Avukat adı soyadı"
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-11 text-base font-medium">
                  <Download className="h-4 w-4 mr-2" />
                  Dilekçeyi Oluştur ve İndir
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Önizleme */}
        <Card>
          <CardHeader>
            <CardTitle>Dilekçe Önizlemesi</CardTitle>
            <CardDescription>
              Oluşturulacak dilekçenin önizlemesi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-white border rounded-lg min-h-[600px]">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">{form.dilekceTuru || 'Dilekçe Türü'}</h2>
                <h3 className="text-xl font-bold">{form.mahkeme || 'Mahkeme'} MAHKEMESİ’NE</h3>
              </div>

              <div className="space-y-4 mb-8">
                <p><strong>DAVA NO:</strong> {form.davaNo || 'Dava No'}</p>
                <p><strong>DAVACI:</strong> {form.davaci || 'Davacı'}</p>
                <p><strong>DAVALI:</strong> {form.davali || 'Davalı'}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <p className="font-bold mb-2">KONU:</p>
                  <p className="text-sm">{form.konu || 'Konu bilgisi girilmedi'}</p>
                </div>
                
                <div>
                  <p className="font-bold mb-2">TALEP:</p>
                  <p className="text-sm">{form.talep || 'Talep bilgisi girilmedi'}</p>
                </div>
              </div>

              <div className="text-right space-y-2">
                <p>Gereğinin saygılarımla arz edilir.</p>
                <p>{form.tarih}</p>
                <p className="font-bold">{form.avukat || 'Avukat'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
