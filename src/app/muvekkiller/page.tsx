'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, FileText, User, Info } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Client {
  id: string
  full_name: string
  tc_no?: string
  phone?: string
  email?: string
  created_at: string
  cases?: Case[]
}

interface Case {
  id: string
  title: string
  case_no?: string
  description?: string
  status: string
  client_id: string
  damage_amount?: number
  insurance_application_date?: string
  countdown_expires_at?: string
  is_countdown_active?: boolean
  created_at: string
}

export default function MuvekkillerPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientInfoDialogOpen, setClientInfoDialogOpen] = useState(false)
  const [selectedClientForInfo, setSelectedClientForInfo] = useState<Client | null>(null)
  const [caseDetailDialogOpen, setCaseDetailDialogOpen] = useState(false)
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<Case | null>(null)
  
  // Form state
  const [clientForm, setClientForm] = useState({ 
    full_name: '', 
    tc_no: '', 
    phone: '', 
    email: '' 
  })
  
  const sb = supabaseBrowser()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const { data, error } = await sb
        .from('clients')
        .select(`
          id, full_name, tc_no, phone, email, created_at,
          cases:cases(id, title, case_no, description, status, damage_amount, 
                      insurance_application_date, countdown_expires_at, is_countdown_active, created_at)
        `)
        .order('full_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Kullanıcı bilgisini al
      const { data: { user } } = await sb.auth.getUser()
      if (!user) {
        toast.error('Giriş yapmanız gerekiyor')
        return
      }

      const { error } = await sb.from('clients').insert({
        ...clientForm,
        created_by: user.id
      })
      if (error) throw error
      
      toast.success('Müvekkil başarıyla eklendi')
      setClientForm({ full_name: '', tc_no: '', phone: '', email: '' })
      setClientDialogOpen(false)
      loadData()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        // @ts-expect-error narrow for toast
        toast.error((error as any).message as string)
      } else {
        toast.error('Bir hata oluştu')
      }
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setClientForm({
      full_name: client.full_name,
      tc_no: client.tc_no || '',
      phone: client.phone || '',
      email: client.email || ''
    })
    setClientDialogOpen(true)
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return

    try {
      const { error } = await sb
        .from('clients')
        .update(clientForm)
        .eq('id', editingClient.id)

      if (error) throw error
      
      toast.success('Müvekkil bilgileri güncellendi')
      setClientForm({ full_name: '', tc_no: '', phone: '', email: '' })
      setEditingClient(null)
      setClientDialogOpen(false)
      loadData()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        // @ts-expect-error narrow for toast
        toast.error((error as any).message as string)
      } else {
        toast.error('Bir hata oluştu')
      }
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Bu müvekkili silmek istediğinizden emin misiniz? Dosyaları da silinecektir.')) return
    
    try {
      const { error } = await sb.from('clients').delete().eq('id', id)
      if (error) throw error
      
      toast.success('Müvekkil silindi')
      loadData()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        // @ts-expect-error narrow for toast
        toast.error((error as any).message as string)
      } else {
        toast.error('Bir hata oluştu')
      }
    }
  }

  const handleShowClientInfo = (client: Client) => {
    setSelectedClientForInfo(client)
    setClientInfoDialogOpen(true)
  }

  const handleShowCaseDetail = (caseItem: Case) => {
    setSelectedCaseForDetail(caseItem)
    setCaseDetailDialogOpen(true)
  }

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.tc_no?.includes(searchTerm) ||
    client.phone?.includes(searchTerm)
  )

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Müvekkil Yönetimi</h1>
          <p className="text-gray-600">Müvekkil bilgilerini yönetin</p>
        </div>
        <Dialog open={clientDialogOpen} onOpenChange={(open) => {
          setClientDialogOpen(open)
          if (!open) {
            setEditingClient(null)
            setClientForm({ full_name: '', tc_no: '', phone: '', email: '' })
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Müvekkil
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Müvekkil Düzenle' : 'Yeni Müvekkil Ekle'}
              </DialogTitle>
              <DialogDescription>
                {editingClient ? 'Müvekkil bilgilerini güncelleyin' : 'Yeni müvekkil bilgilerini girin'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingClient ? handleUpdateClient : handleCreateClient} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                  Ad Soyad *
                </Label>
                <Input
                  id="full_name"
                  value={clientForm.full_name}
                  onChange={(e) => setClientForm({...clientForm, full_name: e.target.value})}
                  required
                  className="h-11"
                  placeholder="Müvekkil adı ve soyadı"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tc_no" className="text-sm font-medium text-gray-700">
                  TC Kimlik No
                </Label>
                <Input
                  id="tc_no"
                  value={clientForm.tc_no}
                  onChange={(e) => setClientForm({...clientForm, tc_no: e.target.value})}
                  placeholder="11 haneli TC kimlik numarası"
                  maxLength={11}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">Opsiyonel - 11 haneli TC kimlik numarası</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                    placeholder="0555 123 45 67"
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    E-posta
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                    placeholder="ornek@email.com"
                    className="h-11"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button type="submit" className="w-full h-11 text-base font-medium">
                  {editingClient ? 'Müvekkil Bilgilerini Güncelle' : 'Yeni Müvekkil Ekle'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Müvekkil Dosya Bilgileri Modal */}
        <Dialog open={clientInfoDialogOpen} onOpenChange={setClientInfoDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {selectedClientForInfo?.full_name} - Dosya Listesi
              </DialogTitle>
              <DialogDescription className="text-base">
                Bu müvekkile kayıtlı tüm dosyalar
              </DialogDescription>
            </DialogHeader>
            
            {selectedClientForInfo && (
              <div className="space-y-4">
                {/* Dosya Listesi */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Dosyalar ({selectedClientForInfo.cases?.length || 0})
                  </h3>
                  
                  {selectedClientForInfo.cases && selectedClientForInfo.cases.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dosya Başlığı</TableHead>
                            <TableHead>Dosya No</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Oluşturulma Tarihi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedClientForInfo.cases.map((caseItem) => (
                            <TableRow key={caseItem.id}>
                              <TableCell className="font-medium">{caseItem.title}</TableCell>
                              <TableCell>
                                {caseItem.case_no ? (
                                  <button
                                    onClick={() => handleShowCaseDetail(caseItem)}
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                                  >
                                    {caseItem.case_no}
                                  </button>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={caseItem.status === 'open' ? 'default' : 'secondary'}>
                                  {caseItem.status === 'open' ? 'Açık' : 'Kapalı'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(caseItem.created_at).toLocaleDateString('tr-TR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Bu müvekkile henüz dosya kayıtlı değil</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dosya Detay Modal */}
        <Dialog open={caseDetailDialogOpen} onOpenChange={setCaseDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Dosya Detayları
              </DialogTitle>
              <DialogDescription className="text-base">
                Dosya bilgileri ve durumu
              </DialogDescription>
            </DialogHeader>
            
            {selectedCaseForDetail && (
              <div className="space-y-6">
                {/* Temel Bilgiler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dosya Başlığı</p>
                    <p className="font-medium text-lg">{selectedCaseForDetail.title}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dosya No</p>
                    <p className="font-medium">{selectedCaseForDetail.case_no || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Durum</p>
                    <Badge variant={selectedCaseForDetail.status === 'open' ? 'default' : 'secondary'}>
                      {selectedCaseForDetail.status === 'open' ? 'Açık' : 'Kapalı'}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Hasar Bedeli</p>
                    <p className="font-medium">
                      {selectedCaseForDetail.damage_amount ? (
                        <span className="text-green-600">
                          {selectedCaseForDetail.damage_amount.toLocaleString('tr-TR')} TL
                        </span>
                      ) : (
                        <span className="text-gray-400">Belirtilmemiş</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Açıklama */}
                {selectedCaseForDetail.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Açıklama</p>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-800">{selectedCaseForDetail.description}</p>
                    </div>
                  </div>
                )}

                {/* Sigorta Başvurusu Bilgileri */}
                {selectedCaseForDetail.title === 'Sigorta Başvurusu' && selectedCaseForDetail.insurance_application_date && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Sigorta Başvurusu Bilgileri</p>
                    <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Başvuru Tarihi</p>
                        <p className="font-medium">
                          {new Date(selectedCaseForDetail.insurance_application_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      {selectedCaseForDetail.countdown_expires_at && (
                        <div>
                          <p className="text-sm text-gray-600">Tahkim Süresi</p>
                          <p className="font-medium">
                            {new Date(selectedCaseForDetail.countdown_expires_at).toLocaleDateString('tr-TR')} tarihinde
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tarih Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
                    <p className="font-medium">
                      {new Date(selectedCaseForDetail.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Oluşturulma Saati</p>
                    <p className="font-medium">
                      {new Date(selectedCaseForDetail.created_at).toLocaleTimeString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Arama */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ad soyad, TC kimlik no veya telefon ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Müvekkil Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Müvekkil Listesi</CardTitle>
          <CardDescription>
            {filteredClients.length} müvekkil bulundu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>TC Kimlik No</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Dosya Sayısı</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.full_name}</TableCell>
                    <TableCell>{client.tc_no || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client.cases?.length || 0} dosya
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShowClientInfo(client)}
                          className="cursor-pointer"
                          title="Dosyaları görüntüle"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditClient(client)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteClient(client.id)}
                          className="cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Henüz müvekkil bulunmuyor</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
