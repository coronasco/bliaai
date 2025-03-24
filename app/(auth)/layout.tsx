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
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 text-white">
        {children}
      </div>
    </>
  );
}
