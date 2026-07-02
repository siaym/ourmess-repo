import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Mail, CheckCircle2, Circle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface BillCategory {
  id: string;
  name: string;
}

interface MemberBill {
  category_id: string;
  member_id: string;
  is_paid: boolean;
}

interface MessMember {
  id: string;
  name: string;
  email: string;
}

export function Bills() {
  const { currentMess } = useAuth();
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [memberBills, setMemberBills] = useState<MemberBill[]>([]);
  const [members, setMembers] = useState<MessMember[]>([]);
  const [monthYear, setMonthYear] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState('');
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (currentMess) {
      fetchData();
    }
  }, [currentMess, monthYear]);

  const fetchData = async () => {
    if (!currentMess) return;
    setLoading(true);
    try {
      // Fetch bills, categories, and members securely in one RPC call
      const { data: billsData, error: billsErr } = await supabase.rpc('get_bills_data', {
        p_mess_id: currentMess.id,
        p_month_year: monthYear
      });
      if (billsErr) throw billsErr;

      setCategories(billsData.categories || []);
      setMemberBills(billsData.member_bills || []);
      setMembers(billsData.members || []);

      // Fetch admin status
      if (user) {
        const { data: roleData } = await supabase.rpc('get_user_role', { 
          p_mess_id: currentMess.id, 
          p_user_id: user.id 
        });
        setIsAdmin(roleData === 'owner' || roleData === 'manager');
      }

    } catch (error: any) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim() || !currentMess) return;

    try {
      const { data, error } = await supabase.rpc('add_bill_category', {
        p_mess_id: currentMess.id,
        p_name: newCat.trim()
      });
      if (error) throw error;
      setCategories([...categories, data as BillCategory]);
      setNewCat('');
    } catch (err: any) {
      alert("Failed to add category. Only managers can do this. " + err.message);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!currentMess) return;
    if (!window.confirm("Are you sure? This will delete this bill column for everyone.")) return;
    try {
      const { error } = await supabase.rpc('delete_bill_category', {
        p_mess_id: currentMess.id,
        p_category_id: catId
      });
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== catId));
    } catch (err: any) {
      alert("Failed to delete category: " + err.message);
    }
  };

  const toggleBill = async (catId: string, memberId: string, currentPaid: boolean) => {
    if (!currentMess) return;
    
    // Optimistic update
    const newValue = !currentPaid;
    const existingIndex = memberBills.findIndex(mb => mb.category_id === catId && mb.member_id === memberId);
    
    if (existingIndex >= 0) {
      const newBills = [...memberBills];
      newBills[existingIndex].is_paid = newValue;
      setMemberBills(newBills);
    } else {
      setMemberBills([...memberBills, { category_id: catId, member_id: memberId, is_paid: newValue }]);
    }

    try {
      const { error } = await supabase.rpc('toggle_member_bill', {
        p_mess_id: currentMess.id,
        p_category_id: catId,
        p_member_id: memberId,
        p_month_year: monthYear,
        p_is_paid: newValue
      });
      if (error) throw error;
    } catch (err: any) {
      // Revert if failed
      alert("Failed to update: " + err.message);
      fetchData();
    }
  };

  const sendReminder = async (member: MessMember) => {
    setSendingEmail(member.id);
    
    const paid = categories.filter(c => memberBills.find(mb => mb.category_id === c.id && mb.member_id === member.id)?.is_paid);
    const pending = categories.filter(c => !memberBills.find(mb => mb.category_id === c.id && mb.member_id === member.id)?.is_paid);
    
    const message = `
      Your bill status for ${format(new Date(monthYear + '-01'), 'MMMM yyyy')} has been updated.
      
      <div style="margin-top: 15px;">
        <strong style="color: #16a34a;">✅ Cleared Bills:</strong><br/>
        ${paid.length > 0 ? paid.map(p => '- ' + p.name).join('<br/>') : 'None'}
      </div>
      
      <div style="margin-top: 15px;">
        <strong style="color: #dc2626;">⏳ Pending Bills:</strong><br/>
        ${pending.length > 0 ? pending.map(p => '- ' + p.name).join('<br/>') : 'None'}
      </div>
      
      <div style="margin-top: 20px;">
        Please clear your pending bills as soon as possible to help the mess run smoothly.
      </div>
    `;
    
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: member.email,
          to_name: member.name,
          subject: `Monthly Bills Update - ${format(new Date(monthYear + '-01'), 'MMMM yyyy')}`,
          message
        })
      });
      if (!res.ok) throw new Error('Failed to send email');
      alert(`Reminder sent to ${member.name}`);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSendingEmail(null);
    }
  };

  const sendAllReminders = async () => {
    if (!window.confirm("Send email reminders to ALL members?")) return;
    for (const member of members) {
      await sendReminder(member);
    }
    alert("All reminders sent successfully!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monthly Bills</h1>
        <p className="text-muted-foreground">
          Track fixed monthly bills (Rent, WiFi, Electricity, etc.) and send email reminders.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Input 
            type="month" 
            value={monthYear} 
            onChange={(e) => setMonthYear(e.target.value)} 
            className="w-48 bg-card"
          />
        </div>
        {isAdmin && (
          <form onSubmit={handleAddCategory} className="flex items-center gap-2 w-full sm:w-auto">
            <Input 
              placeholder="Add new bill type..." 
              value={newCat} 
              onChange={(e) => setNewCat(e.target.value)} 
              className="w-48"
            />
            <Button type="submit" variant="secondary" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Bills Checklist ({format(new Date(monthYear + '-01'), 'MMM yyyy')})</CardTitle>
          {isAdmin && (
            <Button onClick={sendAllReminders} className="bg-primary text-primary-foreground">
              <Send className="w-4 h-4 mr-2" />
              Notify All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading bills...</p>
          ) : (
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                  <tr>
                    <th className="px-4 py-4 rounded-tl-lg font-semibold">Member</th>
                    {categories.map(cat => (
                      <th key={cat.id} className="px-4 py-4 text-center font-semibold">
                        <div className="flex items-center justify-center gap-2 group">
                          {cat.name}
                          {isAdmin && (
                            <button 
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    {isAdmin && <th className="px-4 py-4 rounded-tr-lg text-right font-semibold">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {members.map(member => (
                    <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 font-medium">
                        <div className="flex flex-col">
                          <span>{member.name}</span>
                          <span className="text-xs text-muted-foreground">{member.email}</span>
                        </div>
                      </td>
                      {categories.map(cat => {
                        const isPaid = memberBills.find(mb => mb.category_id === cat.id && mb.member_id === member.id)?.is_paid || false;
                        return (
                          <td key={cat.id} className="px-4 py-4 text-center">
                            <button 
                              onClick={() => isAdmin && toggleBill(cat.id, member.id, isPaid)}
                              className={`focus:outline-none transition-transform ${isAdmin ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                              disabled={!isAdmin}
                            >
                              {isPaid ? (
                                <CheckCircle2 className="w-6 h-6 text-success mx-auto" />
                              ) : (
                                <Circle className="w-6 h-6 text-muted-foreground/30 mx-auto" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                      {isAdmin && (
                        <td className="px-4 py-4 text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => sendReminder(member)}
                            disabled={sendingEmail === member.id}
                          >
                            {sendingEmail === member.id ? 'Sending...' : (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                              </>
                            )}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={categories.length + 2} className="px-4 py-8 text-center text-muted-foreground">
                        No members found in this mess.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
