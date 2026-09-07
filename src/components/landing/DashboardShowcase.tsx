import { motion } from 'framer-motion';

export function DashboardShowcase() {
  return (
    <section className="bg-foreground text-background overflow-hidden relative">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-32">
        <div className="grid md:grid-cols-[1fr_2fr] gap-16 items-start">
          
          <div className="sticky top-32">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">
              The whole<br />mess.<br />
              <span className="text-muted">One screen.</span>
            </h2>
            <p className="text-lg text-muted max-w-sm mb-12">
              Everything in its right place. Get an instant overview of your mess's financial health, active members, and daily meals without digging through logs.
            </p>
            
            <div className="space-y-6 font-mono text-sm border-l border-muted/30 pl-6">
              <div className="uppercase tracking-[0.2em] text-muted text-xs">Navigation</div>
              <div className="hover:pl-2 transition-all cursor-pointer">Dashboard</div>
              <div className="hover:pl-2 transition-all cursor-pointer text-muted">Members</div>
              <div className="hover:pl-2 transition-all cursor-pointer text-muted">Meals</div>
              <div className="hover:pl-2 transition-all cursor-pointer text-muted">Expenses</div>
              <div className="hover:pl-2 transition-all cursor-pointer text-muted">Reports</div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="w-full bg-background text-foreground border border-border p-8 md:p-12 shadow-2xl relative"
          >
            {/* Minimal UI representation */}
            <div className="flex justify-between items-end mb-16 border-b border-border pb-8">
              <div>
                <div className="uppercase text-xs tracking-[0.2em] text-muted-foreground font-bold mb-2">Month Status</div>
                <h3 className="text-3xl font-mono">September 2026</h3>
              </div>
              <div className="text-sm font-bold uppercase tracking-widest bg-primary text-primary-foreground px-4 py-2">
                Active
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 font-mono">
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-2">Meal Rate</div>
                <div className="text-2xl md:text-3xl">৳54.20</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-2">Total Meals</div>
                <div className="text-2xl md:text-3xl">145</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-2">Expenses</div>
                <div className="text-2xl md:text-3xl">৳7,859</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-2">Deposits</div>
                <div className="text-2xl md:text-3xl">৳12,500</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 font-mono">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-6 border-b border-border pb-2">Recent Expenses</div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-baseline">
                    <span className="uppercase">Market</span>
                    <span>৳1,200</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="uppercase">Utilities</span>
                    <span>৳850</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="uppercase">Market</span>
                    <span>৳450</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-6 border-b border-border pb-2">Balances</div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-baseline">
                    <span className="uppercase">Siyam</span>
                    <span className="text-success">+৳450</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="uppercase">Rahim</span>
                    <span className="text-destructive">-৳120</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="uppercase">Karim</span>
                    <span className="text-success">+৳80</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bleeding edge element to break the box slightly */}
            <div className="absolute -right-12 top-12 w-24 h-px bg-border" />
            <div className="absolute right-12 -bottom-12 w-px h-24 bg-border" />
            <div className="absolute -left-12 bottom-24 w-24 h-px bg-border" />
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
