import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        <Sidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
