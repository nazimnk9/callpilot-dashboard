'use client';

import { Plus, ArrowUp } from 'lucide-react';

export function HomeContent() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Chat prompts
        </h1>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 sm:py-24 space-y-8">
          {/* Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
          </div>

          {/* Text */}
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center">
            Create a chat prompt
          </h2>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-900 transition whitespace-nowrap">
              <Plus size={18} />
              <span>Create</span>
            </button>
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Generate..."
                className="w-full px-4 py-3 border border-gray-300 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                <ArrowUp size={18} />
              </button>
            </div>
          </div>

          {/* Suggestion Tags */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full hover:bg-gray-300 transition">
              Trip planner
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full hover:bg-gray-300 transition">
              Image generator
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full hover:bg-gray-300 transition">
              Code debugger
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full hover:bg-gray-300 transition">
              Research assistant
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full hover:bg-gray-300 transition">
              Decision helper
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
