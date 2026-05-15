import sys
import os

file_path = r"c:\Users\agarw\Desktop\ACT Business\inventory\avyukt-inventary\src\components\product-master\ItemMaster.tsx"

# Try different encodings
encodings = ["utf-8", "utf-16", "cp1252", "latin-1"]
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

# 1. Update filters state
import re

# Match filters state
filters_pattern = r'const \[filters, setFilters\] = useState\(\{[\s\S]*?\}\);'
new_filters = """const [filters, setFilters] = useState<{
    category: string;
    brand: string[];
    itemType: string;
    uom: string;
    hsnCode: string;
  }>({
    category: "all",
    brand: [],
    itemType: "all",
    uom: "all",
    hsnCode: "",
  });"""

content = re.sub(filters_pattern, new_filters, content)

# 2. Update loadItems and initial useEffect
load_pattern = r'useEffect\(\(\) => \{[\s\S]*?loadItems\(\);[\s\S]*?loadMasterData\(\);[\s\S]*?\}, \[dispatch\]\);[\s\S]*?const loadItems = \(\) => \{[\s\S]*?dispatch\(fetchItems\(\)\);[\s\S]*?dispatch\(fetchStockMovementData\(\)\);[\s\S]*?\};'
new_load = """  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadItems();
    dispatch(fetchStockMovementData());
  }, [filters, search]);

  const loadItems = () => {
    dispatch(fetchItems({ ...filters, search }));
  };"""

content = re.sub(load_pattern, new_load, content)

# 3. Update activeFiltersCount
count_pattern = r'const activeFiltersCount = Object\.values\(filters\)\.filter\([\s\S]*?v !== "all",?[\s\S]*?\)\.length;'
new_count = """const activeFiltersCount = 
    (filters.category !== "all" ? 1 : 0) + 
    (filters.brand.length > 0 ? 1 : 0) + 
    (filters.itemType !== "all" ? 1 : 0) + 
    (filters.uom !== "all" ? 1 : 0) + 
    (filters.hsnCode !== "" ? 1 : 0);"""

content = re.sub(count_pattern, new_count, content)

# 4. Update Filter UI
ui_pattern = r'<h4 className="text-sm font-semibold text-gray-900">Filters</h4>[\s\S]*?<div className="space-y-3">[\s\S]*?<div className="space-y-1.5">[\s\S]*?Category[\s\S]*?<NotionSelect[\s\S]*?</div>[\s\S]*?<div className="space-y-1.5">[\s\S]*?Brand[\s\S]*?<NotionSelect[\s\S]*?</div>'
new_ui = """<h4 className="text-sm font-semibold text-gray-900">Filters</h4>
                {activeFiltersCount > 0 && (
                    <button
                      onClick={() =>
                        setFilters({
                          category: "all",
                          brand: [],
                          itemType: "all",
                          uom: "all",
                          hsnCode: "",
                        })
                      }
                      className="text-[10px] text-blue-600 hover:underline font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
  
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Category
                    </label>
                    <NotionSelect
                      value={filters.category}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, category: v }))
                      }
                      placeholder="Category"
                      options={[
                        { label: "All Categories", value: "all" },
                        ...categories.map((c) => ({ label: c.name, value: c.name })),
                      ]}
                    />
                  </div>
  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Brand
                    </label>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {filters.brand.map(b => (
                        <ChipTag key={b} onRemove={() => setFilters(f => ({ ...f, brand: f.brand.filter(x => x !== b) }))}>
                          {b}
                        </ChipTag>
                      ))}
                    </div>
                    <NotionSelect
                      value=""
                      onValueChange={(v) => {
                        if (v === "all") setFilters(f => ({ ...f, brand: [] }));
                        else if (!filters.brand.includes(v)) setFilters(f => ({ ...f, brand: [...f.brand, v] }));
                      }}
                      placeholder="Add Brand"
                      options={[
                        { label: "All Brands", value: "all" },
                        ...brands.map((b) => ({ label: b.name, value: b.name })),
                      ]}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      UoM
                    </label>
                    <NotionSelect
                      value={filters.uom}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, uom: v }))
                      }
                      placeholder="UoM"
                      options={[
                        { label: "All UoM", value: "all" },
                        ...uoms.map((u) => ({ label: u.name, value: u.code })),
                      ]}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      HSN Code
                    </label>
                    <Input 
                      placeholder="Search HSN..."
                      value={filters.hsnCode}
                      onChange={(e) => setFilters(f => ({ ...f, hsnCode: e.target.value }))}
                      className="h-8 text-xs border-gray-200"
                    />
                  </div>"""

content = re.sub(ui_pattern, new_ui, content)

# 5. Update Clear Filters button
clear_pattern = r'setFilters\(\{ category: "all", brand: "all", itemType: "all" \}\)'
new_clear = 'setFilters({ category: "all", brand: [], itemType: "all", uom: "all", hsnCode: "" })'
content = content.replace(clear_pattern, new_clear)

# 6. Update NotionSelect value comparison in the end
notion_pattern = r'value === option\.value \? "opacity-100" : "opacity-0"'
new_notion = '(Array.isArray(value) ? value.includes(option.value) : value === option.value) ? "opacity-100" : "opacity-0"'
content = content.replace(notion_pattern, new_notion)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success")
