'use client'

import React, { useState } from 'react'

interface Props {
  categories: string[]
  onSubmit: (data: {
    name: string
    imageUrl?: string
    price: string
    taste: string
    tagNames: string[]
  }) => void
  onClose: () => void
  onManageTags: () => void
}

export default function AddFoodModal({ categories, onSubmit, onClose, onManageTags }: Props) {
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [price, setPrice] = useState('$')
  const [taste, setTaste] = useState('🩷')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('請輸入餐點名稱！')
      return
    }
    if (selectedTags.length === 0) {
      alert('請至少選擇一個標籤！')
      return
    }

    onSubmit({
      name: name.trim(),
      imageUrl: imageUrl.trim() || undefined,
      price,
      taste,
      tagNames: selectedTags
    })

    // 重置表單
    setName('')
    setImageUrl('')
    setPrice('$')
    setTaste('🩷')
    setSelectedTags([])
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 標題 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 flex justify-between items-center">
          <h3 className="text-xl font-semibold">新增餐點</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[calc(90vh-80px)] overflow-y-auto">
          {/* 餐點名稱 */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入餐點名稱"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 圖片網址 */}
          <div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="輸入圖片網址（選填）"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 價格等級 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">價格等級：</label>
            <div className="flex gap-2">
              {['$', '$$', '$$$'].map(priceOption => (
                <label key={priceOption} className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${
                  price === priceOption ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="price"
                    value={priceOption}
                    checked={price === priceOption}
                    onChange={(e) => setPrice(e.target.value)}
                    className="hidden"
                  />
                  {priceOption}
                </label>
              ))}
            </div>
          </div>

          {/* 好吃度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">好吃度：</label>
            <div className="flex gap-2">
              {['🩷', '🩷🩷', '🩷🩷🩷'].map(tasteOption => (
                <label key={tasteOption} className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${
                  taste === tasteOption ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="taste"
                    value={tasteOption}
                    checked={taste === tasteOption}
                    onChange={(e) => setTaste(e.target.value)}
                    className="hidden"
                  />
                  {tasteOption}
                </label>
              ))}
            </div>
          </div>

          {/* 標籤選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">選擇標籤：</label>
            <div className="flex flex-wrap gap-2 p-3 border-2 border-gray-200 rounded-lg">
              {categories.map(category => (
                <label
                  key={category}
                  className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                    selectedTags.includes(category)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(category)}
                    onChange={() => toggleTag(category)}
                    className="hidden"
                  />
                  {category}
                </label>
              ))}
              <button
                type="button"
                onClick={onManageTags}
                className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* 提交按鈕 */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            新增餐點
          </button>
        </form>
      </div>
    </div>
  )
}