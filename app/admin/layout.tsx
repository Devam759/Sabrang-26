import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminTopBar from "@/components/layout/AdminTopBar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-ink min-h-screen">
      <AdminSidebar />
      <div className="flex-grow ml-64 flex flex-col">
        <AdminTopBar />
        <main className="p-10">{children}</main>
      </div>
    </div>
  );
}
