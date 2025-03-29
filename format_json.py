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

        for index, entry in enumerate(data):
            print(f"🔍 Checking entry {index + 1}")

            # ⚠️ 'Category' is no longer required
            required_fields = ["Title", "Question", "Answer", "messageType"]
            missing_or_empty = [
                field for field in required_fields
                if field not in entry or not str(entry[field]).strip()
            ]

            if missing_or_empty:
                error_message = {
                    "entry_index": index + 1,
                    "missing_fields": missing_or_empty,
                    "entry": entry
                }
                error_log.append(error_message)
                print(f"❌ Skipping entry {index + 1} due to: {missing_or_empty}")
                skipped_entries += 1
                continue

            # ✅ Fix Empty "Tags" Handling
            entry["Tags"] = entry.get("Tags", [])
            if isinstance(entry["Tags"], str):
                entry["Tags"] = [] if not entry["Tags"].strip() else [entry["Tags"]]

            formatted_data.append(entry)

        # Save formatted JSON
        with open(output_file, "w", encoding="utf-8") as file:
            json.dump(formatted_data, file, indent=4, ensure_ascii=False)

        # Save error log if there were skipped entries
        if error_log:
            error_file = output_file.replace(".json", "_errors.json")
            with open(error_file, "w", encoding="utf-8") as log:
                json.dump(error_log, log, indent=4, ensure_ascii=False)
            print(f"\n⚠️ Skipped entries logged to: {error_file}")

        print(f"\n✅ JSON successfully formatted and saved as {output_file}!")
        print(f"📌 Total skipped entries: {skipped_entries}")

    except Exception as e:
        print(f"❌ Error processing file: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python format_json.py <input_file.json> <output_file.json>")
    else:
        format_json(sys.argv[1], sys.argv[2])
