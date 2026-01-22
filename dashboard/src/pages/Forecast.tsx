
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { ExternalLink } from 'lucide-react';
import { dataSourceGroups, dataSourceNotes } from '../data/dataSources';

interface ForecastData {
    date: string;
    channel: string;
    sku: string;
    yhat: number;
    yhat_lower: number;
    yhat_upper: number;
    model_version: string;
}

const Forecast = () => {
    const [data, setData] = useState<ForecastData[]>([]);
    const [filteredData, setFilteredData] = useState<ForecastData[]>([]);
    const [skus, setSkus] = useState<string[]>([]);
    const [selectedSku, setSelectedSku] = useState<string>('');

    useEffect(() => {
        Papa.parse<ForecastData>('/data/forecast_daily.csv', {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                const raw = results.data;
                setData(raw);
                const uniqueSkus = Array.from(new Set(raw.map((r: ForecastData) => r.sku))).sort() as string[];
                setSkus(uniqueSkus);
                if (uniqueSkus.length > 0) setSelectedSku(uniqueSkus[0]);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedSku) {
            setFilteredData(data.filter((r: any) => r.sku === selectedSku));
        }
    }, [selectedSku, data]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Demand Forecast</h2>
                <select
                    className="p-2 border rounded shadow-sm bg-white"
                    value={selectedSku}
                    onChange={(e) => setSelectedSku(e.target.value)}
                >
                    {skus.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            fontSize={12}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="yhat_upper" fill="#E0F2FE" stroke="none" fillOpacity={0.5} name="Confidence Upper" />

                        <Line type="monotone" dataKey="yhat" stroke="#2563EB" strokeWidth={3} dot={false} name="Forecast" />
                        <Line type="monotone" dataKey="yhat_lower" stroke="#93C5FD" strokeDasharray="3 3" dot={false} name="Confidence Lower" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Forecast Data Sources</h3>
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

export default Forecast;
