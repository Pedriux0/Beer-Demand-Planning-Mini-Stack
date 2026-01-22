
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { dataSourceGroups, dataSourceNotes } from '../data/dataSources';

interface MetricData {
    channel: string;
    sku: string;
    mape_ml: number;
    mape_baseline: number;
    best_model: string;
}

interface DqReport {
    status: string;
    timestamp: string;
    runtime_seconds: number;
    steps?: string[];
}

interface Summary {
    avgMape?: string;
}

interface ProductRow {
    sku: string;
    product_name: string;
    category: string;
    pack_size: string;
    active_flag: string;
}

const Overview = () => {
    const [metrics, setMetrics] = useState<MetricData[] | null>(null);
    const [dqReport, setDqReport] = useState<DqReport | null>(null);
    const [summary, setSummary] = useState<Summary>({});
    const [products, setProducts] = useState<ProductRow[]>([]);

    useEffect(() => {
        // Load Forecast Metrics
        Papa.parse<MetricData>('/data/forecast_metrics.csv', {
            download: true,
            header: true,
            complete: (results) => {
                const rows = results.data.filter(row => row && row.channel && row.sku);
                setMetrics(rows);
                // Calculate aggregations
                if (rows.length > 0) {
                    const avgMape = rows.reduce((acc: number, curr: MetricData) => acc + (Number(curr.mape_ml) || 0), 0) / rows.length;
                    setSummary(prev => ({ ...prev, avgMape: (avgMape * 100).toFixed(1) }));
                }
            }
        });

        // Load Pipeline Report
        fetch('/data/pipeline_report.json')
            .then(res => res.json())
            .then(data => setDqReport(data))
            .catch(err => console.error("Failed to load pipeline report", err));

        // Load Product Catalog
        Papa.parse<ProductRow>('/data/dim_product.csv', {
            download: true,
            header: true,
            complete: (results) => {
                const rows = results.data.filter(row => row && row.sku);
                setProducts(rows);
            }
        });

    }, []);

    const totalProducts = products.length;
    const totalBeers = products.filter(product => product.category === 'Beer').length;
    const activeBeers = products.filter(product => product.category === 'Beer' && product.active_flag === '1').length;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">System Overview</h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Model Performance</h3>
                    <p className="text-3xl font-bold text-blue-600">{summary.avgMape || '-'}%</p>
                    <span className="text-xs text-gray-400">Avg MAPE (ML)</span>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Pipeline Status</h3>
                    <div className="flex items-center gap-2 mt-2">
                        {dqReport?.status === 'success' ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                        <span className="font-bold capitalize">{dqReport?.status || 'Unknown'}</span>
                    </div>
                    <span className="text-xs text-gray-400">Last run: {dqReport?.timestamp ? new Date(dqReport.timestamp).toLocaleString() : '-'}</span>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Pipeline Runtime</h3>
                    <p className="text-3xl font-bold text-gray-700">{dqReport?.runtime_seconds ? Math.round(dqReport.runtime_seconds) : '-'}s</p>
                    <span className="text-xs text-gray-400">Total execution time</span>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Beer Catalog</h3>
                    <p className="text-3xl font-bold text-blue-600">{totalBeers || '-'}</p>
                    <span className="text-xs text-gray-400">Active: {activeBeers || 0} / Total products: {totalProducts || 0}</span>
                </div>
            </div>

            {/* Model Details List */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4">Forecast Model Performance by SKU</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="p-3">Channel</th>
                                <th className="p-3">SKU</th>
                                <th className="p-3">Best Model</th>
                                <th className="p-3">MAPE (ML)</th>
                                <th className="p-3">MAPE (Baseline)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics && metrics.slice(0, 10).map((row: any, i: number) => (
                                <tr key={i} className="border-t">
                                    <td className="p-3">{row.channel}</td>
                                    <td className="p-3">{row.sku}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${row.best_model === 'ML' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {row.best_model}
                                        </span>
                                    </td>
                                    <td className="p-3">{(parseFloat(row.mape_ml) * 100).toFixed(1)}%</td>
                                    <td className="p-3">{(parseFloat(row.mape_baseline) * 100).toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Data Sources */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Data Sources</h3>
                    <span className="text-xs text-gray-400">From DATA_SOURCES.md</span>
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

export default Overview;
