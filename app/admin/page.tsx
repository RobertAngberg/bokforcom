"use client";

import MainLayout from "../_components/MainLayout";

export default function Page() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl text-center text-white mb-6">Adminpanel</h1>
        <div className="mb-4 text-center">
          <a
            href="/sie"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            📊 SIE Export/Import
          </a>
        </div>
      </div>
    </MainLayout>
  );
}
