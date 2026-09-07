import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { Problem } from '../components/landing/Problem';
import { Features } from '../components/landing/Features';
import { DashboardShowcase } from '../components/landing/DashboardShowcase';
import { SystemDiagram } from '../components/landing/SystemDiagram';
import { Footer } from '../components/landing/Footer';

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <SystemDiagram />
        <Features />
        <DashboardShowcase />
      </main>
      <Footer />
    </div>
  );
}
