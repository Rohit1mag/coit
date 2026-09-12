import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link href="/" aria-label="SubCertify home">
            <Logo />
          </Link>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">{children}</div>
    </div>
  );
}
