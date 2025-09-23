'use client'
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
import { Receipt, Plus, Search, Edit, Trash2, DollarSign, Info } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Case {
  id: string
  title: string
  case_no?: string
  client_id?: string
  client?: {
    id: string
    full_name: string
  }
}

interface Expense {
  id: string
  case_id: string
  amount: number
  description: string
  category: string
  expense_date: string
  created_at: string
  case?: Case
}

export default function MasrafTakipPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  // Dialog states
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [caseExpenseDialogOpen, setCaseExpenseDialogOpen] = useState(false)
  const [selectedCaseForExpense, setSelectedCaseForExpense] = useState<{case: Case, expenses: Expense[]} | null>(null)
  
  // Form state
  const [expenseForm, setExpenseForm] = useState({
    case_id: '',
    amount: '',
    description: '',
    category: '',
    expense_date: new Date().toISOString().split('T')[0]
  })
  
  const sb = supabaseBrowser()

  const expenseCategories = [
    'Dosya Harcı',
    'Bilirkişi Masrafı',
    'Diğer Masraflar'
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [casesResult, expensesResult] = await Promise.all([
        sb.from('cases')
          .select(`
            id, title, case_no, client_id,
            client:clients(id, full_name)
          `)
          .order('title'),
        sb.from('expenses')
          .select(`
            id, case_id, amount, description, category, expense_date, created_at,
            case:cases(id, title, case_no, client_id, client:clients(id, full_name))
          `)
          .order('expense_date', { ascending: false })
      ])

      setCases(casesResult.data || [])
      setExpenses(expensesResult.data || [])
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) {
        toast.error('Giriş yapmanız gerekiyor')
        return
      }

      const { error } = await sb.from('expenses').insert({
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        created_by: user.id
      })
      if (error) throw error
      
      toast.success('Masraf başarıyla eklendi')
      setExpenseForm({
        case_id: '',
        amount: '',
        description: '',
        category: '',
        expense_date: new Date().toISOString().split('T')[0]
      })
      setExpenseDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setExpenseForm({
      case_id: expense.case_id,
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category,
      expense_date: expense.expense_date
    })
    setExpenseDialogOpen(true)
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return

    try {
      const { error } = await sb
        .from('expenses')
        .update({
          case_id: expenseForm.case_id,
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description,
          category: expenseForm.category,
          expense_date: expenseForm.expense_date
        })
        .eq('id', editingExpense.id)

      if (error) throw error
      
      toast.success('Masraf bilgileri güncellendi')
      setExpenseForm({
        case_id: '',
        amount: '',
        description: '',
        category: '',
        expense_date: new Date().toISOString().split('T')[0]
      })
      setEditingExpense(null)
      setExpenseDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Bu masrafı silmek istediğinizden emin misiniz?')) return
    
    try {
      const { error } = await sb.from('expenses').delete().eq('id', id)
      if (error) throw error
      
      toast.success('Masraf silindi')
      loadData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleShowCaseExpenses = (caseItem: Case) => {
    const caseExpenses = expenses.filter(expense => expense.case_id === caseItem.id)
    setSelectedCaseForExpense({ case: caseItem, expenses: caseExpenses })
    setCaseExpenseDialogOpen(true)
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.case?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.case?.case_no?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Dosya bazında gruplama
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
    const caseId = expense.case_id
    if (!groups[caseId]) {
      groups[caseId] = {
        case: expense.case!,
        expenses: [],
        total: 0
      }
    }
    groups[caseId].expenses.push(expense)
    groups[caseId].total += expense.amount
    return groups
  }, {} as Record<string, {case: Case, expenses: Expense[], total: number}>)

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Masraf Takibi</h1>
          <p className="text-gray-600">Dosya masraflarını takip edin</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={expenseDialogOpen} onOpenChange={(open) => {
            setExpenseDialogOpen(open)
            if (!open) {
              setEditingExpense(null)
              setExpenseForm({
                case_id: '',
                amount: '',
                description: '',
                category: '',
                expense_date: new Date().toISOString().split('T')[0]
              })
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Masraf
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Masraf Düzenle' : 'Yeni Masraf Ekle'}
              </DialogTitle>
              <DialogDescription>
                {editingExpense ? 'Masraf bilgilerini güncelleyin' : 'Yeni masraf bilgilerini girin'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="case_id" className="text-sm font-medium text-gray-700">
                  Dosya *
                </Label>
                <Select value={expenseForm.case_id} onValueChange={(value) => setExpenseForm({...expenseForm, case_id: value})}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Dosya seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.title} {caseItem.case_no && `(${caseItem.case_no})`} - {caseItem.client?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                    Tutar (TL) *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    required
                    className="h-11"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Kategori *
                  </Label>
                  <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({...expenseForm, category: value})}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expense_date" className="text-sm font-medium text-gray-700">
                  Masraf Tarihi *
                </Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Açıklama *
                </Label>
                <Textarea
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  required
                  placeholder="Masraf açıklaması"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="pt-4">
                <Button type="submit" className="w-full h-11 text-base font-medium">
                  {editingExpense ? 'Masraf Bilgilerini Güncelle' : 'Yeni Masraf Ekle'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Ara</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Açıklama, kategori, dosya başlığı..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Masraf Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Masraf Listesi</CardTitle>
          <CardDescription>
            {filteredExpenses.length} masraf bulundu - Toplam: {totalExpenses.toLocaleString('tr-TR')} TL
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedExpenses).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dosya</TableHead>
                  <TableHead>Masraf Sayısı</TableHead>
                  <TableHead>Toplam Tutar</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(groupedExpenses).map((group) => (
                  <TableRow key={group.case.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{group.case.title}</p>
                        <p className="text-sm text-gray-500">{group.case.case_no || '-'}</p>
                        <p className="text-sm text-gray-500">{group.case.client?.full_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{group.expenses.length} masraf</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-red-600">
                        {group.total.toLocaleString('tr-TR')} TL
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShowCaseExpenses(group.case)}
                          className="cursor-pointer"
                          title="Masraf detaylarını görüntüle"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setExpenseForm({
                              case_id: group.case.id,
                              amount: '',
                              description: '',
                              category: '',
                              expense_date: new Date().toISOString().split('T')[0]
                            })
                            setExpenseDialogOpen(true)
                          }}
                          className="cursor-pointer"
                          title="Bu dosyaya masraf ekle"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Henüz masraf bulunmuyor</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dosya Masraf Detayları Modal */}
      <Dialog open={caseExpenseDialogOpen} onOpenChange={setCaseExpenseDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {selectedCaseForExpense?.case.title} - Masraf Detayları
            </DialogTitle>
            <DialogDescription className="text-base">
              Bu dosyaya ait tüm masraflar
            </DialogDescription>
          </DialogHeader>
          
          {selectedCaseForExpense && (
            <div className="space-y-6">
              {/* Özet Bilgiler */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Dosya No</p>
                    <p className="font-medium">{selectedCaseForExpense.case.case_no || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam Masraf Sayısı</p>
                    <p className="font-medium">{selectedCaseForExpense.expenses.length} masraf</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam Tutar</p>
                    <p className="font-medium text-red-600">
                      {selectedCaseForExpense.expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString('tr-TR')} TL
                    </p>
                  </div>
                </div>
              </div>

              {/* Masraf Listesi */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Masraf Listesi</h3>
                
                {selectedCaseForExpense.expenses.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Açıklama</TableHead>
                          <TableHead>Tutar</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead>İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCaseForExpense.expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>
                              <Badge variant="outline">{expense.category}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                            <TableCell>
                              <span className="font-medium text-red-600">
                                {expense.amount.toLocaleString('tr-TR')} TL
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Date(expense.expense_date).toLocaleDateString('tr-TR')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setCaseExpenseDialogOpen(false)
                                    handleEditExpense(expense)
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleDeleteExpense(expense.id)}
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
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Bu dosyaya henüz masraf eklenmemiş</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}