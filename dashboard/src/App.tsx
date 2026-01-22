
import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import CollectiveArts from './pages/CollectiveArts';

function App() {
  const [page, setPage] = useState('collective-arts');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-4">
        <h1 className="text-xl font-bold mb-8 flex items-center gap-2">
          🍺 BeerPlan
        </h1>
        <nav className="space-y-2">
          <button
            onClick={() => setPage('collective-arts')}
            className={`flex items-center gap-3 w-full p-3 rounded ${page === 'collective-arts' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
          >
            <BarChart3 size={20} /> Catalog & Sales
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {page === 'collective-arts' && <CollectiveArts />}
      </main>
    </div>
  );
}

export default App;
