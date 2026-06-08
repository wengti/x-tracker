import json
import time
import requests

API_URL = "https://beyblade.fandom.com/api.php"
OUTPUT_DIR = "../backend/seeds"

# Add new part types here when ready
PARTS = [
    {
        "type": "blade",
        "category": "Category:Blades",
        "title_prefix": "Blade - ",
        "output_file": "blades.json",
    },
    {
        "type": "ratchet",
        "category": "Category:Ratchets",
        "title_prefix": "Ratchet - ",
        "output_file": "ratchets.json",
    },
    {
        "type": "bit",
        "category": "Category:Bits",
        "title_prefix": "Bit - ",
        "output_file": "bits.json",
    },
    {
        "type": "lock chip",
        "category": "Category:Lock_Chips",
        "title_prefix": "Lock Chip - ",
        "output_file": "lock_chips.json",
    },
    {
        "type": "metal blades",
        "category": "Category:Metal_Blades",
        "title_prefix": "Metal Blade - ",
        "output_file": "metal_blades.json",
    },
    {
        "type": "over blades",
        "category": "Category:Over_Blades",
        "title_prefix": "Over Blade - ",
        "output_file": "over_blades.json",
    },
    {
        "type": "assist blades",
        "category": "Category:Assist_Blades",
        "title_prefix": "Assist Blade - ",
        "output_file": "assist_blades.json",
    },
]


# Check if parts that have (Hasbro) in their title name
def is_takara_tomy(title):
    return "(Hasbro)" not in title


# Clean up the prefix in the name
# - Remove Prefix
# - Remove Takara Tomy
def clean_name(title, prefix):
    name = title.removeprefix(prefix)
    name = name.replace("(Takara Tomy)", "").replace(" (Takara Tomy)", "")
    return name.strip()


def fetch_batch(category, gcm_continue=None):
    # Setup parameter that can be understood by the fandom API
    params = {
        "action": "query",
        "generator": "categorymembers",
        "gcmtitle": category,
        "gcmtype": "page",
        "gcmlimit": "50",
        "prop": "pageimages",
        "piprop": "original",
        "format": "json",
    }
    if gcm_continue:
        params["gcmcontinue"] = gcm_continue

    # Hit the api and format into a json
    resp = requests.get(API_URL, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def scrape_part(part_config):
    category = part_config["category"]
    prefix = part_config["title_prefix"]
    part_type = part_config["type"]

    parts = []
    gcm_continue = None
    page_num = 1

    while True:
        print(f"  [{part_type}] Fetching page {page_num}...")
        data = fetch_batch(category, gcm_continue)

        for page in data.get("query", {}).get("pages", {}).values():
            # Get the tile
            title = page.get("title", "")

            # Skip non takara_tomy part (has (hasbro) in the name)
            if not is_takara_tomy(title):
                continue

            # Get the image
            image_url = page.get("original", {}).get("source", "")

            # Append the image and cleaned part name
            parts.append(
                {
                    "name": clean_name(title, prefix),
                    "image_url": image_url,
                }
            )

        # Check whether should continue to fetch
        # because it is set to 50 per API fetch in the query parameters
        gcm_continue = data.get("continue", {}).get("gcmcontinue")
        if not gcm_continue:
            break

        # If not break, means need to continue
        # Wait after 0.5s to hit the API on the next page to be polite
        page_num += 1
        time.sleep(0.5)

    # Sort alphabetically
    parts.sort(key=lambda p: p["name"])
    print(f"  [{part_type}] Found {len(parts)} Takara Tomy entries.")
    return parts


def save(data, filename):
    path = f"{OUTPUT_DIR}/{filename}"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Saved -> {path}")


# Parts not found by the scraper — add entries here as needed.
# They are merged into the scraped results on every run, so they survive re-scrapes.
# Duplicates (same name) are skipped automatically.
MANUAL_EXTRAS = {
    "blades.json": [
        {"name": "BulletGriffon", "image_url": "https://static.wikia.nocookie.net/beyblade/images/d/d2/RatchetBladeBulletGriffon.png/revision/latest?cb=20260313031310"},
    ],
}


def merge_extras(data, filename):
    extras = MANUAL_EXTRAS.get(filename, [])
    if not extras:
        return data
    existing_names = {p["name"] for p in data}
    added = 0
    for entry in extras:
        if entry["name"] not in existing_names:
            data.append(entry)
            added += 1
    if added:
        data.sort(key=lambda p: p["name"])
        print(f"  Merged {added} manual extra(s) from MANUAL_EXTRAS.")
    return data


def main():
    for part_config in PARTS:
        print(f"\nScraping {part_config['type']}s...")
        data = scrape_part(part_config)
        data = merge_extras(data, part_config["output_file"])
        save(data, part_config["output_file"])
    print("\nDone.")


if __name__ == "__main__":
    main()
