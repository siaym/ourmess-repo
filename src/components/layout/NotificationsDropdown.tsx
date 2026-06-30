import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'alert' | 'announcement';
  is_read: boolean;
  created_at: string;
}

export function NotificationsDropdown() {
  const { user, currentMess } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !currentMess) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('mess_id', currentMess.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Set up realtime subscription
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        const newNotif = payload.new as Notification;
        if (newNotif.mess_id === currentMess.id) {
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentMess]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('mess_id', currentMess?.id)
      .eq('user_id', user?.id)
      .eq('is_read', false);
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
                <h3 className="font-semibold tracking-tight">Notifications</h3>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs text-primary hover:text-primary/80"
                    onClick={markAllAsRead}
                  >
                    <Check className="w-3 h-3 mr-1" /> Mark all read
                  </Button>
                )}
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <Bell className="w-8 h-8 opacity-20" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id}
                        className={cn(
                          "p-4 flex gap-3 transition-colors hover:bg-muted/30 cursor-pointer",
                          !notif.is_read ? "bg-primary/5" : ""
                        )}
                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2 shrink-0",
                          !notif.is_read ? "bg-primary" : "bg-transparent"
                        )} />
                        <div className="flex-1 space-y-1">
                          <p className={cn(
                            "text-sm font-medium leading-none",
                            !notif.is_read ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 pt-1">
                            {new Date(notif.created_at).toLocaleString(undefined, { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
