import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, MoreVertical, ShieldAlert, Trash2, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface MemberBalance {
  mess_id: string;
  member_id: string;
  name: string;
  role: string;
  total_deposits: number;
  total_meals: number;
  current_meal_rate: number;
  balance: number;
}

export function Members() {
  const { currentMess, user } = useAuth();
  const [members, setMembers] = useState<MemberBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!currentMess) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('member_balances')
      .select('*')
      .eq('mess_id', currentMess.id);
      
    if (!error && data) {
      setMembers(data as MemberBalance[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [currentMess]);

  const copyInviteCode = () => {
    if (currentMess?.invite_code) {
      navigator.clipboard.writeText(currentMess.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setActiveMenuId(null);
    if (!currentMess) return;
    
    // Optimistic UI update
    setMembers(m => m.map(mem => mem.member_id === memberId ? { ...mem, role: newRole } : mem));
    
    await supabase
      .from('mess_members')
      .update({ role: newRole })
      .eq('mess_id', currentMess.id)
      .eq('user_id', memberId);
      
    fetchMembers();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setActiveMenuId(null);
    if (!currentMess) return;
    
    setMembers(m => m.filter(mem => mem.member_id !== memberId));
    
    await supabase
      .from('mess_members')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('mess_id', currentMess.id)
      .eq('user_id', memberId);
  };

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const myRole = members.find(m => m.member_id === user?.id)?.role || 'member';
  const isAdmin = myRole === 'owner' || myRole === 'manager';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground mt-1">Manage users and roles in your mess.</p>
        </div>
        {isAdmin && (
          <Button className="shrink-0 gap-2" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4" />
            Add Member
          </Button>
        )}
      </div>

      <Card className="bg-card/50 backdrop-blur-xl border-border/50">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search members..." 
              className="pl-9 bg-background/50" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Total Meals</th>
                  <th className="px-6 py-4 font-medium">Balance</th>
                  {isAdmin && <th className="px-6 py-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">Loading members...</td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">No members found.</td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.member_id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium text-foreground">
                            {member.name} {member.member_id === user?.id && <span className="text-xs text-muted-foreground font-normal ml-2">(You)</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          member.role === 'owner' ? 'bg-primary/20 text-primary' : 
                          member.role === 'manager' ? 'bg-success/20 text-success' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">{Number(member.total_meals).toFixed(1)}</td>
                      <td className="px-6 py-4">
                        <span className={member.balance < 0 ? 'text-destructive font-medium' : member.balance > 0 ? 'text-success font-medium' : ''}>
                          ৳ {Math.abs(member.balance).toFixed(2)} {member.balance < 0 ? '(Due)' : member.balance > 0 ? '(Adv)' : ''}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right relative">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => setActiveMenuId(activeMenuId === member.member_id ? null : member.member_id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          
                          {/* Action Dropdown Menu */}
                          {activeMenuId === member.member_id && member.role !== 'owner' && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                              <div className="absolute right-6 top-10 z-20 w-48 bg-card border border-border rounded-md shadow-lg overflow-hidden py-1">
                                <button 
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                  onClick={() => handleRoleChange(member.member_id, member.role === 'manager' ? 'member' : 'manager')}
                                >
                                  <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                                  {member.role === 'manager' ? 'Demote to Member' : 'Promote to Manager'}
                                </button>
                                <button 
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
                                  onClick={() => handleRemoveMember(member.member_id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove from Mess
                                </button>
                              </div>
                            </>
                          )}
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

      {/* Invite Code Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="z-50 w-full max-w-sm"
            >
              <Card className="border-border/50 bg-card/95 shadow-2xl">
                <CardHeader>
                  <CardTitle>Invite a Member</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Share this unique code with your roommate. They can enter it during sign-up to join your mess.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input 
                      readOnly 
                      value={currentMess?.invite_code || ''} 
                      className="font-mono text-center text-xl tracking-widest uppercase bg-muted"
                    />
                    <Button size="icon" onClick={copyInviteCode}>
                      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
                <div className="p-6 pt-0 flex justify-end">
                  <Button onClick={() => setShowInviteModal(false)}>Done</Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
