import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="pt-32 pb-16 md:pt-48 md:pb-32 px-4 md:px-8 max-w-[1400px] mx-auto">
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-16 items-start">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-10"
          >
            <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-[0.9] uppercase text-foreground">
              Run your<br />mess.
              <span className="block text-muted-foreground mt-2">Not the<br />math.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-lg leading-snug">
              Managing a shared mess shouldn't require endless spreadsheets. The product handles the boring accounting so you can focus on living.
            </p>
            
            <div className="flex items-center gap-6 pt-4">
              <Link 
                to="/register" 
                className="inline-flex h-14 items-center justify-center rounded-none bg-primary px-8 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create your mess
              </Link>
              <a 
                href="#calculation" 
                className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors"
              >
                See how it works
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative pt-12 lg:pt-0 lg:pl-16 border-t lg:border-t-0 lg:border-l border-border"
        >
          <div className="font-mono text-sm md:text-base selection:bg-primary/30">
            <div className="flex flex-col items-start lg:items-end text-left lg:text-right gap-1 mb-12">
              <div className="text-6xl md:text-8xl font-light tracking-tighter">৳54.20</div>
              <div className="text-[10px] md:text-xs tracking-[0.2em] font-bold text-muted-foreground uppercase">Current Meal Rate</div>
            </div>

            <div className="space-y-4 border-t border-border pt-6 mt-6">
              <div className="flex justify-between items-end">
                <span className="text-muted-foreground uppercase text-xs tracking-widest">Total Meals</span>
                <span className="text-2xl font-light">145</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-muted-foreground uppercase text-xs tracking-widest">Total Expenses</span>
                <span className="text-2xl font-light">৳7,859</span>
              </div>
            </div>

            <div className="border-t border-foreground pt-6 mt-6 space-y-3">
              <div className="text-[10px] md:text-xs tracking-[0.2em] font-bold text-muted-foreground uppercase mb-6">Live Balances</div>
              <div className="flex justify-between items-center group">
                <span className="uppercase text-sm tracking-wider">Siyam</span>
                <span className="text-success font-medium">+৳450</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="uppercase text-sm tracking-wider">Rahim</span>
                <span className="text-destructive font-medium">-৳120</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="uppercase text-sm tracking-wider">Karim</span>
                <span className="text-success font-medium">+৳80</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
