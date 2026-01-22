
import fs from 'fs';
import path from 'path';
import { addDays, subDays, startOfWeek, format } from 'date-fns';

const RAW_DIR = path.join(__dirname, '..', 'data', 'raw');
if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

// Config
const DAYS_HISTORY = 365;
const START_DATE = subDays(new Date(), DAYS_HISTORY);
const STORES = ['S001', 'S002', 'S003', 'S004', 'S005'];
const SKUS: Record<string, {name: string, cat: string, price: number, lead: number}> = {
    "BEER_LAGER_6PK": {name: "Classic Lager 6-Pack", cat: "Beer", price: 10.99, lead: 7},
    "BEER_IPA_4PK": {name: "Hoppy IPA 4-Pack", cat: "Beer", price: 12.99, lead: 14},
    "BEER_STOUT_6PK": {name: "Midnight Stout 6-Pack", cat: "Beer", price: 11.99, lead: 10},
    "ALE_PALE_6PK": {name: "Sunny Pale Ale 6-Pack", cat: "Beer", price: 10.49, lead: 7},
    "UNKNOWN_SKU_999": {name: "Discontinued Brew", cat: "Legacy", price: 5.00, lead: 30},
};

function writeCsv(filename: string, headers: string[], rows: any[]) {
    const headerLine = headers.join(',');
    const lines = rows.map(r => headers.map(h => r[h]).join(','));
    fs.writeFileSync(path.join(RAW_DIR, filename), [headerLine, ...lines].join('\n'));
    console.log(`Generated ${filename} with ${rows.length} rows`);
}

// 1. SKU Map
const skuRows = Object.entries(SKUS).map(([sku, info]) => ({
    sku,
    product_name: info.name,
    category: info.cat,
    pack_size: sku.includes('6PK') ? '6PK' : '4PK',
    active_flag: !sku.includes('UNKNOWN')
}));
writeCsv('sku_map.csv', ['sku', 'product_name', 'category', 'pack_size', 'active_flag'], skuRows);

// 2. POS Sales
const posRows: any[] = [];
for (let i = 0; i < DAYS_HISTORY; i++) {
    const date = addDays(START_DATE, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isSummer = date.getMonth() >= 5 && date.getMonth() <= 7;
    const isDec = date.getMonth() === 11;

    let seasonality = 1.0;
    if (isSummer) seasonality = 1.3;
    if (isDec) seasonality = 1.2;
    if (isWeekend) seasonality *= 1.5;

    STORES.forEach(store => {
        Object.keys(SKUS).forEach(sku => {
            if (sku.includes('UNKNOWN') && Math.random() > 0.05) return;
            
            let lambda = 5 * seasonality;
            // Simple Poisson-ish approximation
            let units = Math.floor(lambda + (Math.random() - 0.5) * lambda); 
            if (units < 0) units = 0;

            // Messy: Negative
            if (Math.random() < 0.01) units = -units;

            // Messy: Promo
            let promo = false;
            let price = SKUS[sku].price;
            if (Math.random() < 0.1) {
                promo = true;
                if (units > 0) units = Math.floor(units * 1.5);
                price *= 0.8;
            }

            if (units !== 0) {
                posRows.push({
                    date: dateStr,
                    store_id: store,
                    sku,
                    units_sold: units,
                    unit_price: price.toFixed(2),
                    promo_flag: promo
                });
            }
        });
    });
}
// Duplicates
posRows.push(...posRows.slice(0, 20));
writeCsv('pos_sales.csv', ['date', 'store_id', 'sku', 'units_sold', 'unit_price', 'promo_flag'], posRows);

// 3. Ecommerce Sales
const ecomRows: any[] = [];
for (let i = 0; i < DAYS_HISTORY; i++) {
    const date = addDays(START_DATE, i);
    const dateStr = format(date, 'yyyy-MM-dd');

    Object.keys(SKUS).forEach(sku => {
        if (sku.includes('UNKNOWN')) return;
        if (Math.random() < 0.3) return; // Sparse

        const units = Math.floor(Math.random() * 20) + 1;
        const discount = Math.random() < 0.05 ? (SKUS[sku].price * 0.1).toFixed(2) : 0;
        
        ecomRows.push({
            date: dateStr,
            sku,
            units_sold: units,
            unit_price: SKUS[sku].price,
            discount
        });
    });
}
writeCsv('ecommerce_sales.csv', ['date', 'sku', 'units_sold', 'unit_price', 'discount'], ecomRows);

// 4. Inventory
const invRows = Object.entries(SKUS).map(([sku, info]) => ({
    date: format(new Date(), 'yyyy-MM-dd'),
    sku,
    on_hand: Math.floor(Math.random() * 200),
    on_order: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 0,
    lead_time_days: info.lead
}));
writeCsv('inventory.csv', ['date', 'sku', 'on_hand', 'on_order', 'lead_time_days'], invRows);
