import os
import re

path_item = r"c:\Users\agarw\Desktop\ACT Business\inventory\avyukt-inventary\src\components\product-master\ItemMaster.tsx"
with open(path_item, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the PopoverContent inside ItemMaster.tsx with FilterPanel
pattern = r'<PopoverContent className="w-80 p-6" align="end">[\s\S]*?</PopoverContent>'
replacement = r"""<PopoverContent className="w-80 p-0 bg-transparent border-none shadow-none" align="end">
            <FilterPanel
              fields={[
                {
                  id: "category",
                  label: "Category",
                  type: "tree-select",
                  options: categories.map(c => ({ label: c.name, value: c.name, parentId: c.parentId }))
                },
                {
                  id: "brand",
                  label: "Brands",
                  type: "multi-select",
                  options: brands.map(b => ({ label: b.name, value: b.name }))
                },
                {
                  id: "uom",
                  label: "Unit of Measure",
                  type: "select",
                  options: uoms.map(u => ({ label: u.name, value: u.name }))
                },
                {
                  id: "hsnCode",
                  label: "HSN Code",
                  type: "text",
                  placeholder: "Search HSN..."
                },
                {
                  id: "itemType",
                  label: "Item Type",
                  type: "select",
                  options: [
                    { label: "Product", value: "product" },
                    { label: "Raw Material", value: "rawmaterial" },
                    { label: "Service", value: "service" },
                  ]
                }
              ]}
              onFilterChange={(newFilters) => {
                setFilters({
                  category: newFilters.category || "all",
                  brand: newFilters.brand || [],
                  itemType: newFilters.itemType || "all",
                  uom: newFilters.uom || "all",
                  hsnCode: newFilters.hsnCode || "",
                });
              }}
              onReset={() => setFilters({
                category: "all",
                brand: [],
                itemType: "all",
                uom: "all",
                hsnCode: "",
              })}
              showToggle={false}
            />
          </PopoverContent>"""

content = re.sub(pattern, replacement, content)

# Import FilterPanel
if "import FilterPanel" not in content:
    content = content.replace('import { NotionSelect }', 'import FilterPanel from "@/components/common/FilterPanel";\nimport { NotionSelect }')

with open(path_item, "w", encoding="utf-8") as f:
    f.write(content)

print("Success")
