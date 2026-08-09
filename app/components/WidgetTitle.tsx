import Link from 'next/link';

export default function WidgetTitle({ title, href }: { title: string, href?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800 pb-2 mb-4">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 border-l-4 border-amber-500 pl-3">
        {title}
      </h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-amber-600 dark:text-amber-500 hover:underline">
          Lihat Semua
        </Link>
      )}
    </div>
  );
}
