import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ExternalLink } from 'lucide-react';
import { dataSourceGroups, dataSourceNotes } from '../data/dataSources';

type Summary = {
  updated_at?: string;
  total_products?: number;
  beer_like_total?: number;
  beer_like_available?: number;
  beer_like_sold_out?: number;
  collection_counts?: Record<string, number>;
  collection_available_counts?: Record<string, number>;
};

type CatalogItem = {
  id: string;
  title: string;
  handle: string;
  product_type?: string;
  available?: boolean;
  price_from?: number;
  collections?: string[];
  url?: string;
  tags?: string[];
};

const formatCollectionLabel = (handle: string) =>
  handle
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const isBeerLike = (item: CatalogItem) => {
  const productType = (item.product_type || '').toLowerCase();
  const tags = (item.tags || []).join(' ').toLowerCase();
  return (
    productType.includes('beer') ||
    productType.includes('cider') ||
    tags.includes('beer') ||
    tags.includes('cider')
  );
};

const CollectiveArts = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    fetch('/data/collective_arts_summary.json')
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error('Failed to load summary', err));

    fetch('/data/collective_arts_catalog.json')
      .then(res => res.json())
      .then(data => setCatalog(data))
      .catch(err => console.error('Failed to load catalog', err));
  }, []);

  const collectionData = useMemo(() => {
    if (!summary?.collection_counts) return [];
    const keys = Object.keys(summary.collection_counts);
    return keys
      .map(key => ({
        collection: formatCollectionLabel(key),
        total: summary.collection_counts?.[key] || 0,
        available: summary.collection_available_counts?.[key] || 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [summary]);

  const topCatalogItems = useMemo(() => {
    const beerItems = catalog.filter(isBeerLike);
    return (beerItems.length > 0 ? beerItems : catalog).slice(0, 10);
  }, [catalog]);

  const sourceCoverage = useMemo(
    () =>
      dataSourceGroups.map(group => ({
        category: group.title,
        count: group.items.length
      })),
    []
  );

  const availabilityRate = useMemo(() => {
    if (summary?.beer_like_total == null || summary?.beer_like_available == null) return null;
    if (summary.beer_like_total === 0) return null;
    return (summary.beer_like_available / summary.beer_like_total) * 100;
  }, [summary]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Collective Arts Catalog</h2>
          <p className="text-sm text-gray-500">
            Counts based on public catalog sources and availability signals.
          </p>
        </div>
        <span className="text-xs text-gray-400">
          Updated: {summary?.updated_at ? new Date(summary.updated_at).toLocaleString() : 'Pending refresh'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Catalog Items</h3>
          <p className="text-3xl font-bold text-gray-800">{summary?.total_products ?? '-'}</p>
          <span className="text-xs text-gray-400">All collection entries</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Beer and Cider Items</h3>
          <p className="text-3xl font-bold text-blue-600">{summary?.beer_like_total ?? '-'}</p>
          <span className="text-xs text-gray-400">Tagged as beer or cider</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Available for Sale (Proxy)</h3>
          <p className="text-3xl font-bold text-green-600">{summary?.beer_like_available ?? '-'}</p>
          <span className="text-xs text-gray-400">
            Availability rate: {availabilityRate ? `${availabilityRate.toFixed(1)}%` : '-'}
          </span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Sold Out Items</h3>
          <p className="text-3xl font-bold text-amber-600">{summary?.beer_like_sold_out ?? '-'}</p>
          <span className="text-xs text-gray-400">Availability-based proxy</span>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Sales volume is not publicly available; availability counts are used as a sales proxy.
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-4">Catalog Coverage by Collection</h3>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={collectionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="collection" tick={{ fontSize: 12 }} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#2563EB" name="Total Items" radius={[6, 6, 0, 0]} />
              <Bar dataKey="available" fill="#16A34A" name="Available for Sale" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-4">Sample Catalog Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3">Product</th>
                <th className="p-3">Collection</th>
                <th className="p-3">Available</th>
                <th className="p-3">Price From</th>
                <th className="p-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {topCatalogItems.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.title}</td>
                  <td className="p-3 text-xs text-gray-600">
                    {item.collections?.map(formatCollectionLabel).join(', ') || '-'}
                  </td>
                  <td className="p-3">
                    {item.available ? (
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Available</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">Sold out</span>
                    )}
                  </td>
                  <td className="p-3">{item.price_from ? `$${item.price_from.toFixed(2)}` : '-'}</td>
                  <td className="p-3">
                    {item.url ? (
                      <a
                        className="text-blue-700 hover:underline inline-flex items-center gap-1"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View <ExternalLink size={12} />
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
              {topCatalogItems.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-400" colSpan={5}>
                    No catalog data yet. Run the data collection script.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Data Sources</h3>
          <span className="text-xs text-gray-400">From DATA_SOURCES.md</span>
        </div>
        <div className="h-[260px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceCoverage}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0EA5E9" name="Source Count" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dataSourceGroups.map(group => (
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

export default CollectiveArts;
