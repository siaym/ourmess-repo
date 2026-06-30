import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Utensils, Receipt, Wallet, TrendingUp, Clock, FileBarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];

const StatCard = ({ title, value, icon: Icon, trend, trendValue }: any) => (
  <Card className="bg-card/50 backdrop-blur-xl border-border/50">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="w-4 h-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-success" />
          <span className="text-success">{trendValue}</span> {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

export function Dashboard() {
  const { currentMess, user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [monthName, setMonthName] = useState(() => {
    const d = new Date();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  });
  const [closingMonth, setClosingMonth] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!currentMess) return;

      // 1. Fetch Stats
      const { data: statsData } = await supabase
        .from('dashboard_stats')
        .select('*')
        .eq('mess_id', currentMess.id)
        .single();
      
      if (statsData) setStats(statsData);

      // 2. Fetch Expenses for Chart
      const { data: expData } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('mess_id', currentMess.id)
        .eq('is_deleted', false);
        
      if (expData && expData.length > 0) {
        const categoryTotals = expData.reduce((acc: any, curr: any) => {
          acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
          return acc;
        }, {});
        
        const cData = Object.keys(categoryTotals).map(key => ({
          name: key,
          value: categoryTotals[key]
        }));
        setChartData(cData);
      }

      // 3. Fetch Recent Activity
      const { data: recentMeals } = await supabase.from('meal_details').select('member_name, created_at').eq('mess_id', currentMess.id).order('created_at', { ascending: false }).limit(4);
      const { data: recentExp } = await supabase.from('expense_details').select('spender_name, title, created_at').eq('mess_id', currentMess.id).order('created_at', { ascending: false }).limit(4);
      const { data: recentDep } = await supabase.from('deposit_details').select('depositor_name, amount, created_at').eq('mess_id', currentMess.id).order('created_at', { ascending: false }).limit(4);

      let allActivity: any[] = [];
      if (recentMeals) allActivity.push(...recentMeals.map(m => ({ id: m.created_at + 'm', type: 'Meal', text: `${m.member_name} logged a meal`, date: m.created_at, icon: Utensils })));
      if (recentExp) allActivity.push(...recentExp.map(e => ({ id: e.created_at + 'e', type: 'Expense', text: `${e.spender_name} logged an expense: ${e.title}`, date: e.created_at, icon: Receipt })));
      if (recentDep) allActivity.push(...recentDep.map(d => ({ id: d.created_at + 'd', type: 'Deposit', text: `${d.depositor_name} deposited ৳${d.amount}`, date: d.created_at, icon: Wallet })));

      allActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(allActivity.slice(0, 6));

      // 4. Check if Admin
      const { data: roleData } = await supabase.rpc('get_user_role', { 
        p_mess_id: currentMess.id, 
        p_user_id: user?.id 
      });
      setIsAdmin(roleData === 'owner' || roleData === 'manager');
    }
    
    fetchData();
  }, [currentMess, user]);

  const handleCloseMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMess || !user) return;
    setClosingMonth(true);
    setCloseError(null);

    const { data: reportId, error: dbError } = await supabase.rpc('close_month', {
      p_mess_id: currentMess.id,
      p_month_name: monthName
    });

    if (dbError) {
      setCloseError(dbError.message);
      setClosingMonth(false);
    } else if (reportId) {
      // Month closed successfully! Fetch members to send summary emails
      try {
        const { data: reportMembers } = await supabase
          .from('monthly_report_members')
          .select('*, users(name, email)')
          .eq('report_id', reportId);

        if (reportMembers) {
          // Import email service dynamically to avoid top-level issues if not needed elsewhere
          const { sendEmailNotification } = await import('../lib/emailService');
          
          for (const member of reportMembers) {
            const isDue = member.balance < 0;
            const balanceText = isDue 
              ? `Due: ৳${Math.abs(member.balance).toFixed(2)}` 
              : `Advance: ৳${member.balance.toFixed(2)}`;

            // 1. Insert In-App Notification (System Alert)
            await supabase.from('notifications').insert({
              mess_id: currentMess.id,
              user_id: member.member_id,
              title: `Month Closed: ${monthName}`,
              message: `The month has been closed. Your final balance is ${balanceText}.`,
              type: isDue ? 'alert' : 'system'
            });

            // 2. Send Email if they are in Minus (Due)
            if (isDue && member.users?.email) {
              await sendEmailNotification({
                to_email: member.users.email,
                to_name: member.users.name || 'Member',
                subject: `Action Required: Due Balance for ${monthName}`,
                message: `Hello ${member.users.name || 'Member'},\n\nThe month of ${monthName} has been officially closed by the mess manager.\n\nYour final balance is negative (${balanceText}).\nPlease clear your dues as soon as possible to keep the mess fund healthy.\n\nThank you,\nMessFlow System`
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to send month-close notifications", err);
      }

      setShowCloseModal(false);
      setClosingMonth(false);
      setMonthName('');
      // Force reload to clear everything from the UI
      window.location.reload();
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 relative"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of your mess statistics for this month.</p>
        </div>
        {isAdmin && (
          <Button variant="destructive" className="shrink-0 gap-2" onClick={() => setShowCloseModal(true)}>
            <FileBarChart className="w-4 h-4" />
            Close Month
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <StatCard title="Total Members" value={stats?.total_members || '0'} icon={Users} trend="Live" trendValue="Active" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Total Meals" value={stats ? Number(stats.total_meals).toFixed(1) : '0.0'} icon={Utensils} trend="Logged" trendValue="Total" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Total Expenses" value={`৳ ${stats ? Number(stats.total_expenses).toFixed(2) : '0.00'}`} icon={Receipt} trend="Mess Fund" trendValue="Burned" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Current Meal Rate" value={`৳ ${stats ? Number(stats.current_meal_rate).toFixed(2) : '0.00'}`} icon={Wallet} trend="calculated live" trendValue="Active" />
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={item} className="col-span-4">
          <Card className="h-[400px] bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Expense Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `৳ ${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Receipt className="w-12 h-12 mb-4 opacity-20" />
                  <p>No expenses logged yet to chart.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item} className="col-span-3">
          <Card className="h-[400px] bg-card/50 backdrop-blur-xl border-border/50 overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-6">
                {activities.length > 0 ? (
                  activities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.text}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(activity.date)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                    <p>No recent activity.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCloseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowCloseModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="z-50 w-full max-w-md"
            >
              <Card className="border-border/50 bg-card/95 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <FileBarChart className="w-5 h-5" />
                    Close Current Month
                  </CardTitle>
                </CardHeader>
                <form onSubmit={handleCloseMonth}>
                  <CardContent className="space-y-4">
                    {closeError && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">{closeError}</div>}
                    
                    <p className="text-sm text-muted-foreground">
                      Warning: This will archive all current meals, expenses, and deposits into a new Report, and reset the dashboard. Everyone's final balance will be carried over to the new month as a deposit.
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="monthName">Name of the Report</Label>
                      <Input 
                        id="monthName" 
                        required 
                        placeholder="e.g. June 2026" 
                        value={monthName} 
                        onChange={e => setMonthName(e.target.value)} 
                        disabled={closingMonth} 
                      />
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0 flex justify-between">
                    <Button variant="ghost" type="button" onClick={() => setShowCloseModal(false)} disabled={closingMonth}>Cancel</Button>
                    <Button variant="destructive" type="submit" disabled={closingMonth}>
                      {closingMonth ? 'Closing...' : 'Confirm & Close Month'}
                    </Button>
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
