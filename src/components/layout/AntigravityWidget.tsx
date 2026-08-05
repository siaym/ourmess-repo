import { useState, useRef } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

export function AntigravityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, session } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = () => {
    if (session?.access_token && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'AI_WIDGET_AUTH', token: session.access_token },
        'http://localhost:3000'
      );
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden w-[350px] h-[500px] flex flex-col transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
            <h3 className="font-semibold">OurMess AI Assistant</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20 rounded-full w-6 h-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 bg-background">
            {/* The actual Antigravity AI platform iframe */}
            <iframe 
              ref={iframeRef}
              onLoad={handleIframeLoad}
              src={`http://localhost:3000/embed/widget?businessId=default&userId=${user?.id || ''}&userEmail=${user?.email || ''}`}
              className="w-full h-full border-none"
              title="Antigravity AI Widget"
            />
          </div>
        </div>
      )}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
      >
        <MessageSquare className="h-6 w-6 text-primary-foreground" />
      </Button>
    </div>
  );
}
