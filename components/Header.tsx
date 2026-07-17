import Link from "next/link";

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-[1550px] mx-auto px-4 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img src="/images/logo.png" alt="Megabyte Circuit Logo" className="h-18 w-auto object-contain" />
                    </Link>
                </div>
            </div>
        </header>
    );
}
