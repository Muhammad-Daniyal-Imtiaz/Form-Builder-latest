import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
            Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">My App</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
            The ultimate platform for managing your projects and users with ease.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-indigo-50 hover:border-indigo-100 text-indigo-600 font-bold rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            Create Account
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto px-8 py-4 bg-transparent text-gray-500 hover:text-indigo-600 font-bold rounded-2xl transition-all"
          >
            View Pricing
          </Link>
        </div>

        <div className="pt-12 grid grid-cols-2 md:grid-cols-3 gap-6 text-sm text-gray-500 font-medium">
          <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
            Secure Auth
          </div>
          <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
            User Profiles
          </div>
          <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 md:col-span-1 col-span-2">
            Dynamic Dashboards
          </div>
        </div>
      </div>
    </div>
  );
}
