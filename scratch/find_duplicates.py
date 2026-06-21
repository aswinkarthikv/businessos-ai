import os
import re

def find_duplicate_styles():
    src_dir = r"c:\Users\aswin\Documents\Autonomous ai\frontend\src"
    # Match tag open containing style twice
    pattern = re.compile(r'<[a-zA-Z0-9]+[^>]*style=\{[^}]*\}[^>]*style=\{[^}]*\}')
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.jsx', '.js')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for duplicate style
                matches = pattern.findall(content)
                if matches:
                    print(f"Found matches in {file}:")
                    for m in matches:
                        print(f"  {m}")

if __name__ == "__main__":
    find_duplicate_styles()
