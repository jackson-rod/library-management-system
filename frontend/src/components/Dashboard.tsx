import NavigationBar from './NavigationBar';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900">
      <NavigationBar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-gray-800 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to Dashboard</h2>
          <p className="text-gray-300">
            This is a protected route. Only authenticated users can see this page.
          </p>
        </div>
      </main>
    </div>
  );
}
