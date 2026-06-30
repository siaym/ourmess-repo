import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function Settings() {
  const { currentMess } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Announcement state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkRole() {
      if (!currentMess) return;
      const { data: { user } } = await supabase.auth.getUser();
      const { data: roleData } = await supabase.rpc('get_user_role', { 
        p_mess_id: currentMess.id, 
        p_user_id: user?.id 
      });
      setIsAdmin(roleData === 'owner' || roleData === 'manager');
    }
    checkRole();
  }, [currentMess]);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMess) return;
    setSending(true);
    setError('');
    setSuccess('');

    const { error: dbError } = await supabase.rpc('broadcast_notification', {
      p_mess_id: currentMess.id,
      p_title: title,
      p_message: message,
      p_type: 'announcement'
    });

    if (dbError) {
      setError(dbError.message);
    } else {
      setSuccess('Announcement sent to all members!');
      setTitle('');
      setMessage('');
    }
    setSending(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your mess settings and notifications.</p>
      </div>

      {isAdmin && (
        <Card className="bg-card/50 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Send Announcement
            </CardTitle>
            <CardDescription>
              Send an in-app notification to every member of the mess.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Important Update"
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
                {sending ? 'Sending...' : 'Send to All Members'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
