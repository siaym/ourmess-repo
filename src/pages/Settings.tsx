import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, AlertCircle, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MemberOption {
  user_id: string;
  name: string;
  email: string;
  balance: number;
}

export function Settings() {
  const { currentMess } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  
  // Announcement state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetUser, setTargetUser] = useState('ALL');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Dues state
  const [sendingDues, setSendingDues] = useState(false);
  const [duesSuccess, setDuesSuccess] = useState('');
  
  useEffect(() => {
    async function fetchData() {
      if (!currentMess) return;
      const { data: { user } } = await supabase.auth.getUser();
      const { data: roleData } = await supabase.rpc('get_user_role', { 
        p_mess_id: currentMess.id, 
        p_user_id: user?.id 
      });
      setIsAdmin(roleData === 'owner' || roleData === 'manager');

      if (roleData === 'owner' || roleData === 'manager') {
        // Fetch members for dropdown and dues
        const { data: memberData } = await supabase
          .from('member_balances')
          .select('member_id, name, email, balance')
          .eq('mess_id', currentMess.id);
        
        if (memberData) {
          setMembers(memberData.map((m: any) => ({ 
            user_id: m.member_id, 
            name: m.name, 
            email: m.email,
            balance: m.balance
          })));
        }
      }
    }
    fetchData();
  }, [currentMess]);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMess) return;
    setSending(true);
    setError('');
    setSuccess('');

    try {
      let targetMembers = members;
      if (targetUser !== 'ALL') {
        targetMembers = members.filter(m => m.user_id === targetUser);
      }

      const notifications = targetMembers.map(m => ({
        mess_id: currentMess.id,
        user_id: m.user_id,
        title: title,
        message: message,
        type: 'announcement'
      }));

      const { error: dbError } = await supabase.from('notifications').insert(notifications);
      if (dbError) throw dbError;

      const { sendEmailNotification } = await import('../lib/emailService');
      for (const m of targetMembers) {
        if (m.email) {
          try {
            await sendEmailNotification({
              to_email: m.email,
              to_name: m.name || 'Member',
              subject: `Announcement: ${title}`,
              message: `${message}\n\n- Sent from MessFlow System`
            });
          } catch (emailErr) {
            console.error("Failed to send email to", m.email, emailErr);
          }
        }
      }

      setSuccess(targetUser === 'ALL' ? 'Announcement and emails sent to all members!' : 'Message and email sent successfully!');
      setTitle('');
      setMessage('');
      setTargetUser('ALL');
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const dueMembers = members.filter(m => m.balance < 0);

  const handleSendDuesReminders = async (specificMemberId?: string) => {
    if (!currentMess) return;
    setSendingDues(true);
    setDuesSuccess('');
    
    let targets = dueMembers;
    if (specificMemberId) {
      targets = dueMembers.filter(m => m.user_id === specificMemberId);
    }

    try {
      const { sendEmailNotification } = await import('../lib/emailService');
      
      for (const m of targets) {
        const dueAmount = Math.abs(m.balance).toFixed(2);
        
        // 1. Send In-App Notification
        await supabase.from('notifications').insert({
          mess_id: currentMess.id,
          user_id: m.user_id,
          title: 'Dues Reminder',
          message: `This is a manual reminder that you currently owe ৳${dueAmount}. Please clear your balance.`,
          type: 'alert'
        });

        // 2. Send Email
        if (m.email) {
          await sendEmailNotification({
            to_email: m.email,
            to_name: m.name || 'Member',
            subject: 'Action Required: Dues Reminder',
            message: `Hello ${m.name || 'Member'},\n\nThis is a manual reminder from your mess admin(siyam).\n\nYou currently have a negative balance and owe exactly ৳${dueAmount}.\nPlease make a deposit to the mess fund as soon as possible to clear your dues.\n\nThank you!`
          });
        }
      }
      
      setDuesSuccess(specificMemberId ? 'Reminder sent successfully!' : `Reminders sent to all ${targets.length} members with dues!`);
      setTimeout(() => setDuesSuccess(''), 4000);
    } catch (err) {
      console.error("Failed to send dues reminder", err);
    } finally {
      setSendingDues(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6 pb-20"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your mess settings and notifications.</p>
      </div>

      {isAdmin && (
        <>
          {/* DUES MANAGEMENT CARD */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 border-l-4 border-l-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Dues Management
              </CardTitle>
              <CardDescription>
                Manually remind members who currently have a negative balance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dueMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">All members have positive balances! No dues to collect.</p>
              ) : (
                <div className="space-y-4">
                  <div className="border border-border/50 rounded-lg divide-y divide-border/50">
                    {dueMembers.map(m => (
                      <div key={m.user_id} className="flex items-center justify-between p-3 sm:px-4 text-sm">
                        <div>
                          <p className="font-medium">{m.name}</p>
                          <p className="text-destructive">Owes: ৳{Math.abs(m.balance).toFixed(2)}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSendDuesReminders(m.user_id)}
                          disabled={sendingDues}
                          className="gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          <span className="hidden sm:inline">Remind</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <p className="text-sm text-success">{duesSuccess}</p>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleSendDuesReminders()}
                      disabled={sendingDues}
                      className="w-full sm:w-auto gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {sendingDues ? 'Sending...' : `Remind All (${dueMembers.length})`}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEND MESSAGE CARD */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Send Message
              </CardTitle>
              <CardDescription>
                Send an in-app notification to a specific member or everyone in the mess.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendAnnouncement} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Send To</Label>
                  <select 
                    id="target" 
                    value={targetUser} 
                    onChange={e => setTargetUser(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="ALL" className="bg-background">Everyone (All Members)</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id} className="bg-background">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="e.g. Important Update or Dues Reminder"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea 
                    id="message" 
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    placeholder="Type your message here..."
                    required 
                  />
                </div>
                
                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-success">{success}</p>}
                
                <Button type="submit" disabled={sending} className="w-full sm:w-auto gap-2">
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}
