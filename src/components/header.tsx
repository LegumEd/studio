
"use client";

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function Header() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };

    updateDateTime();
    const timerId = setInterval(updateDateTime, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-2">
        {/* The title is now in the sidebar for desktop, but we can have a breadcrumb or page title here */}
      </div>
      <div className="ml-auto flex flex-col items-end">
        <p className="text-sm font-medium text-foreground">{date}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </header>
  );
}

    