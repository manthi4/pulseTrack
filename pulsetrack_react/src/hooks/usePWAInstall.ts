import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setDebugInfo('App is already installed (standalone mode)');
      return;
    }

    // Check service worker registration
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          if (registrations.length > 0) {
            setDebugInfo(`Service Worker registered: ${registrations.length} active`);
          } else {
            setDebugInfo('No service worker registered');
          }
        } catch (error) {
          setDebugInfo(`SW check error: ${error}`);
        }
      }
    };

    // Check manifest
    const checkManifest = async () => {
      try {
        // Use Vite's BASE_URL to construct the correct path
        const baseUrl = import.meta.env.BASE_URL;
        const manifestPath = `${baseUrl}manifest.webmanifest`.replace(/\/\//g, '/');
        const response = await fetch(manifestPath);
        if (response.ok) {
          const manifest = await response.json();
          setDebugInfo(prev => prev + ` | Manifest OK: ${manifest.name}`);
        } else {
          setDebugInfo(prev => prev + ` | Manifest error: ${response.status}`);
        }
      } catch (error) {
        setDebugInfo(prev => prev + ` | Manifest fetch error`);
      }
    };

    checkServiceWorker();
    checkManifest();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setDebugInfo('Install prompt available');
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('App installed!');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setDebugInfo('App installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Log if event doesn't fire after a delay (for debugging)
    const timeout = setTimeout(() => {
      if (!isInstallable && !isInstalled) {
        console.log('PWA Install Debug:', {
          hasServiceWorker: 'serviceWorker' in navigator,
          isStandalone: window.matchMedia('(display-mode: standalone)').matches,
          userAgent: navigator.userAgent,
        });
        setDebugInfo(prev => prev + ' | Waiting for install prompt...');
      }
    }, 2000);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  };

  const tryManualInstall = async () => {
    // Try to use the deferred prompt if available
    if (deferredPrompt) {
      return await promptInstall();
    }
    
    // Fallback: Check if we can determine installability
    // In Chrome, we can check the manifest and service worker
    try {
      // Use Vite's BASE_URL to construct the correct path
      const baseUrl = import.meta.env.BASE_URL;
      const manifestPath = `${baseUrl}manifest.webmanifest`.replace(/\/\//g, '/');
      const manifestResponse = await fetch(manifestPath);
      const hasSW = 'serviceWorker' in navigator && (await navigator.serviceWorker.getRegistrations()).length > 0;
      
      if (manifestResponse.ok && hasSW) {
        // Try to trigger install via browser UI hint
        // Note: This won't work programmatically, but we can show instructions
        console.log('PWA is installable. Try using Chrome\'s install button in the address bar.');
        alert('PWA appears installable. Look for the install icon (⊕) in Chrome\'s address bar, or try refreshing the page.');
        return false;
      }
    } catch (error) {
      console.error('Error checking installability:', error);
    }
    
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    tryManualInstall,
    debugInfo,
  };
}

