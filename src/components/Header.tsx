import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
        <Link href="/" className="text-xl font-bold text-gray-900">
          <span className="text-amber-500">Rate</span> Your 회식
        </Link>
      </div>
    </header>
  );
}
