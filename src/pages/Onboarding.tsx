import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Utensils, Users, Key, PlusCircle, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function Onboarding() {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create Mess state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Join Mess state
  const [inviteCode, setInviteCode] = useState('');

  const navigate = useNavigate();
  const { refreshMess, signOut } = useAuth();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error: rpcError } = await supabase.rpc('create_mess', {
      p_name: name,
      p_description: description,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
    } else {
      await refreshMess();
      navigate('/');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('join_mess', {
      p_invite_code: inviteCode,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
    } else {
      await refreshMess();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-lg z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 font-bold text-3xl tracking-tight text-primary">
            <Utensils className="h-8 w-8" />
            <span>MessFlow</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {mode === 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-6 sm:grid-cols-2"
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer bg-card/50 backdrop-blur-xl" onClick={() => setMode('create')}>
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Create a Mess</h3>
                  <p className="text-sm text-muted-foreground mt-2">Start a new mess and invite your roommates to join.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer bg-card/50 backdrop-blur-xl" onClick={() => setMode('join')}>
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Join a Mess</h3>
                  <p className="text-sm text-muted-foreground mt-2">Enter an invite code to join an existing mess.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {mode === 'create' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Create your Mess</CardTitle>
                <CardDescription>Give your mess a name to get started.</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreate}>
                <CardContent className="space-y-4">
                  {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">{error}</div>}
                  <div className="space-y-2">
                    <Label htmlFor="name">Mess Name</Label>
                    <Input id="name" required placeholder="e.g. The Matrix Hackers" value={name} onChange={e => setName(e.target.value)} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input id="description" placeholder="A cool place for cool people" value={description} onChange={e => setDescription(e.target.value)} disabled={loading} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="ghost" type="button" onClick={() => setMode('select')} disabled={loading}>Back</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Mess'}</Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Join a Mess</CardTitle>
                <CardDescription>Enter the 6-character invite code from your mess manager.</CardDescription>
              </CardHeader>
              <form onSubmit={handleJoin}>
                <CardContent className="space-y-4">
                  {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">{error}</div>}
                  <div className="space-y-2">
                    <Label htmlFor="code">Invite Code</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="code" required placeholder="XXXXXX" className="pl-9 uppercase" maxLength={6} value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} disabled={loading} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="ghost" type="button" onClick={() => setMode('select')} disabled={loading}>Back</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Joining...' : 'Join Mess'}</Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
