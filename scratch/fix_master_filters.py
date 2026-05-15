import os
import re

# --- Fix MasterCrud.tsx ---
path_master = r"c:\Users\agarw\Desktop\ACT Business\inventory\avyukt-inventary\src\components\admin\MasterCrud.tsx"
with open(path_master, "r", encoding="utf-8") as f:
    content = f.read()

# Add processedFilterFields
pattern = r'const activeFiltersCount = [\s\S]*?true\)\)\.length;'
replacement = r"""\g<0>

  const processedFilterFields = filterFields.map(field => {
    if ((field.type === 'tree-select' || field.type === 'multi-select') && (!field.options || field.options.length === 0)) {
      if (field.type === 'tree-select') {
        return {
          ...field,
          options: data.map((item: any) => ({
            label: item.name,
            value: item._id || item.id,
            parentId: item.parentId
          }))
        };
      } else {
        const uniqueValues = Array.from(new Set(data.map((item: any) => item[field.id]).filter(Boolean)));
        return {
          ...field,
          options: uniqueValues.map(v => ({ label: String(v), value: String(v) }))
        };
      }
    }
    return field;
  });"""

content = re.sub(pattern, replacement, content)

# Use processedFilterFields in FilterPanel
content = content.replace('fields={filterFields}', 'fields={processedFilterFields}')

with open(path_master, "w", encoding="utf-8") as f:
    f.write(content)

# --- Fix ItemMaster.tsx ---
path_item = r"c:\Users\agarw\Desktop\ACT Business\inventory\avyukt-inventary\src\components\product-master\ItemMaster.tsx"
with open(path_item, "r", encoding="utf-8") as f:
    content = f.read()

# Fix useState bug
content = content.replace('}, []);', '});')

# Fix filterFn to avoid local filtering if backend is used, 
# or at least fix the Brand array comparison
content = content.replace('item.brand === activeFilters.brand', '(activeFilters.brand.length === 0 || activeFilters.brand.includes(item.brand))')

with open(path_item, "w", encoding="utf-8") as f:
    f.write(content)

print("Success")
