// app/(auth)/layout.tsx
import AuthRedirect from "@/components/shared/AuthRedirect";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthRedirect />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
        {children}
      </div>
    </>
  );
}
