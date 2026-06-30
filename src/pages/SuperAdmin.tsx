import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Ban, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';

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

export function SuperAdmin() {
  const [messes, setMesses] = useState<MessAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      
      // Update local state
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 pb-20"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-2">
          <ShieldAlert className="h-8 w-8" />
          Super Admin Dashboard
        </h2>
        <p className="text-muted-foreground mt-1">Global management for all messes on the platform.</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <Card className="bg-card/50 backdrop-blur-xl border-border/50 border-t-4 border-t-destructive">
        <CardHeader>
          <CardTitle>Platform Messes ({messes.length})</CardTitle>
          <CardDescription>
            Ban abusive messes or disable email services globally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading platform data...</p>
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
                      <td className="px-4 py-3">
                        <div className="font-semibold">{mess.name}</div>
                        <div className="text-xs text-muted-foreground">{new Date(mess.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{mess.owner_name}</div>
                        <div className="text-xs text-muted-foreground">{mess.owner_email}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-bold">
                          {mess.member_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
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
                      <td className="px-4 py-3 text-center">
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
    </motion.div>
  );
}
