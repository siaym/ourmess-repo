import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* Massive Typography CTA */}
        <div className="py-32 md:py-48 flex flex-col items-start border-b border-border">
          <h2 className="text-5xl md:text-8xl lg:text-[7rem] font-black tracking-tighter uppercase leading-[0.9] mb-12">
            Stop doing<br />
            <span className="text-muted-foreground">the math.</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Link 
              to="/register"
              className="h-16 px-12 flex items-center justify-center bg-foreground text-background font-bold uppercase tracking-widest text-sm hover:bg-foreground/90 transition-colors w-full sm:w-auto"
            >
              Create your mess
            </Link>
            <Link 
              to="/login"
              className="h-16 px-12 flex items-center justify-center border border-border text-foreground font-bold uppercase tracking-widest text-sm hover:bg-muted transition-colors w-full sm:w-auto"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="py-12 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-sm uppercase tracking-widest text-muted-foreground">
          <div>OURMESS © {new Date().getFullYear()}</div>
          <div className="flex gap-8">
            <Link to="/login" className="hover:text-foreground transition-colors">Log in</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
