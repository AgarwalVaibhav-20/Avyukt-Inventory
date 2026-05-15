import sys
import os
import re

file_path = r"c:\Users\agarw\Desktop\ACT Business\inventory\avyukt-inventary\src\components\product-master\ItemMaster.tsx"

# Load file
encodings = ["utf-8", "cp1252", "latin-1"]
content = None
for enc in encodings:
    try:
        with open(file_path, "r", encoding=enc) as f:
            content = f.read()
        print(f"Loaded with {enc}")
        break
    except Exception:
        continue

if content is None:
    print("Failed to load file")
    sys.exit(1)

# Add buildTree helper if not exists
if "const buildTree" not in content:
    helper = """
const buildTree = (items: any[]) => {
  const map: any = {};
  const roots: any[] = [];
  items.forEach(item => {
    map[item.id] = { ...item, children: [] };
  });
  items.forEach(item => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  return roots;
};

const flattenTree = (tree: any[], level = 0): any[] => {
  let result: any[] = [];
  tree.forEach(node => {
    result.push({ ...node, label: "  ".repeat(level) + (level > 0 ? "└─ " : "") + node.name, value: node.name });
    if (node.children) {
      result = result.concat(flattenTree(node.children, level + 1));
    }
  });
  return result;
};
"""
    content = content.replace('const ITEM_TYPES', helper + '\nconst ITEM_TYPES')

# Update Category options in Filter UI
category_options_pattern = r'options=\{\[\s*\{\s*label:\s*"All Categories",\s*value:\s*"all"\s*\},\s*\.\.\.categories\.map\(\(c\)\s*=>\s*\(\{ label: c\.name, value: c\.name \}\)\),\s*\]\}'
new_category_options = 'options={[{ label: "All Categories", value: "all" }, ...flattenTree(buildTree(categories))]}'

content = re.sub(category_options_pattern, new_category_options, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success")
