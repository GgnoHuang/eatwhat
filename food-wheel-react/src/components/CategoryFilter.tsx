interface Props {
  categories: string[]
  currentCategory: string
  onCategoryChange: (category: string) => void
  onManageTags: () => void
}

export default function CategoryFilter({ categories, currentCategory, onCategoryChange, onManageTags }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6">
      {categories.map(category => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
            currentCategory === category
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }`}
        >
          {category === 'all' ? '全部' : category}
        </button>
      ))}
      <button
        onClick={onManageTags}
        className="px-4 py-2 rounded-full border-2 border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all font-medium"
      >
        +
      </button>
    </div>
  )
}