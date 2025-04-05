import json
import sys

def format_json(input_file, output_file):
    try:
        # Load raw JSON data
        with open(input_file, "r", encoding="utf-8") as file:
            data = json.load(file)

        formatted_data = []
        skipped_entries = 0
        error_log = []

        for idx, entry in enumerate(data):
            print(f"🔍 Processing entry {idx + 1}...")

            # Define required fields for new schema
            required_fields = [
                "index", "Title", "author", "messageType",
                "originalPostTitle", "originalPostURL", "date"
            ]

            missing_fields = [
                field for field in required_fields
                if field not in entry or not str(entry[field]).strip()
            ]

            if missing_fields:
                print(f"❌ Entry {idx + 1} skipped due to missing fields: {missing_fields}")
                error_log.append({
                    "entry_index": idx + 1,
                    "missing_fields": missing_fields,
                    "entry": entry
                })
                skipped_entries += 1
                continue

            # Normalize tags: string → list
            tags = entry.get("Tags", [])
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(",") if t.strip()]
            entry["Tags"] = tags

            # Optional fields — ensure they exist (even if empty string)
            optional_fields = [
                "Question", "Answer", "passageIntro",
                "passageContent", "passageSummary", "entity"
            ]
            for field in optional_fields:
                if field not in entry:
                    entry[field] = ""

            formatted_data.append(entry)

        # ✅ Save formatted output
        with open(output_file, "w", encoding="utf-8") as file:
            json.dump(formatted_data, file, indent=4, ensure_ascii=False)

        # ❗ Save error log if any
        if error_log:
            error_file = output_file.replace(".json", "_errors.json")
            with open(error_file, "w", encoding="utf-8") as file:
                json.dump(error_log, file, indent=4, ensure_ascii=False)
            print(f"\n⚠️ Skipped entries logged to: {error_file}")

        print(f"\n✅ Formatting complete. Output written to {output_file}")
        print(f"📌 Total valid entries: {len(formatted_data)}")
        print(f"📌 Total skipped entries: {skipped_entries}")

    except Exception as e:
        print(f"❌ Error during formatting: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python format_json2.py <input_file.json> <output_file.json>")
    else:
        format_json(sys.argv[1], sys.argv[2])
