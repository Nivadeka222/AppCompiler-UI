import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-72 bg-white border-r border-[#e5e7eb] flex flex-col">

      <div className="p-6 border-b border-[#e5e7eb]">

        <Link href="/" className="block">
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-[#2563eb] flex items-center justify-center text-white font-bold">
              A
            </div>

            <div>
              <div className="font-bold text-[#111827]">
                App Compiler
              </div>

              <div className="text-xs text-gray-500">
                AI Application Builder
              </div>
            </div>

          </div>
        </Link>

      </div>

      <div className="p-5">

        <div className="text-xs uppercase tracking-wider text-gray-400 mb-3">
          Workspace
        </div>

        <nav className="space-y-2">

          <button className="w-full text-left px-4 py-3 rounded-xl bg-[#2563eb] text-white font-medium">
            Overview
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-[#f4f8fc]">
            Database
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-[#f4f8fc]">
            API
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-[#f4f8fc]">
            UI Schema
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-[#f4f8fc]">
            Auth
          </button>

        </nav>

      </div>

      <div className="mt-auto p-5">

        <div className="rounded-2xl bg-[#f4f8fc] border border-[#dbe4ee] p-4">

          <div className="font-semibold text-[#111827]">
            Application Ready
          </div>

          <div className="text-sm text-gray-500 mt-1">
            Architecture generated successfully.
          </div>

        </div>

      </div>

    </aside>
  );
}