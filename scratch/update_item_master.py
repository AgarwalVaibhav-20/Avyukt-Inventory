import sys

file_path = r"c:\Users\agarw\Desktop\ACT Business\inventory\avyukt-inventary\src\components\product-master\ItemMaster.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update filters state
old_filters = """    const [filters, setFilters] = useState({
      category: "all",
      brand: "all",
      itemType: "all",
    });"""

new_filters = """    const [filters, setFilters] = useState<{
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

content = content.replace(old_filters, new_filters)

# 2. Update loadItems and useEffect
old_load = """  useEffect(() => {
    loadItems();
    loadMasterData();
  }, [dispatch]);

  const loadItems = () => {
    dispatch(fetchItems());
    dispatch(fetchStockMovementData());
  };"""

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

content = content.replace(old_load, new_load)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success")
