import AppHeader from "@/components/layout/AppHeader";

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-6">
        {children}
      </main>
    </div>
  );
}
