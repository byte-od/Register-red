import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Device checks
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const mobile = /android|iphone|ipad|ipod|mobile/.test(ua) || window.innerWidth < 768;
    setIsIOS(ios);
    setIsMobile(mobile);

    // Capture beforeinstallprompt event (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // App installed event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsStandalone(true);
          setDeferredPrompt(null);
          setIsInstallable(false);
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('Erro ao disparar prompt de instalação:', err);
      }
    }
    return 'manual';
  };

  return {
    deferredPrompt,
    isInstallable,
    isStandalone,
    isIOS,
    isMobile,
    triggerInstall,
  };
}
