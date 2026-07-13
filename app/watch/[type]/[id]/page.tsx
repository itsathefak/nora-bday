interface WatchPageProps {
  params: {
    type: string;
    id: string;
  };
}

export default function WatchPage({ params }: WatchPageProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col gap-8 px-5 py-10 md:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300 shadow-glow">
        <p className="text-lg text-white">Ready to watch:</p>
        <p className="mt-3 text-2xl font-semibold text-white">{params.id}</p>
        <p className="mt-2 text-sm text-slate-400">Category: {params.type}</p>
      </div>
    </div>
  );
}
