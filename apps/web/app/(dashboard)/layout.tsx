import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { SessionProvider } from "next-auth/react";
import { DASHBOARD_LAYOUT } from "@/lib/dashboard-ui-standards";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background flex">
        {/* Fixed Sidebar — şablondaki aside, fixed left-0, w-64 */}
        <DashboardSidebar />
        
        {/* Main Content Area — şablondaki <main class="ml-64 min-h-screen"> */}
        <main className={`${DASHBOARD_LAYOUT.mainOffset} min-h-screen flex-1 flex flex-col`}>
          <DashboardHeader />
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
