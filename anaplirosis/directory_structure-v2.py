import os
from pathlib import Path

def get_directory_structure(root_dir):
    structure = []
    try:
        def scan_dir(path, prefix=""):
            for item in sorted(os.listdir(path)):
                item_path = os.path.join(path, item)
                # Skip the node_modules directory
                if item == "node_modules":
                    continue
                if os.path.isdir(item_path):
                    structure.append(f"{prefix}📁 {item}")
                    scan_dir(item_path, prefix + "  ")
                else:
                    structure.append(f"{prefix}📄 {item}")
        scan_dir(root_dir)
        return structure
    except Exception as e:
        return [f"Σφάλμα: {str(e)}"]

def save_to_file(structure, output_file="file_structure.txt"):
    with open(output_file, "w", encoding="utf-8") as f:
        for line in structure:
            f.write(line + "\n")
    return output_file

def main():
    folder = input("Δώσε τη διαδρομή του φακέλου: ").strip()
    if not folder:
        folder = os.getcwd()
    if os.path.exists(folder):
        structure = get_directory_structure(folder)
        for line in structure:
            print(line)
        output_file = save_to_file(structure)
        print(f"\nΗ δομή αποθηκεύτηκε στο: {output_file}")
    else:
        print("Ο φάκελος δεν υπάρχει!")

if __name__ == "__main__":
    main()
