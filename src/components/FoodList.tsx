import { FoodItem } from '@/hooks/useFoodData'

interface Props {
  items: FoodItem[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortByChange: (sortBy: string) => void
  onSortOrderToggle: () => void
  onAddFood: () => void
  onEditFood: (item: FoodItem) => void
  onDeleteFood: (id: string, name: string) => void
  loading: boolean
}

export default function FoodList({
  items,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderToggle,
  onAddFood,
  onEditFood,
  onDeleteFood,
  loading
}: Props) {
  return (
    <div className="mt-6">
      {/* 排序控制 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-800 font-medium">排序：</label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-3 py-1 border border-gray-400 rounded-md text-sm text-gray-800 bg-white focus:border-blue-500 focus:outline-none"
          >
            <option value="date">新增時間</option>
            <option value="price">價格</option>
            <option value="taste">好吃度</option>
          </select>
          <button
            onClick={onSortOrderToggle}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-bold hover:bg-blue-600 hover:scale-110 transition-all"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* 餐點網格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {/* 新增按鈕卡片 */}
        <div
          onClick={onAddFood}
          className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-3 cursor-pointer transition-all hover:bg-gray-100 hover:border-blue-400 hover:-translate-y-1 hover:scale-105 flex items-center justify-center min-h-[90px] shadow-sm"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500 mb-1">+</div>
          </div>
        </div>

        {/* 餐點卡片 */}
        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-blue-500 rounded-xl p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:scale-105 relative min-h-[90px] flex flex-col fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* 圖片 */}
            {item.imageUrl && (
              <div className="w-full h-16 rounded-lg overflow-hidden mb-2">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.parentElement!.style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* 左上角標籤 */}
            <div className="absolute top-2 left-2 flex gap-1 z-10">
              <span className="bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded shadow">
                {item.price}
              </span>
              <span className="bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded shadow">
                {item.taste}
              </span>
            </div>

            {/* 右上角編輯按鈕 */}
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={() => onEditFood(item)}
                className="bg-white text-gray-700 w-6 h-6 rounded text-xs flex items-center justify-center hover:bg-gray-50 transition-colors shadow"
              >
                ✏️
              </button>
            </div>

            {/* 餐點名稱 */}
            <div className="flex-1 flex items-center justify-center px-6">
              <h3 className="text-white font-bold text-center text-base leading-tight"
                  style={{ fontFamily: 'Comic Sans MS, Microsoft JhengHei, cursive, sans-serif' }}>
                {item.name}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-4 text-gray-700">
          載入中...
        </div>
      )}
    </div>
  )
}