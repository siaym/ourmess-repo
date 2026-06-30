import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Ban, Mail, Users, KeyRound, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MessAdminData {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  created_at: string;
  is_banned: boolean;
  mail_service_enabled: boolean;
  member_count: number;
}

interface MessMemberData {
  member_id: string;
  user_name: string;
  user_email: string;
  role: string;
  joined_at: string;
  is_deleted: boolean;
}

export function SuperAdmin() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'controls' | 'users'>('controls');
  const [messes, setMesses] = useState<MessAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for expanded mess details
  const [expandedMessId, setExpandedMessId] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, MessMemberData[]>>({});
  const [loadingMembers, setLoadingMembers] = useState<Record<string, boolean>>({});
  const [resetStatus, setResetStatus] = useState<{id: string, status: 'sending' | 'success' | 'error', msg?: string} | null>(null);

  const fetchMesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_messes_admin');
      if (error) throw error;
      setMesses(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch messes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMesses();
  }, []);

  const handleToggle = async (messId: string, field: 'is_banned' | 'mail_service_enabled', currentValue: boolean) => {
    try {
      const newValue = !currentValue;
      const { error } = await supabase.rpc('toggle_mess_status', {
        p_mess_id: messId,
        p_field: field,
        p_value: newValue
      });
      
      if (error) throw error;
      
      setMesses(prev => prev.map(m => {
        if (m.id === messId) {
          return { ...m, [field]: newValue };
        }
        return m;
      }));
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    }
  };

  const toggleExpand = async (messId: string) => {
    if (expandedMessId === messId) {
      setExpandedMessId(null);
      return;
    }
    
    setExpandedMessId(messId);
    
    // Fetch members if not already cached
    if (!members[messId]) {
      setLoadingMembers(prev => ({ ...prev, [messId]: true }));
      try {
        const { data, error } = await supabase.rpc('get_mess_members_admin', { p_mess_id: messId });
        if (error) throw error;
        
        setMembers(prev => ({ ...prev, [messId]: data || [] }));
      } catch (err: any) {
        console.error("Failed to fetch members", err);
      } finally {
        setLoadingMembers(prev => ({ ...prev, [messId]: false }));
      }
    }
  };

  const sendPasswordReset = async (email: string, userId: string) => {
    setResetStatus({ id: userId, status: 'sending' });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setResetStatus({ id: userId, status: 'success', msg: 'Email Sent!' });
      setTimeout(() => setResetStatus(null), 3000);
    } catch (err: any) {
      setResetStatus({ id: userId, status: 'error', msg: err.message });
      setTimeout(() => setResetStatus(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Navbar */}
      <header className="relative z-40 h-16 flex items-center justify-between px-6 border-b border-border/50 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <ShieldAlert className="h-6 w-6" />
          <span>MessFlow Super Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back to App
          </Button>
          <Button variant="destructive" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-0 flex-1 overflow-y-auto p-6 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* Tabs */}
          <div className="flex space-x-2 p-1 bg-muted/50 rounded-lg w-fit mx-auto border border-border">
            <button
              onClick={() => setActiveTab('controls')}
              className={`px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
                activeTab === 'controls' 
                  ? 'bg-background shadow-sm text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              Global Controls
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
                activeTab === 'users' 
                  ? 'bg-background shadow-sm text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              User Management
            </button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md">
              {error}
            </div>
          )}

          {/* TAB 1: Global Controls */}
          {activeTab === 'controls' && (
            <Card className="bg-card/50 backdrop-blur-xl border-border/50 border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle>Platform Controls</CardTitle>
                <CardDescription>
                  Ban abusive messes or disable email services globally.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading platform data...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Mess Name</th>
                          <th className="px-4 py-3">Owner</th>
                          <th className="px-4 py-3 text-center">Members</th>
                          <th className="px-4 py-3 text-center">Email Service</th>
                          <th className="px-4 py-3 text-center rounded-tr-lg">Status (Ban)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {messes.map((mess) => (
                          <tr key={mess.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="font-semibold text-base">{mess.name}</div>
                              <div className="text-xs text-muted-foreground">{new Date(mess.created_at).toLocaleDateString()}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium">{mess.owner_name}</div>
                              <div className="text-xs text-muted-foreground">{mess.owner_email}</div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                                {mess.member_count}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Button 
                                variant={mess.mail_service_enabled ? "default" : "outline"} 
                                size="sm"
                                onClick={() => handleToggle(mess.id, 'mail_service_enabled', mess.mail_service_enabled)}
                                className={mess.mail_service_enabled ? 'bg-success text-success-foreground hover:bg-success/90' : 'text-muted-foreground'}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                {mess.mail_service_enabled ? 'Enabled' : 'Disabled'}
                              </Button>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Button 
                                variant={mess.is_banned ? "destructive" : "outline"} 
                                size="sm"
                                onClick={() => handleToggle(mess.id, 'is_banned', mess.is_banned)}
                                className={mess.is_banned ? '' : 'text-muted-foreground hover:text-destructive hover:border-destructive'}
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                {mess.is_banned ? 'BANNED' : 'Active'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 2: User Management */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold">Mess Directory</h3>
                <p className="text-muted-foreground">Expand a mess to manage its users and reset passwords.</p>
              </div>
              
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Loading directory...</p>
              ) : (
                <div className="grid gap-4">
                  {messes.map((mess) => (
                    <Card key={mess.id} className="overflow-hidden border-border/50 bg-card/30">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleExpand(mess.id)}
                      >
                        <div>
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            {mess.name}
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-normal">
                              {mess.member_count} Members
                            </span>
                          </h4>
                          <p className="text-sm text-muted-foreground">{mess.description || 'No description'}</p>
                        </div>
                        <div className="text-muted-foreground">
                          {expandedMessId === mess.id ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedMessId === mess.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/50 bg-background/50"
                          >
                            <div className="p-4">
                              {loadingMembers[mess.id] ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">Loading members...</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="text-xs text-muted-foreground uppercase border-b border-border/50">
                                      <tr>
                                        <th className="px-4 py-2 font-medium">Member Name</th>
                                        <th className="px-4 py-2 font-medium">Email</th>
                                        <th className="px-4 py-2 font-medium">Role</th>
                                        <th className="px-4 py-2 font-medium text-right">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                      {members[mess.id]?.map((member) => (
                                        <tr key={member.member_id} className={`hover:bg-muted/30 ${member.is_deleted ? 'opacity-50' : ''}`}>
                                          <td className="px-4 py-3">
                                            <div className="font-medium">{member.user_name}</div>
                                            {member.is_deleted && <span className="text-xs text-destructive">Left Mess</span>}
                                          </td>
                                          <td className="px-4 py-3 text-muted-foreground">
                                            {member.user_email}
                                          </td>
                                          <td className="px-4 py-3">
                                            <span className="capitalize text-xs bg-muted px-2 py-1 rounded-md">
                                              {member.role}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-right">
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              className="text-primary hover:text-primary hover:bg-primary/10"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                sendPasswordReset(member.user_email, member.member_id);
                                              }}
                                              disabled={resetStatus?.id === member.member_id}
                                            >
                                              {resetStatus?.id === member.member_id ? (
                                                resetStatus.status === 'sending' ? 'Sending...' :
                                                resetStatus.status === 'success' ? <span className="text-success">{resetStatus.msg}</span> :
                                                <span className="text-destructive">Failed</span>
                                              ) : (
                                                <>
                                                  <KeyRound className="w-3.5 h-3.5 mr-2" />
                                                  Reset Password
                                                </>
                                              )}
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                      {members[mess.id]?.length === 0 && (
                                        <tr>
                                          <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">
                                            No members found.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
