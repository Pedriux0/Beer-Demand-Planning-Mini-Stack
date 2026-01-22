
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Download, AlertTriangle, ExternalLink } from 'lucide-react';
import { dataSourceGroups, dataSourceNotes } from '../data/dataSources';

interface PlanRow {
    week_start: string;
    sku: string;
    product_name: string;
    forecast_units: number;
    safety_stock: number;
    on_hand: number;
    suggested_production: number;
    notes?: string;
}

const Planning = () => {
    const [plan, setPlan] = useState<PlanRow[]>([]);

    useEffect(() => {
        Papa.parse<PlanRow>('/data/production_plan_weekly.csv', {
            download: true,
            header: true,
            complete: (results) => {
                setPlan(results.data);
            }
        });
    }, []);

    const downloadCsv = () => {
        // Simple client-side download trigger since file is already static
        const link = document.createElement('a');
        link.href = '/data/production_plan_weekly.csv';
        link.download = 'production_plan_weekly.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Production Plan (Weekly)</h2>
                <button
                    onClick={downloadCsv}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                    <Download size={18} /> Download CSV
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="p-4 text-left">SKU</th>
                                <th className="p-4 text-left">Product</th>
                                <th className="p-4 text-right">Forecast (Units)</th>
                                <th className="p-4 text-right">Safety Stock</th>
                                <th className="p-4 text-right">Current Stock</th>
                                <th className="p-4 text-right bg-blue-50 text-blue-800">Suggested Production</th>
                                <th className="p-4 text-left">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {plan.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono text-xs text-gray-500">{row.sku}</td>
                                    <td className="p-4 font-medium">{row.product_name}</td>
                                    <td className="p-4 text-right">{row.forecast_units}</td>
                                    <td className="p-4 text-right text-gray-500">{Math.round(row.safety_stock)}</td>
                                    <td className="p-4 text-right">{row.on_hand}</td>
                                    <td className="p-4 text-right font-bold text-blue-700 bg-blue-50/30">
                                        {row.suggested_production}
                                    </td>
                                    <td className="p-4 text-xs text-amber-600 flex items-center gap-1">
                                        {row.notes && <AlertTriangle size={12} />}
                                        {row.notes}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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

export default Planning;
