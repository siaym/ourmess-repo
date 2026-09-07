import { motion } from 'framer-motion';

export function Problem() {
  return (
    <section className="py-32 px-4 md:px-8 border-t border-border overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-24">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            The traditional way
            <span className="block text-muted-foreground">is an actual mess.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-24 items-start">
          {/* Chaos */}
          <div className="relative h-[300px] md:h-[400px] font-mono text-sm md:text-base text-muted-foreground w-full overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, x: -10, y: 10, rotate: -3 }}
              whileInView={{ opacity: 0.5, x: 0, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              className="absolute top-[5%] left-[5%]"
            >
              Breakfast 8
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20, y: -10, rotate: 6 }}
              whileInView={{ opacity: 0.6, x: 0, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              className="absolute top-[15%] left-[30%]"
            >
              Lunch 11
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -20, y: 20, rotate: -8 }}
              whileInView={{ opacity: 0.4, x: 0, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              className="absolute top-[25%] left-[55%]"
            >
              Dinner 9
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.7, y: 0 }}
              viewport={{ once: true }}
              className="absolute top-[40%] left-[5%] text-foreground"
            >
              Market ৳4,850 <span className="text-muted-foreground opacity-50 block md:inline">(paid by Rahim?)</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 0.5, x: 0 }}
              viewport={{ once: true }}
              className="absolute top-[55%] right-[5%] line-through decoration-destructive"
            >
              Total meals: 142
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.8 }}
              viewport={{ once: true }}
              className="absolute top-[70%] left-[15%] text-xs md:text-sm"
            >
              Wait, Karim gave ৳2000 deposit?
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="absolute bottom-[5%] left-[5%] text-lg md:text-xl font-bold uppercase tracking-tight text-foreground"
            >
              Who owes whom?
            </motion.div>
          </div>

          {/* Order */}
          <div className="relative h-[400px] border-l border-border pl-8 md:pl-16 flex flex-col justify-center">
            <h3 className="text-xs tracking-[0.2em] font-bold uppercase text-primary mb-12">
              There has to be a better way
            </h3>
            
            <div className="space-y-8 font-mono">
              <div className="flex justify-between items-baseline border-b border-border pb-2">
                <span className="text-muted-foreground uppercase text-xs tracking-wider">Total Meals</span>
                <span className="text-2xl">145</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border pb-2">
                <span className="text-muted-foreground uppercase text-xs tracking-wider">Total Expenses</span>
                <span className="text-2xl">৳8,420</span>
              </div>
              <div className="flex justify-between items-baseline pt-4">
                <span className="text-foreground uppercase text-sm tracking-wider font-bold">Exact Meal Rate</span>
                <span className="text-4xl text-primary">৳58.07</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
