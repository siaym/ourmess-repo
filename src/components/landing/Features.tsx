import { motion } from 'framer-motion';

export function Features() {
  return (
    <section className="border-t border-border bg-background" id="features">
      
      {/* 01 RECORD */}
      <div className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-24 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">01 — Record</div>
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">Every meal counts.</h3>
            <p className="text-lg text-muted-foreground max-w-md">
              No more paper logs. Enter breakfast, lunch, and dinner directly. The system calculates your exact share automatically.
            </p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex justify-end font-mono"
          >
            <div className="w-full max-w-sm border border-border p-6 bg-muted/10">
              <div className="text-xs uppercase tracking-[0.1em] text-muted-foreground mb-6">Today's Meals</div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center group cursor-pointer">
                  <span className="uppercase text-sm">Breakfast</span>
                  <div className="flex gap-2">
                    <div className="h-4 w-4 bg-primary" />
                    <div className="h-4 w-4 border border-border" />
                    <div className="h-4 w-4 border border-border" />
                  </div>
                </div>
                
                <div className="flex justify-between items-center group cursor-pointer">
                  <span className="uppercase text-sm">Lunch</span>
                  <div className="flex gap-2">
                    <div className="h-4 w-4 bg-primary" />
                    <div className="h-4 w-4 bg-primary" />
                    <div className="h-4 w-4 border border-border" />
                  </div>
                </div>

                <div className="flex justify-between items-center group cursor-pointer">
                  <span className="uppercase text-sm text-muted-foreground">Dinner (Pending)</span>
                  <div className="flex gap-2 opacity-50">
                    <div className="h-4 w-4 border border-border" />
                    <div className="h-4 w-4 border border-border" />
                    <div className="h-4 w-4 border border-border" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 02 TRACK */}
      <div className="border-b border-border bg-muted/5">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-24 grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="order-2 md:order-1 font-mono"
          >
            <div className="w-full max-w-sm border border-border p-6 bg-background">
              <div className="flex justify-between items-baseline border-b border-border pb-4 mb-4">
                <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Recent Expenses</span>
                <span className="text-xl">৳7,859</span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center hover:bg-muted/30 p-2 -mx-2 transition-colors">
                  <div>
                    <div className="uppercase">Market</div>
                    <div className="text-[10px] text-muted-foreground mt-1">Paid by Rahim</div>
                  </div>
                  <span className="font-bold">৳1,250</span>
                </div>
                
                <div className="flex justify-between items-center hover:bg-muted/30 p-2 -mx-2 transition-colors">
                  <div>
                    <div className="uppercase">Utilities</div>
                    <div className="text-[10px] text-muted-foreground mt-1">Paid by Siyam</div>
                  </div>
                  <span className="font-bold">৳800</span>
                </div>
                
                <div className="flex justify-between items-center hover:bg-muted/30 p-2 -mx-2 transition-colors opacity-70">
                  <div>
                    <div className="uppercase">Internet</div>
                    <div className="text-[10px] text-muted-foreground mt-1">Paid by Karim</div>
                  </div>
                  <span>৳500</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="order-1 md:order-2 md:pl-16">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">02 — Track</div>
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">Where did the money go?</h3>
            <p className="text-lg text-muted-foreground max-w-md">
              Record actual expenses as they happen. Categorize them into Market, Utilities, Internet, and instantly see the total.
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}
