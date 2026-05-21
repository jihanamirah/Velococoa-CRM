"use client";

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Determine initial theme
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setTheme('dark');
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="text-muted-foreground hover:bg-muted/10 rounded-full w-9 h-9 flex items-center justify-center transition-colors"
      title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-500 animate-in spin-in-45 duration-300" />
      ) : (
        <Moon className="h-5 w-5 text-[#4C382D] animate-in spin-in-45 duration-300" />
      )}
    </Button>
  );
}
