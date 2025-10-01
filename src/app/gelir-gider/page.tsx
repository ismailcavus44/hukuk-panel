"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { TrendingUp, TrendingDown, Plus, Search, DollarSign, Info } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Case {
  id: string
  title: string
  case_no?: string
  client_id?: string
  court_name?: string
  client?: {
    id: string
    full_name: string
  }
}

interface IncomeExpense {
  id: string
  case_id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  transaction_date: string
  created_at: string
  case?: Case
}
export default function GelirGiderPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [transactions, setTransactions] = useState<IncomeExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<IncomeExpense | null>(null)
  const [caseTransactionDialogOpen, setCaseTransactionDialogOpen] = useState(false)
  const [selectedCaseForTransaction, setSelectedCaseForTransaction] = useState<{case: Case, transactions: IncomeExpense[]} | null>(null)

  const [transactionForm, setTransactionForm] = useState({
    case_id: '',
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  })

  const sb = supabaseBrowser()

  const expenseCategories = ['Bilirkişi Ücreti','Islah Harcı','Başvuru Harcı','Posta Masrafı','Vekalet Harcı ve Baro Pulu','Diğer Masraflar']
  const incomeCategories = ['Sigorta Kısmi Ödeme','Karar Ödemesi']
  const outgoingCategories = ['Müvekkile Kısmi Ödeme','Müvekkile Diğer Ödeme','Müvekkile Dosya Kapama Ödemesi','Kaportacı Komisyonu']

  const allCategories = [...incomeCategories, ...expenseCategories, ...outgoingCategories]

  useEffect(() => {
    void loadData()
  }, [])

  const normalizeTr = (value: string): string => {
    const lower = value.toLocaleLowerCase('tr')
    return lower
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [casesResult, transactionsResult] = await Promise.all([
        sb.from('cases')
          .select(`id, title, case_no, client_id, court_name, client:clients(id, full_name)`) 
          .order('title'),
        sb.from('income_expenses')
          .select(`id, case_id, type, category, amount, description, transaction_date, created_at, case:cases(id, title, case_no, client_id, court_name, client:clients(id, full_name))`)
          .order('transaction_date', { ascending: false })
      ])
      const fetchedCases = (casesResult.data || []) as any[]
      setCases(
        fetchedCases.map((r) => ({
          id: r.id,
          title: r.title,
          case_no: r.case_no ?? undefined,
          client_id: r.client_id ?? undefined,
          court_name: r.court_name ?? undefined,
          client: Array.isArray(r.client) ? (r.client[0] || undefined) : r.client,
        }))
      )

      const fetchedTransactions = (transactionsResult.data || []) as any[]
      setTransactions(
        fetchedTransactions.map((r) => {
          const c = Array.isArray(r.case) ? (r.case[0] || undefined) : r.case
          const normalizedCase = c
            ? {
                ...c,
                client: Array.isArray(c.client) ? (c.client[0] || undefined) : c.client,
              }
            : undefined

          return {
            id: r.id,
            case_id: r.case_id,
            type: r.type,
            category: r.category,
            amount: Number(r.amount),
            description: r.description,
            transaction_date: r.transaction_date,
            created_at: r.created_at,
            case: normalizedCase,
          }
        })
      )
    } catch (err) {
      console.error(err)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm.trim()) {
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter
      const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter
      return matchesType && matchesCategory
    }
    
    const q = normalizeTr(searchTerm)
    const desc = normalizeTr(transaction.description || '')
    const cat = normalizeTr(transaction.category || '')
    const title = normalizeTr(transaction.case?.title || '')
    const caseNo = normalizeTr(transaction.case?.case_no || '')
    const clientName = normalizeTr(transaction.case?.client?.full_name || '')
    const matchesSearch = desc.includes(q) ||
                         cat.includes(q) ||
                         title.includes(q) ||
                         caseNo.includes(q) ||
                         clientName.includes(q)
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter
    return matchesSearch && matchesType && matchesCategory
  })

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s,t)=>s+t.amount,0)
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s,t)=>s+t.amount,0)
  const netAmount = totalIncome - totalExpense

  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const caseId = transaction.case_id
    if (!groups[caseId]) {
      groups[caseId] = {
        case: transaction.case!,
        transactions: [],
        totalIncome: 0,
        totalExpense: 0
      }
    }
    groups[caseId].transactions.push(transaction)
    if (transaction.type === 'income') {
      groups[caseId].totalIncome += transaction.amount
    } else {
      groups[caseId].totalExpense += transaction.amount
    }
    return groups
  }, {} as Record<string, {case: Case, transactions: IncomeExpense[], totalIncome: number, totalExpense: number}>)

  const handleShowCaseTransactions = (caseItem: Case) => {
    const caseTransactions = transactions.filter(t => t.case_id === caseItem.id)
    setSelectedCaseForTransaction({ case: caseItem, transactions: caseTransactions })
    setCaseTransactionDialogOpen(true)
  }

  const getCategoryOptions = () => {
    if (transactionForm.type === 'income') return incomeCategories
    if (transactionForm.type === 'expense') return [...expenseCategories, ...outgoingCategories]
    return []
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) {
        toast.error('Giriş yapmanız gerekiyor')
        return
      }
      const { error } = await sb.from('income_expenses').insert({
        ...transactionForm,
        amount: parseFloat(transactionForm.amount),
        created_by: user.id
      })
      if (error) throw error
      toast.success('İşlem başarıyla eklendi')
      setTransactionDialogOpen(false)
      setTransactionForm({ case_id: '', type: 'income', category: '', amount: '', description: '', transaction_date: new Date().toISOString().split('T')[0] })
      void loadData()
    } catch (err: any) {
      toast.error(err.message || 'İşlem eklenemedi')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gelir-Gider Takibi</h1>
          <p className="text-gray-600">Dosya gelir ve giderlerini takip edin</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={transactionDialogOpen} onOpenChange={(open) => {
            setTransactionDialogOpen(open)
            if (!open) {
              setEditingTransaction(null)
              setTransactionForm({ case_id: '', type: 'income', category: '', amount: '', description: '', transaction_date: new Date().toISOString().split('T')[0] })
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni İşlem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni İşlem Ekle</DialogTitle>
                <DialogDescription>Bu dosyaya gelir/gider işlemi ekleyin</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTransaction} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Dosya *</Label>
                  <Select value={transactionForm.case_id} onValueChange={(value) => setTransactionForm({ ...transactionForm, case_id: value })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Dosya seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map((caseItem) => {
                        const isCourtCase = caseItem.title === 'Mahrumiyet İcra Dosyası'
                        const displayText = isCourtCase && caseItem.court_name
                          ? `${caseItem.court_name} ${caseItem.case_no ? `(${caseItem.case_no})` : ''}`
                          : `${caseItem.title} ${caseItem.case_no ? `(${caseItem.case_no})` : ''} - ${caseItem.client?.full_name ?? ''}`
                        return (
                          <SelectItem key={caseItem.id} value={caseItem.id}>{displayText}</SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">İşlem Türü *</Label>
                    <Select value={transactionForm.type} onValueChange={(value: 'income' | 'expense') => setTransactionForm({ ...transactionForm, type: value, category: '' })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="İşlem türünü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Gelir</SelectItem>
                        <SelectItem value="expense">Gider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Kategori *</Label>
                    <Select value={transactionForm.category} onValueChange={(value) => setTransactionForm({ ...transactionForm, category: value })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategoryOptions().map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Tutar (TL) *</Label>
                    <Input type="number" value={transactionForm.amount} onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })} className="h-11" placeholder="0.00" step="0.01" min="0" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">İşlem Tarihi *</Label>
                    <Input type="date" value={transactionForm.transaction_date} onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })} className="h-11" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Açıklama</Label>
                  <Textarea value={transactionForm.description} onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })} placeholder="İşlem açıklaması (opsiyonel)" className="min-h-[100px]" />
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full h-11 text-base font-medium">İşlemi Kaydet</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center"><div className="p-3 rounded-lg bg-green-100"><TrendingUp className="h-6 w-6 text-green-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Toplam Gelir</p><p className="text-2xl font-bold text-green-600">{totalIncome.toLocaleString('tr-TR')} TL</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center"><div className="p-3 rounded-lg bg-red-100"><TrendingDown className="h-6 w-6 text-red-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Toplam Gider</p><p className="text-2xl font-bold text-red-600">{totalExpense.toLocaleString('tr-TR')} TL</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center"><div className={`p-3 rounded-lg ${netAmount >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}><DollarSign className={`h-6 w-6 ${netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`} /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Net Tutar</p><p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{netAmount.toLocaleString('tr-TR')} TL</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Ara</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="search" placeholder="Açıklama, kategori, dosya başlığı..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="type">İşlem Türü</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {allCategories.map((c)=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dosya Bazında İşlemler</CardTitle>
          <CardDescription>
            {Object.keys(groupedTransactions).length} dosyada işlem var
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedTransactions).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dosya</TableHead>
                  <TableHead>İşlem Sayısı</TableHead>
                  <TableHead>Toplam Gelir</TableHead>
                  <TableHead>Toplam Gider</TableHead>
                  <TableHead>Net Tutar</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(groupedTransactions).map((group) => {
                  const netCaseAmount = group.totalIncome - group.totalExpense
                  const isCourtCase = group.case.title === 'Mahrumiyet İcra Dosyası'
                  return (
                    <TableRow key={group.case.id}>
                      <TableCell>
                        <div>
                          {isCourtCase && group.case.court_name ? (
                            <>
                              <p className="font-medium text-blue-600">{group.case.court_name}</p>
                              <p className="text-sm text-gray-500">{group.case.case_no || '-'}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium">{group.case.title}</p>
                              <p className="text-sm text-gray-500">{group.case.case_no || '-'}</p>
                              <p className="text-sm text-gray-500">{group.case.client?.full_name}</p>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{group.transactions.length} işlem</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">{group.totalIncome.toLocaleString('tr-TR')} TL</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-red-600">{group.totalExpense.toLocaleString('tr-TR')} TL</span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${netCaseAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{netCaseAmount.toLocaleString('tr-TR')} TL</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleShowCaseTransactions(group.case)}
                            className="cursor-pointer"
                            title="İşlem detaylarını görüntüle"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setTransactionForm({
                                case_id: group.case.id,
                                type: 'income',
                                category: '',
                                amount: '',
                                description: '',
                                transaction_date: new Date().toISOString().split('T')[0]
                              })
                              setTransactionDialogOpen(true)
                            }}
                            className="cursor-pointer"
                            title="Bu dosyaya işlem ekle"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Henüz işlem bulunmuyor</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dosya İşlem Detayları Modal */}
      <Dialog open={caseTransactionDialogOpen} onOpenChange={setCaseTransactionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-semibold">
              {selectedCaseForTransaction?.case.title} - İşlem Detayları
            </DialogTitle>
            <DialogDescription>
              Bu dosyaya ait tüm gelir-gider işlemleri
            </DialogDescription>
          </DialogHeader>
          {selectedCaseForTransaction && (
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg flex-shrink-0">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Dosya No</p>
                  <p className="font-semibold text-sm">{selectedCaseForTransaction.case.case_no || '-'}</p>
                </div>
                {selectedCaseForTransaction.case.title === 'Mahrumiyet İcra Dosyası' && selectedCaseForTransaction.case.court_name && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Mahkeme</p>
                    <p className="font-semibold text-sm text-blue-600">{selectedCaseForTransaction.case.court_name}</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">İşlem Sayısı</p>
                  <p className="font-semibold text-sm">{selectedCaseForTransaction.transactions.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Toplam Gelir</p>
                  <p className="font-semibold text-sm text-green-600">
                    {selectedCaseForTransaction.transactions.filter(t => t.type === 'income').reduce((s,t)=>s+t.amount,0).toLocaleString('tr-TR')} TL
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Toplam Gider</p>
                  <p className="font-semibold text-sm text-red-600">
                    {selectedCaseForTransaction.transactions.filter(t => t.type === 'expense').reduce((s,t)=>s+t.amount,0).toLocaleString('tr-TR')} TL
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-hidden border rounded-lg">
                <div className="h-full overflow-y-auto">
                  <div className="space-y-3 p-4">
                    {selectedCaseForTransaction.transactions.map((transaction) => (
                      <div key={transaction.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                                {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {transaction.category}
                              </Badge>
                              <span className="text-xs text-gray-500">{new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}</span>
                            </div>
                            {transaction.description && (
                              <p className="text-sm text-gray-700 mb-2 leading-relaxed">{transaction.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.amount.toLocaleString('tr-TR')} TL
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  )
}


