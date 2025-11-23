import React, { useState, useEffect, createContext, useContext } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/Button';

interface MobileMenuContextType {
  closeMobileMenu: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | null>(null);

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  return context;
};

interface LayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ sidebar, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <MobileMenuContext.Provider value={{ closeMobileMenu }}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          {sidebar}
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={closeMobileMenu}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {sidebar}
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
          {/* Mobile Menu Button */}
          <div className="md:hidden fixed top-4 left-4 z-30">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-card"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          {children}
        </main>
      </div>
    </MobileMenuContext.Provider>
  );
};

