export default function SuperAdminFooter() {
  return (
    <footer className="h-8 bg-inverse-surface dark:bg-gray-950 border-t border-white/5 dark:border-gray-800 flex shrink-0 items-center justify-between px-6 text-[9px] font-mono text-outline-variant dark:text-gray-400 font-medium">
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed dark:bg-blue-500 animate-pulse"></span>
          DB SYNC: IDLE
        </span>
        <span>CLI CONNECTED: 127.0.0.1</span>
        <span>MEM: 2.1GB / 8GB</span>
      </div>
      <div>
        MS OTO SERVİS DASHBOARD © {new Date().getFullYear()}
      </div>
    </footer>
  );
}
