'use client'

import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Success!</h2>
        <p className="text-gray-500 mb-8 text-lg">Your response has been recorded securely.</p>

        <div className="space-y-4">
          <button
            onClick={() => window.location.href = window.location.href.replace('/success', '')}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Submit another response
          </button>

          <div className="pt-4 border-t border-gray-100">
            <Link
              href="/"
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Powered by Form Sync
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}