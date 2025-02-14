import json
import sys

def format_json(input_file, output_file):
    try:
        # Load raw JSON data
        with open(input_file, "r", encoding="utf-8") as file:
            data = json.load(file)

        formatted_data = []
        skipped_entries = 0

        for index, entry in enumerate(data):
            print(f"🔍 Checking entry {index + 1}: {entry}")  # Debugging print

            # Ensure required fields are present & not empty
            required_fields = ["Title", "Category", "Question", "Answer", "MessageType"]
            if any(field not in entry or not str(entry[field]).strip() for field in required_fields):
                print(f"❌ Skipping invalid entry {index + 1}: {entry}")
                skipped_entries += 1
                continue  # Skip incomplete entries

            # ✅ Fix Empty "Tags" Handling
            entry["Tags"] = entry.get("Tags", [])
            if isinstance(entry["Tags"], str):  # If it's an empty string, make it an empty list
                entry["Tags"] = [] if not entry["Tags"].strip() else [entry["Tags"]]

            formatted_data.append(entry)

        # Save formatted JSON
        with open(output_file, "w", encoding="utf-8") as file:
            json.dump(formatted_data, file, indent=4, ensure_ascii=False)

        print(f"\n✅ JSON successfully formatted and saved as {output_file}!")
        print(f"📌 Total skipped entries: {skipped_entries}")

    except Exception as e:
        print(f"❌ Error processing file: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python format_json.py <input_file.json> <output_file.json>")
    else:
        format_json(sys.argv[1], sys.argv[2])
