import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Plus, Calendar, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ExpenseDetail {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  spender_name: string;
}

interface MemberOption {
  user_id: string;
  name: string;
}

export function Expenses() {
  const { currentMess, user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseDetail[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Market');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [spenderId, setSpenderId] = useState('');

  const fetchData = async () => {
    if (!currentMess) return;
    setLoading(true);
    
    const { data: roleData } = await supabase.rpc('get_user_role', { 
      p_mess_id: currentMess.id, 
      p_user_id: user?.id 
    });
    setIsAdmin(roleData === 'owner' || roleData === 'manager');

    // Fetch active members for the dropdown
    const { data: memberData } = await supabase
      .from('member_balances')
      .select('member_id, name')
      .eq('mess_id', currentMess.id);
      
    if (memberData) {
      setMembers(memberData.map((m: any) => ({ user_id: m.member_id, name: m.name })));
      // Default the spender to the current user if they are in the list
      const currentUserInList = memberData.find((m: any) => m.member_id === user?.id);
      if (currentUserInList) {
        setSpenderId(user?.id || '');
      } else if (memberData.length > 0) {
        setSpenderId(memberData[0].member_id);
      }
    }

    const { data: expData } = await supabase
      .from('expense_details')
      .select('*')
      .eq('mess_id', currentMess.id)
      .order('expense_date', { ascending: false });
      
    if (expData) setExpenses(expData as ExpenseDetail[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentMess]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMess || !user) return;
    if (!spenderId) {
      setError("Please select who spent the money.");
      return;
    }
    setSaving(true);
    setError(null);

    const { error: dbError } = await supabase.from('expenses').insert({
      mess_id: currentMess.id,
      title,
      category,
      amount: parseFloat(amount),
      expense_date: date,
      created_by: spenderId
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
    } else {
      await fetchData();
      setShowModal(false);
      setSaving(false);
      setTitle('');
      setAmount('');
    }
  };

  const handleDelete = async (expId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    if (!currentMess) return;
    
    setExpenses(e => e.filter(exp => exp.id !== expId));
    
    await supabase
      .from('expenses')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user?.id })
      .eq('id', expId);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground mt-1">Track mess market and utility costs.</p>
        </div>
        {isAdmin && (
          <Button className="shrink-0 gap-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        )}
      </div>

      <Card className="bg-card/50 backdrop-blur-xl border-border/50 min-h-[400px]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Spent By</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  {isAdmin && <th className="px-6 py-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">Loading expenses...</td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Receipt className="w-12 h-12 mb-4 opacity-20" />
                        <p>No expenses logged yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(expense.expense_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{expense.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">{expense.spender_name}</td>
                      <td className="px-6 py-4 text-right font-bold text-destructive">
                        ৳ {Number(expense.amount).toFixed(2)}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(expense.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="z-50 w-full max-w-md"
            >
              <Card className="border-border/50 bg-card/95 shadow-2xl">
                <CardHeader>
                  <CardTitle>Log Expense</CardTitle>
                </CardHeader>
                <form onSubmit={handleSaveExpense}>
                  <CardContent className="space-y-4">
                    {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">{error}</div>}
                    
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" type="date" required value={date} onChange={e => setDate(e.target.value)} disabled={saving} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Description</Label>
                      <Input id="title" required placeholder="e.g. Weekly Bazar" value={title} onChange={e => setTitle(e.target.value)} disabled={saving} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spender">Spent By</Label>
                      <select 
                        id="spender" 
                        required 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={spenderId} 
                        onChange={e => setSpenderId(e.target.value)} 
                        disabled={saving}
                      >
                        <option value="" disabled>Select who spent</option>
                        {members.map(m => (
                          <option key={m.user_id} value={m.user_id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select 
                        id="category" 
                        required 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={category} 
                        onChange={e => setCategory(e.target.value)} 
                        disabled={saving}
                      >
                        <option value="Market">Market (Bazar)</option>
                        <option value="Utility">Utility Bills</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Internet">Internet</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (৳)</Label>
                      <Input id="amount" type="number" step="0.01" min="1" required placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} disabled={saving} />
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0 flex justify-between">
                    <Button variant="ghost" type="button" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Expense'}</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
