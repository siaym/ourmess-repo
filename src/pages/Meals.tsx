import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Plus, Calendar, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface MealDetail {
  id: string;
  mess_id: string;
  member_id: string;
  member_name: string;
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  total_meal: number;
}

interface MemberOption {
  user_id: string;
  name: string;
}

export function Meals() {
  const { currentMess, user } = useAuth();
  const [meals, setMeals] = useState<MealDetail[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [memberId, setMemberId] = useState('');
  const [breakfast, setBreakfast] = useState('0');
  const [lunch, setLunch] = useState('0');
  const [dinner, setDinner] = useState('0');

  const fetchData = async () => {
    if (!currentMess) return;
    setLoading(true);
    
    // Fetch user role
    const { data: roleData } = await supabase.rpc('get_user_role', { 
      p_mess_id: currentMess.id, 
      p_user_id: user?.id 
    });
    setIsAdmin(roleData === 'owner' || roleData === 'manager');

    // Fetch active members for the dropdown (from member_balances view)
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

    // Fetch meals
    const { data: mealsData } = await supabase
      .from('meal_details')
      .select('*')
      .eq('mess_id', currentMess.id)
      .order('date', { ascending: false });
      
    if (mealsData) setMeals(mealsData as MealDetail[]);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentMess]);

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMess || !user) return;
    setSaving(true);
    setError(null);

    // 1. Fetch balances BEFORE the change
    const { data: oldBalances } = await supabase
      .from('member_balances')
      .select('mess_id, member_id, name, email, balance')
      .eq('mess_id', currentMess.id);

    // 2. Perform the save
    const { error: dbError } = await supabase.from('meals').upsert({
      mess_id: currentMess.id,
      member_id: memberId,
      date: date,
      breakfast: parseFloat(breakfast) || 0,
      lunch: parseFloat(lunch) || 0,
      dinner: parseFloat(dinner) || 0,
      created_by: user.id,
      is_deleted: false,
      deleted_at: null,
      deleted_by: null
    }, { onConflict: 'mess_id, member_id, date' });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
    } else {
      // 3. Fetch balances AFTER the change
      const { data: newBalances } = await supabase
        .from('member_balances')
        .select('mess_id, member_id, name, email, balance')
        .eq('mess_id', currentMess.id);

      // 4. Notify anyone who crossed into negative
      try {
        const { notifyIfCrossedToNegative } = await import('../lib/balanceNotifier');
        await notifyIfCrossedToNegative(currentMess.id, oldBalances || [], newBalances || []);
      } catch (err) {
        console.error("Failed to notify balances", err);
      }

      await fetchData();
      setShowModal(false);
      setSaving(false);
      // Reset form
      setBreakfast('0');
      setLunch('0');
      setDinner('0');
    }
  };

  const handleDelete = async (mealId: string) => {
    if (!confirm("Are you sure you want to delete this meal record?")) return;
    if (!currentMess) return;
    
    setMeals(m => m.filter(meal => meal.id !== mealId));
    
    await supabase
      .from('meals')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user?.id })
      .eq('id', mealId);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meal Tracking</h2>
          <p className="text-muted-foreground mt-1">Log and monitor daily meals.</p>
        </div>
        {isAdmin && (
          <Button className="shrink-0 gap-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Log Meal
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
                  <th className="px-6 py-4 font-medium text-center">Breakfast</th>
                  <th className="px-6 py-4 font-medium text-center">Lunch</th>
                  <th className="px-6 py-4 font-medium text-center">Dinner</th>
                  <th className="px-6 py-4 font-medium text-center">Total</th>
                  {isAdmin && <th className="px-6 py-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">Loading meals...</td>
                  </tr>
                ) : meals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Utensils className="w-12 h-12 mb-4 opacity-20" />
                        <p>No meals logged yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  meals.map((meal) => (
                    <tr key={meal.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(meal.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{meal.member_name}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{Number(meal.breakfast).toFixed(1)}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{Number(meal.lunch).toFixed(1)}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{Number(meal.dinner).toFixed(1)}</td>
                      <td className="px-6 py-4 text-center font-bold text-primary">{Number(meal.total_meal).toFixed(1)}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(meal.id)}>
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

      {/* Log Meal Modal */}
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
                  <CardTitle>Log Meal</CardTitle>
                </CardHeader>
                <form onSubmit={handleSaveMeal}>
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

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="breakfast" className="text-xs">Breakfast</Label>
                        <Input id="breakfast" type="number" step="0.5" min="0" required value={breakfast} onChange={e => setBreakfast(e.target.value)} disabled={saving} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lunch" className="text-xs">Lunch</Label>
                        <Input id="lunch" type="number" step="0.5" min="0" required value={lunch} onChange={e => setLunch(e.target.value)} disabled={saving} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dinner" className="text-xs">Dinner</Label>
                        <Input id="dinner" type="number" step="0.5" min="0" required value={dinner} onChange={e => setDinner(e.target.value)} disabled={saving} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      * If a meal is already logged for this member on this date, it will be updated automatically.
                    </p>
                  </CardContent>
                  <div className="p-6 pt-0 flex justify-between">
                    <Button variant="ghost" type="button" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Meal'}</Button>
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
