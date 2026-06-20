import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Calendar, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface DepositDetail {
  id: string;
  member_id: string;
  depositor_name: string;
  amount: number;
  payment_method: string;
  deposit_date: string;
}

interface MemberOption {
  user_id: string;
  name: string;
}

export function Deposits() {
  const { currentMess, user } = useAuth();
  const [deposits, setDeposits] = useState<DepositDetail[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    if (!currentMess) return;
    setLoading(true);
    
    const { data: roleData } = await supabase.rpc('get_user_role', { 
      p_mess_id: currentMess.id, 
      p_user_id: user?.id 
    });
    setIsAdmin(roleData === 'owner' || roleData === 'manager');

    // Fetch active members
    const { data: memberData } = await supabase
      .from('member_balances')
      .select('member_id, name')
      .eq('mess_id', currentMess.id);
      
    if (memberData) {
      setMembers(memberData.map((m: any) => ({ user_id: m.member_id, name: m.name })));
      if (memberData.length > 0 && !memberId) {
        setMemberId(memberData[0].member_id);
      }
    }

    // Fetch deposits
    const { data: depData } = await supabase
      .from('deposit_details')
      .select('*')
      .eq('mess_id', currentMess.id)
      .order('deposit_date', { ascending: false });
      
    if (depData) setDeposits(depData as DepositDetail[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentMess]);

  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMess || !user) return;
    setSaving(true);
    setError(null);

    const { error: dbError } = await supabase.from('deposits').insert({
      mess_id: currentMess.id,
      member_id: memberId,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      deposit_date: date,
      created_by: user.id
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
    } else {
      await fetchData();
      setShowModal(false);
      setSaving(false);
      setAmount('');
    }
  };

  const handleDelete = async (depId: string) => {
    if (!confirm("Are you sure you want to delete this deposit?")) return;
    if (!currentMess) return;
    
    setDeposits(d => d.filter(dep => dep.id !== depId));
    
    await supabase
      .from('deposits')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user?.id })
      .eq('id', depId);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Deposits</h2>
          <p className="text-muted-foreground mt-1">Manage member payments and advances.</p>
        </div>
        {isAdmin && (
          <Button className="shrink-0 gap-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Add Deposit
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
                  <th className="px-6 py-4 font-medium">Member</th>
                  <th className="px-6 py-4 font-medium">Payment Method</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  {isAdmin && <th className="px-6 py-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">Loading deposits...</td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Wallet className="w-12 h-12 mb-4 opacity-20" />
                        <p>No deposits logged yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  deposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(deposit.deposit_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{deposit.depositor_name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {deposit.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-success">
                        + ৳ {Number(deposit.amount).toFixed(2)}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(deposit.id)}>
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

      {/* Add Deposit Modal */}
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
                  <CardTitle>Log Deposit</CardTitle>
                </CardHeader>
                <form onSubmit={handleSaveDeposit}>
                  <CardContent className="space-y-4">
                    {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">{error}</div>}
                    
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" type="date" required value={date} onChange={e => setDate(e.target.value)} disabled={saving} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="member">Member</Label>
                      <select 
                        id="member" 
                        required 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={memberId} 
                        onChange={e => setMemberId(e.target.value)} 
                        disabled={saving}
                      >
                        <option value="" disabled>Select a member</option>
                        {members.map(m => (
                          <option key={m.user_id} value={m.user_id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="method">Payment Method</Label>
                      <select 
                        id="method" 
                        required 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={paymentMethod} 
                        onChange={e => setPaymentMethod(e.target.value)} 
                        disabled={saving}
                      >
                        <option value="Cash">Cash</option>
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Bank">Bank Transfer</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (৳)</Label>
                      <Input id="amount" type="number" step="1" min="1" required placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} disabled={saving} />
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0 flex justify-between">
                    <Button variant="ghost" type="button" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Deposit'}</Button>
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
