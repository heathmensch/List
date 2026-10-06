import { Sidebar } from "@/components/Sidebar";

/**
 * Authenticated app chrome. Middleware already requires a session for these
 * routes, so visitors never see this layout until they sign in.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex min-h-dvh min-w-0 flex-1 flex-col bg-[var(--background)] px-10 py-8">
        {children}
      </main>
    </div>
  );
}
