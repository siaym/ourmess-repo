import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, AlertCircle, Mail, ShieldAlert, KeyRound } from 'lucide-react';
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
  
  const mailEnabled = currentMess?.mail_service_enabled ?? true;

  // Reset Mess State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [userInputCode, setUserInputCode] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  
  const generateResetCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleInitiateReset = async () => {
    setResetLoading(true);
    setResetError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error("Could not find your email.");
      
      const code = generateResetCode();
      setResetCode(code);
      
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: user.email,
          to_name: user.user_metadata?.name || 'Mess Owner',
          subject: 'Danger: Reset Mess Verification Code',
          message: `You have requested to completely reset all financial data for your mess.\n\nYour 6-digit verification code is: **${code}**\n\nIf you did not request this, please ignore this email.`
        })
      });
      
      if (!res.ok) throw new Error("Failed to send verification email.");
      setShowResetModal(true);
    } catch (err: any) {
      setResetError(err.message || "Failed to initiate reset.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (userInputCode !== resetCode) {
      setResetError("Invalid verification code.");
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      const { error } = await supabase.rpc('reset_mess_data', { p_mess_id: currentMess?.id });
      if (error) throw error;
      
      alert("Success! Your mess has been completely reset.");
      window.location.reload();
    } catch (err: any) {
      setResetError(err.message || "Failed to reset mess data.");
      setResetLoading(false);
    }
  };

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

      if (mailEnabled) {
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
      }

      setSuccess(targetUser === 'ALL' ? 'Announcement sent to all members!' : 'Message sent successfully!');
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
        if (m.email && mailEnabled) {
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
          
          {/* DANGER ZONE */}
          <Card className="bg-destructive/5 backdrop-blur-xl border-destructive/20 mt-12 overflow-hidden">
            <CardHeader className="bg-destructive/10 border-b border-destructive/20">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-destructive/80">
                Irreversible and destructive actions for your mess.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-lg">Factory Reset Mess Data</h4>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    This will permanently delete ALL meals, expenses, and deposits, giving you a completely fresh start. Your members and the mess itself will not be deleted.
                  </p>
                </div>
                <Button 
                  variant="destructive"
                  onClick={handleInitiateReset}
                  disabled={resetLoading || showResetModal}
                >
                  {resetLoading && !showResetModal ? 'Sending Email...' : 'Reset Mess'}
                </Button>
              </div>
              
              {resetError && !showResetModal && (
                <p className="text-sm text-destructive mt-4">{resetError}</p>
              )}
            </CardContent>
          </Card>

          {/* Reset Modal */}
          {showResetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-card border border-border shadow-lg rounded-xl overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-destructive font-bold text-xl mb-2">
                    <KeyRound className="w-6 h-6" />
                    Verify Reset
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We just emailed a 6-digit verification code to you. Enter it below to confirm that you want to completely destroy all financial data in your mess.
                  </p>
                  
                  <div className="space-y-2 pt-4">
                    <Label>6-Digit Code</Label>
                    <Input 
                      value={userInputCode}
                      onChange={(e) => setUserInputCode(e.target.value)}
                      placeholder="123456"
                      className="text-center tracking-widest text-lg font-mono"
                      maxLength={6}
                    />
                  </div>

                  {resetError && <p className="text-sm text-destructive">{resetError}</p>}
                </div>
                
                <div className="flex gap-2 p-4 bg-muted/50 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowResetModal(false);
                      setUserInputCode('');
                      setResetError('');
                    }}
                    disabled={resetLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={handleConfirmReset}
                    disabled={resetLoading || userInputCode.length !== 6}
                  >
                    {resetLoading ? 'Resetting...' : 'Confirm Reset'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
