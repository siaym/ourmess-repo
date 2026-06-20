import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileBarChart, Download, Users, Utensils, Receipt, Wallet, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface MonthlyReport {
  id: string;
  month_name: string;
  total_expenses: number;
  total_meals: number;
  meal_rate: number;
  created_at: string;
}

interface ReportMember {
  member_id: string;
  name: string;
  total_deposits: number;
  total_meals: number;
  balance: number;
}

export function Reports() {
  const { currentMess } = useAuth();
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [reportMembers, setReportMembers] = useState<ReportMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      if (!currentMess) return;
      setLoading(true);
      const { data } = await supabase
        .from('monthly_reports')
        .select('*')
        .eq('mess_id', currentMess.id)
        .order('created_at', { ascending: false });
      
      if (data) setReports(data as MonthlyReport[]);
      setLoading(false);
    }
    fetchReports();
  }, [currentMess]);

  const openReport = async (report: MonthlyReport) => {
    setSelectedReport(report);
    setLoadingMembers(true);
    
    // Join with users to get name
    const { data } = await supabase
      .from('monthly_report_members')
      .select(`
        member_id,
        total_deposits,
        total_meals,
        balance,
        users:member_id(name)
      `)
      .eq('report_id', report.id);
      
    if (data) {
      const formatted = data.map((d: any) => ({
        member_id: d.member_id,
        name: d.users?.name || 'Unknown',
        total_deposits: d.total_deposits,
        total_meals: d.total_meals,
        balance: d.balance
      }));
      setReportMembers(formatted);
    }
    setLoadingMembers(false);
  };

  const downloadCSV = () => {
    if (!selectedReport) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Month,${selectedReport.month_name}\n`;
    csvContent += `Total Expenses,${selectedReport.total_expenses}\n`;
    csvContent += `Total Meals,${selectedReport.total_meals}\n`;
    csvContent += `Meal Rate,${selectedReport.meal_rate}\n\n`;
    
    csvContent += "Member Name,Total Deposits,Total Meals,Final Balance\n";
    
    reportMembers.forEach(m => {
      csvContent += `"${m.name}",${m.total_deposits},${m.total_meals},${m.balance}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Mess_Report_${selectedReport.month_name.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Monthly Reports</h2>
        <p className="text-muted-foreground mt-1">Historical archives of closed months.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <FileBarChart className="w-12 h-12 mb-4 opacity-20" />
              <p>No months have been closed yet.</p>
              <p className="text-sm mt-2">Managers can close the current month from the Dashboard.</p>
            </div>
          </div>
        ) : (
          reports.map((report) => (
            <motion.div key={report.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card 
                className="bg-card/50 backdrop-blur-xl border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => openReport(report)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {report.month_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Receipt className="w-3 h-3"/> Expenses:</span>
                    <span className="font-medium">৳ {Number(report.total_expenses).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Utensils className="w-3 h-3"/> Meals:</span>
                    <span className="font-medium">{Number(report.total_meals).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                    <span className="text-muted-foreground flex items-center gap-1"><Wallet className="w-3 h-3"/> Rate:</span>
                    <span className="font-bold text-primary">৳ {Number(report.meal_rate).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="z-50 w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
              <Card className="border-border/50 bg-card/95 shadow-2xl flex flex-col overflow-hidden h-full">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/30">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <FileBarChart className="w-6 h-6 text-primary" />
                    {selectedReport.month_name} Report
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={downloadCSV} className="gap-2">
                      <Download className="w-4 h-4" />
                      Download Excel (CSV)
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>Close</Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <div className="p-6 grid grid-cols-3 gap-6 bg-muted/10 border-b border-border/50">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold">৳ {Number(selectedReport.total_expenses).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Meals</p>
                      <p className="text-2xl font-bold">{Number(selectedReport.total_meals).toFixed(1)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Meal Rate</p>
                      <p className="text-2xl font-bold text-primary">৳ {Number(selectedReport.meal_rate).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="p-0">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50 sticky top-0">
                        <tr>
                          <th className="px-6 py-4 font-medium">Member</th>
                          <th className="px-6 py-4 font-medium text-right">Total Deposits</th>
                          <th className="px-6 py-4 font-medium text-right">Total Meals</th>
                          <th className="px-6 py-4 font-medium text-right">Final Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {loadingMembers ? (
                          <tr><td colSpan={4} className="text-center py-12">Loading members...</td></tr>
                        ) : reportMembers.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-12">No members found in this report.</td></tr>
                        ) : (
                          reportMembers.map((m) => (
                            <tr key={m.member_id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-4 font-medium flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                {m.name}
                              </td>
                              <td className="px-6 py-4 text-right">৳ {Number(m.total_deposits).toFixed(2)}</td>
                              <td className="px-6 py-4 text-right">{Number(m.total_meals).toFixed(1)}</td>
                              <td className={`px-6 py-4 text-right font-bold ${m.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {m.balance >= 0 ? '+' : '-'} ৳ {Math.abs(m.balance).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
