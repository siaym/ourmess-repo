import { motion } from 'framer-motion';

export function SystemDiagram() {
  return (
    <section className="py-32 px-4 md:px-8 bg-muted/10 border-t border-border" id="calculation">
      <div className="max-w-[1000px] mx-auto flex flex-col items-center">
        
        <div className="text-center mb-24">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground mb-4">
            How your mess
            <br />
            <span className="text-foreground">becomes a bill</span>
          </h2>
        </div>

        {/* Top layer: Meals & Expenses */}
        <div className="w-full flex justify-between md:justify-around items-end font-mono mb-16 relative">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-2"
          >
            <div className="text-4xl md:text-6xl font-light tracking-tighter">145</div>
            <div className="text-xs tracking-[0.2em] font-bold text-muted-foreground uppercase">Total Meals</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col items-center gap-2"
          >
            <div className="text-4xl md:text-6xl font-light tracking-tighter">৳7,859</div>
            <div className="text-xs tracking-[0.2em] font-bold text-muted-foreground uppercase">Expenses</div>
          </motion.div>
        </div>

        {/* Diagonal lines to center */}
        <div className="relative w-full h-32 flex justify-center mb-16">
          <motion.div 
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full flex justify-center"
          >
            <svg className="w-full h-full max-w-[600px] mx-auto overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 10,0 L 45,90" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-border" vectorEffect="non-scaling-stroke" />
              <path d="M 90,0 L 55,90" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-border" vectorEffect="non-scaling-stroke" />
              <circle cx="45" cy="95" r="1.5" fill="currentColor" className="text-primary" />
              <circle cx="55" cy="95" r="1.5" fill="currentColor" className="text-primary" />
            </svg>
          </motion.div>
        </div>

        {/* Middle layer: Meal Rate */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-2 mb-16 font-mono"
        >
          <div className="text-6xl md:text-8xl font-medium tracking-tighter text-primary">৳54.20</div>
          <div className="text-xs tracking-[0.2em] font-bold text-muted-foreground uppercase">Meal Rate</div>
        </motion.div>

        {/* Down arrow */}
        <div className="h-24 w-px bg-border mb-16 relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
        </div>

        {/* Bottom layer: Balances */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.7 }}
          className="w-full max-w-sm border border-border p-8 font-mono bg-background"
        >
          <div className="text-xs tracking-[0.2em] font-bold text-center text-muted-foreground uppercase mb-8">
            Member Balances
          </div>
          <div className="space-y-4 text-sm md:text-base">
            <div className="flex justify-between items-center">
              <span>Siyam</span>
              <span className="text-success">+৳450</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Rahim</span>
              <span className="text-destructive">-৳120</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Karim</span>
              <span className="text-success">+৳80</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
