import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="font-black text-xl uppercase tracking-tighter">
          OurMess
        </Link>
        
        <nav className="hidden md:flex items-center gap-12 font-mono text-xs uppercase tracking-widest font-bold text-muted-foreground">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#calculation" className="hover:text-foreground transition-colors">Calculation</a>
        </nav>

        <div className="flex items-center gap-6">
          <Link to="/login" className="hidden sm:block font-mono text-xs uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors">
            Log in
          </Link>
          <Link 
            to="/register"
            className="h-10 px-6 flex items-center justify-center bg-foreground text-background font-bold uppercase tracking-widest text-xs hover:bg-foreground/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
