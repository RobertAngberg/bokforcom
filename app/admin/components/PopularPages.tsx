interface PopularPagesProps {
  pages: Array<{
    page_url: string;
    view_count: number;
    unique_users: number;
  }>;
}

export default function PopularPages({ pages }: PopularPagesProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Popular Pages</h3>
      <div className="space-y-3">
        {pages.length === 0 ? (
          <div className="text-sm text-slate-400">Ingen data tillgänglig ännu...</div>
        ) : (
          pages.map((page, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-sm">#{index + 1}</span>
                <div>
                  <p className="text-white font-medium">{page.page_url}</p>
                  <p className="text-xs text-slate-400">{page.unique_users} unique users</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{page.view_count}</p>
                <p className="text-xs text-slate-400">views</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
