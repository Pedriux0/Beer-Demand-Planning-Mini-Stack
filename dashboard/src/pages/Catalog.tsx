import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { ExternalLink } from 'lucide-react';
import { dataSourceGroups, dataSourceNotes } from '../data/dataSources';

type ProductRow = {
  sku: string;
  product_name: string;
  category: string;
  pack_size: string;
  active_flag: string;
};

type CountEntry = {
  label: string;
  count: number;
};

const toCountEntries = (counts: Record<string, number>): CountEntry[] =>
  Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

const Catalog = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    Papa.parse<ProductRow>('/data/dim_product.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const rows = results.data.filter(row => row && row.sku);
        setProducts(rows);
      }
    });
  }, []);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const beerProducts = products.filter(product => product.category === 'Beer');
    const activeBeers = beerProducts.filter(product => product.active_flag === '1');
    const inactiveBeers = beerProducts.filter(product => product.active_flag !== '1');

    const categoryCounts = products.reduce<Record<string, number>>((acc, row) => {
      const key = row.category || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const packCounts = beerProducts.reduce<Record<string, number>>((acc, row) => {
      const key = row.pack_size || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      totalProducts,
      totalBeers: beerProducts.length,
      activeBeers: activeBeers.length,
      inactiveBeers: inactiveBeers.length,
      categoryCounts: toCountEntries(categoryCounts),
      packCounts: toCountEntries(packCounts),
      beerProducts
    };
  }, [products]);

  const catalogSources = dataSourceGroups.filter(group =>
    group.title.includes('Collective Arts')
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Beer Catalog Analysis</h2>
        <span className="text-xs text-gray-400">Source: dim_product.csv</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Beer SKUs</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalBeers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Active Beers</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeBeers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Inactive Beers</h3>
          <p className="text-3xl font-bold text-amber-600">{stats.inactiveBeers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4">Category Mix</h3>
          <ul className="space-y-2 text-sm">
            {stats.categoryCounts.map(entry => (
              <li key={entry.label} className="flex items-center justify-between">
                <span className="text-gray-700">{entry.label}</span>
                <span className="font-semibold text-gray-900">{entry.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4">Beer Pack Sizes</h3>
          <ul className="space-y-2 text-sm">
            {stats.packCounts.map(entry => (
              <li key={entry.label} className="flex items-center justify-between">
                <span className="text-gray-700">{entry.label}</span>
                <span className="font-semibold text-gray-900">{entry.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-4">Beer SKU List</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3">SKU</th>
                <th className="p-3">Product</th>
                <th className="p-3">Pack Size</th>
                <th className="p-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {stats.beerProducts.map(product => (
                <tr key={product.sku} className="border-t">
                  <td className="p-3 font-mono text-xs text-gray-500">{product.sku}</td>
                  <td className="p-3">{product.product_name}</td>
                  <td className="p-3">{product.pack_size}</td>
                  <td className="p-3">
                    {product.active_flag === '1' ? (
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Catalog Sources</h3>
          <span className="text-xs text-gray-400">From DATA_SOURCES.md</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {catalogSources.map(group => (
            <div key={group.title} className="rounded-lg border border-gray-100 p-4 bg-gray-50/40">
              <h4 className="font-semibold text-gray-800">{group.title}</h4>
              {group.description && (
                <p className="text-xs text-gray-500 mt-1">{group.description}</p>
              )}
              <ul className="mt-3 space-y-2 text-sm">
                {group.items.map(item => (
                  <li key={item.url} className="flex items-start gap-2">
                    <ExternalLink size={14} className="mt-0.5 text-blue-600" />
                    <div>
                      <a
                        className="text-blue-700 hover:underline"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.label}
                      </a>
                      {item.note && (
                        <span className="block text-xs text-gray-500">{item.note}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          {dataSourceNotes.map(note => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Catalog;
