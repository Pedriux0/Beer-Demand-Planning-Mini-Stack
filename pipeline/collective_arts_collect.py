import json
import re
import time
from pathlib import Path
from typing import Dict, List, Optional, Set
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA_SOURCES_PATH = ROOT / "DATA_SOURCES.md"
OUTPUT_DIR = ROOT / "dashboard" / "public" / "data"

COLLECTION_REGEX = r"https://collectiveartscreativity.com/collections/[^\s)]+"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def dedupe_keep_order(items: List[str]) -> List[str]:
    seen: Set[str] = set()
    ordered: List[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            ordered.append(item)
    return ordered


def fetch_json(url: str) -> Dict:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_collection_products(collection_url: str) -> List[Dict]:
    products: List[Dict] = []
    page = 1
    while True:
        json_url = f"{collection_url}/products.json?limit=250&page={page}"
        try:
            payload = fetch_json(json_url)
        except (HTTPError, URLError) as exc:
            print(f"Failed to fetch {json_url}: {exc}")
            break

        batch = payload.get("products", [])
        if not batch:
            break
        products.extend(batch)
        page += 1
        time.sleep(0.5)
    return products


def is_beer_like(product: Dict) -> bool:
    product_type = str(product.get("product_type", "")).lower()
    tags = " ".join(product.get("tags", [])).lower()
    return "beer" in product_type or "cider" in product_type or "beer" in tags or "cider" in tags


def product_available(product: Dict) -> bool:
    if "available" in product:
        return bool(product["available"])
    variants = product.get("variants", [])
    return any(variant.get("available") for variant in variants)


def min_variant_price(product: Dict) -> Optional[float]:
    prices = []
    for variant in product.get("variants", []):
        try:
            prices.append(float(variant.get("price", 0)))
        except (TypeError, ValueError):
            continue
    return min(prices) if prices else None


def collect_from_sources() -> Dict:
    if not DATA_SOURCES_PATH.exists():
        raise FileNotFoundError(f"Missing {DATA_SOURCES_PATH}")

    text = read_text(DATA_SOURCES_PATH)
    collection_urls = dedupe_keep_order(re.findall(COLLECTION_REGEX, text))
    if not collection_urls:
        raise ValueError("No collection URLs found in DATA_SOURCES.md")

    products_by_id: Dict[str, Dict] = {}

    for collection_url in collection_urls:
        collection_handle = collection_url.rstrip("/").split("/")[-1]
        for product in fetch_collection_products(collection_url):
            product_id = str(product.get("id"))
            if not product_id:
                continue
            existing = products_by_id.get(product_id)
            if not existing:
                products_by_id[product_id] = {
                    "id": product_id,
                    "title": product.get("title"),
                    "handle": product.get("handle"),
                    "product_type": product.get("product_type"),
                    "tags": product.get("tags", []),
                    "available": product_available(product),
                    "price_from": min_variant_price(product),
                    "collections": {collection_handle},
                }
            else:
                existing["collections"].add(collection_handle)
                if not existing.get("available"):
                    existing["available"] = product_available(product)

    catalog_items: List[Dict] = []
    for entry in products_by_id.values():
        handle = entry.get("handle") or ""
        entry["collections"] = sorted(entry["collections"])
        entry["url"] = f"https://collectiveartscreativity.com/products/{handle}" if handle else None
        catalog_items.append(entry)

    catalog_items.sort(key=lambda item: item.get("title") or "")

    summary = {
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_products": len(catalog_items),
        "beer_like_total": 0,
        "beer_like_available": 0,
        "beer_like_sold_out": 0,
        "collection_counts": {},
        "collection_available_counts": {},
    }

    for item in catalog_items:
        available = bool(item.get("available"))
        beer_like = is_beer_like(item)
        if beer_like:
            summary["beer_like_total"] += 1
            if available:
                summary["beer_like_available"] += 1
            else:
                summary["beer_like_sold_out"] += 1

        for collection in item.get("collections", []):
            summary["collection_counts"][collection] = summary["collection_counts"].get(collection, 0) + 1
            if available:
                summary["collection_available_counts"][collection] = (
                    summary["collection_available_counts"].get(collection, 0) + 1
                )

    return {"summary": summary, "catalog": catalog_items}


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    data = collect_from_sources()
    (OUTPUT_DIR / "collective_arts_summary.json").write_text(
        json.dumps(data["summary"], indent=2), encoding="utf-8"
    )
    (OUTPUT_DIR / "collective_arts_catalog.json").write_text(
        json.dumps(data["catalog"], indent=2), encoding="utf-8"
    )
    print("Wrote dashboard/public/data/collective_arts_summary.json")
    print("Wrote dashboard/public/data/collective_arts_catalog.json")


if __name__ == "__main__":
    main()
