import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { ExternalLink } from 'lucide-react';
import { dataSourceGroups, dataSourceNotes } from '../data/dataSources';

type PlanRow = {
  week_start: string;
  sku: string;
  product_name: string;
  forecast_units: string;
  safety_stock: string;
  on_hand: string;
  suggested_production: string;
  notes?: string;
};

type ForecastRow = {
  date: string;
  channel: string;
  sku: string;
  yhat: number;
};

type JoinedRow = {
  sku: string;
  product_name: string;
  forecasted_sales: number;
  planned_sales: number;
  suggested_production: number;
  variance: number;
};

const SalesPlan = () => {
  const [planRows, setPlanRows] = useState<PlanRow[]>([]);
  const [forecastRows, setForecastRows] = useState<ForecastRow[]>([]);

  useEffect(() => {
    Papa.parse<PlanRow>('/data/production_plan_weekly.csv', {
      download: true,
      header: true,
      complete: results => {
        const rows = results.data.filter(row => row && row.sku);
        setPlanRows(rows);
      }
    });

    Papa.parse<ForecastRow>('/data/forecast_daily.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: results => {
        const rows = results.data.filter(row => row && row.sku);
        setForecastRows(rows);
      }
    });
  }, []);

  const joinedRows = useMemo<JoinedRow[]>(() => {
    const forecastBySku = forecastRows.reduce<Record<string, number>>((acc, row) => {
      const key = row.sku || 'Unknown';
      const value = Number(row.yhat) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {});

    return planRows.map(row => {
      const plannedSales = Number(row.forecast_units) || 0;
      const suggestedProduction = Number(row.suggested_production) || 0;
      const forecastedSales = forecastBySku[row.sku] || 0;
      const variance = plannedSales - forecastedSales;
      return {
        sku: row.sku,
        product_name: row.product_name,
        forecasted_sales: forecastedSales,
        planned_sales: plannedSales,
        suggested_production: suggestedProduction,
        variance
      };
    });
  }, [forecastRows, planRows]);

  const totals = useMemo(() => {
    return joinedRows.reduce(
      (acc, row) => {
        acc.forecasted_sales += row.forecasted_sales;
        acc.planned_sales += row.planned_sales;
        acc.suggested_production += row.suggested_production;
        acc.variance += row.variance;
        return acc;
      },
      {
        forecasted_sales: 0,
        planned_sales: 0,
        suggested_production: 0,
        variance: 0
      }
    );
  }, [joinedRows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Sales vs Plan</h2>
        <span className="text-xs text-gray-400">Forecasted sales vs planned sales</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Forecasted Sales</h3>
          <p className="text-3xl font-bold text-blue-600">{Math.round(totals.forecasted_sales)}</p>
          <span className="text-xs text-gray-400">Sum of forecast_daily.csv (yhat)</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Planned Sales</h3>
          <p className="text-3xl font-bold text-gray-800">{Math.round(totals.planned_sales)}</p>
          <span className="text-xs text-gray-400">production_plan_weekly.csv forecast_units</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Suggested Production</h3>
          <p className="text-3xl font-bold text-green-600">{Math.round(totals.suggested_production)}</p>
          <span className="text-xs text-gray-400">Planned output</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Plan Variance</h3>
          <p className={`text-3xl font-bold ${totals.variance >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {Math.round(totals.variance)}
          </p>
          <span className="text-xs text-gray-400">Planned minus forecasted</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-4">SKU Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3">SKU</th>
                <th className="p-3">Product</th>
                <th className="p-3 text-right">Forecasted Sales</th>
                <th className="p-3 text-right">Planned Sales</th>
                <th className="p-3 text-right">Suggested Production</th>
                <th className="p-3 text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {joinedRows.map(row => (
                <tr key={row.sku} className="border-t">
                  <td className="p-3 font-mono text-xs text-gray-500">{row.sku}</td>
                  <td className="p-3">{row.product_name}</td>
                  <td className="p-3 text-right">{Math.round(row.forecasted_sales)}</td>
                  <td className="p-3 text-right">{Math.round(row.planned_sales)}</td>
                  <td className="p-3 text-right">{Math.round(row.suggested_production)}</td>
                  <td className="p-3 text-right">
                    <span className={row.variance >= 0 ? 'text-amber-600' : 'text-red-600'}>
                      {Math.round(row.variance)}
                    </span>
                  </td>
                </tr>
              ))}
              {joinedRows.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-400" colSpan={6}>
                    No data available yet.
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

export default SalesPlan;
