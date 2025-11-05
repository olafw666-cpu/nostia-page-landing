export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <header className="w-full py-6 px-8 flex justify-between items-center bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Nostia</h1>
        <button className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition">
          Join Waitlist
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-6">
        <h2 className="text-5xl font-bold text-gray-900 max-w-3xl leading-tight">
          Your Personal AI Memory & Life Companion
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mt-4">
          Nostia helps you remember every important detail — conversations, plans, decisions, goals — 
          and brings them back when you need them most.
        </p>

        <div className="mt-8 flex gap-4">
          <button className="px-6 py-3 text-lg rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition">
            Get Early Access
          </button>
          <button className="px-6 py-3 text-lg rounded-xl border border-gray-400 hover:bg-gray-100 transition">
            Learn More
          </button>
        </div>

        <div className="mt-16 w-full max-w-4xl bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <p className="text-gray-700 text-lg">
            “Nostia remembered the exact thing I needed before I even thought to ask.”
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Nostia — All Rights Reserved.
      </footer>
    </div>
  );
}
