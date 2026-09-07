import { useState, useRef } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

export function AntigravityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, session } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const widgetUrl = import.meta.env.VITE_AI_WIDGET_URL;
  const widgetOrigin = widgetUrl ? new URL(widgetUrl).origin : '';

  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow && widgetOrigin) {
      if (session?.access_token) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'AI_WIDGET_AUTH', token: session.access_token },
          widgetOrigin
        );
      }
      // Attempt to tell the embedded widget to open its chat interface automatically
      iframeRef.current.contentWindow.postMessage({ type: 'TOGGLE_WIDGET', isOpen: true }, widgetOrigin);
      iframeRef.current.contentWindow.postMessage({ type: 'OPEN_WIDGET' }, widgetOrigin);
      iframeRef.current.contentWindow.postMessage({ type: 'SET_THEME', theme: 'transparent' }, widgetOrigin);
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
          <div className="flex-1 bg-background flex flex-col items-center justify-center relative">
            {widgetUrl ? (
              <iframe 
                ref={iframeRef}
                onLoad={handleIframeLoad}
                src={`${widgetUrl}/embed/widget?businessId=default&userId=${user?.id || ''}&userEmail=${user?.email || ''}&autoOpen=true&open=true&theme=transparent&mode=chat`}
                className="w-full h-full border-none absolute inset-0"
                style={{ colorScheme: 'normal' }}
                allowTransparency={true}
                title="Antigravity AI Widget"
              />
            ) : (
              <div className="p-6 text-center text-muted-foreground flex flex-col items-center gap-4">
                <MessageSquare className="h-12 w-12 opacity-20" />
                <p className="font-medium">AI Assistant is taking a break.</p>
                <p className="text-sm">Widget URL is not configured. Add VITE_AI_WIDGET_URL to your environment variables.</p>
              </div>
            )}
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
