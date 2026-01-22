export type DataSourceItem = {
  label: string;
  url: string;
  note?: string;
};

export type DataSourceGroup = {
  title: string;
  description?: string;
  items: DataSourceItem[];
};

export const dataSourceGroups: DataSourceGroup[] = [
  {
    title: "Collective Arts catalog surfaces",
    description: "Product cards with price-from, reviews, and sold-out flags.",
    items: [
      {
        label: "Beer and Cider collection",
        url: "https://collectiveartscreativity.com/collections/beer-cider"
      },
      {
        label: "IPA collection",
        url: "https://collectiveartscreativity.com/collections/ipa"
      },
      {
        label: "New Release collection",
        url: "https://collectiveartscreativity.com/collections/new-release"
      },
      {
        label: "All products collection",
        url: "https://collectiveartscreativity.com/collections/all"
      }
    ]
  },
  {
    title: "Collective Arts product details",
    description: "ABV, descriptions, and variant pack pricing where visible.",
    items: [
      {
        label: "Life in the Clouds NEIPA",
        url: "https://collectiveartscreativity.com/products/life-in-the-clouds-ipa"
      },
      {
        label: "Ransack the Universe West Coast IPA",
        url: "https://collectiveartscreativity.com/products/ransack-the-universe-ipa"
      },
      {
        label: "Collective Lager",
        url: "https://collectiveartscreativity.com/products/collective-lager"
      },
      {
        label: "Core Beer editorial page",
        url: "https://collectiveartscreativity.com/pages/core-beer",
        note: "ABV list + marketing descriptions"
      }
    ]
  },
  {
    title: "Retail price snapshots (public)",
    description: "Pricing signals, not sales.",
    items: [
      {
        label: "Loblaws - Life in the Clouds",
        url: "https://www.loblaws.ca/en/life-in-the-clouds-beer-id-required-at-pick-up/p/21396996_C04"
      },
      {
        label: "DrinkDash - Collective Arts Lager",
        url: "https://drinkdash.ca/shop/31512-collective-arts-lager-7745"
      }
    ]
  },
  {
    title: "Interest and availability signals",
    description: "Demand proxies and availability intelligence.",
    items: [
      {
        label: "Untappd API docs",
        url: "https://untappd.com/api/docs",
        note: "Rate limited; cache and backoff"
      },
      {
        label: "Untappd Business docs",
        url: "https://docs.business.untappd.com/",
        note: "Avoid per-request session creation"
      },
      {
        label: "Untappd API terms",
        url: "https://untappd.com/terms/api"
      },
      {
        label: "Beer Store community API",
        url: "https://github.com/CDyWeb/beer-store-api",
        note: "Unofficial"
      }
    ]
  },
  {
    title: "Location context",
    items: [
      {
        label: "Collective Arts Hamilton page",
        url: "https://collectiveartscreativity.com/pages/hamilton"
      }
    ]
  },
  {
    title: "Authorized sales and inventory (gated)",
    description: "Upgrade path to real sales and inventory data.",
    items: [
      {
        label: "LCBO Sale of Data program",
        url: "https://www.doingbusinesswithlcbo.com/content/dbwl/en/basepage/home/new-supplier-agent/demo/SaleOfData.html"
      },
      {
        label: "LCBO SOD portal",
        url: "https://sod.lcbo.com/"
      },
      {
        label: "LCBO SOD FAQ",
        url: "https://sod.lcbo.com/downloads/reference_doc/SOD_FAQ.pdf"
      }
    ]
  }
];

export const dataSourceNotes = [
  "Public catalog and prices are market signals, not sales.",
  "True sales data is restricted and contract-bound (LCBO SOD or producer exports).",
  "Follow platform terms and keep outputs aggregated if rights are limited."
];
