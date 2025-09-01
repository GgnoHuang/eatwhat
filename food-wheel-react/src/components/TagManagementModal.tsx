'use client'

import React, { useState } from 'react'

interface Props {
  categories: string[]
  onAddTag: (name: string) => Promise<boolean>
  onDeleteTag: (name: string) => Promise<boolean>
  onClose: () => void
}

export default function TagManagementModal({ categories, onAddTag, onDeleteTag, onClose }: Props) {
  const [newTagName, setNewTagName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) {
      alert('請輸入標籤名稱！')
      return
    }

    if (categories.includes(newTagName.trim())) {
      alert('這個標籤已經存在了！')
      return
    }

    const success = await onAddTag(newTagName.trim())
    if (success) {
      setNewTagName('')
    }
  }

  const handleDelete = async (tagName: string) => {
    if (confirm(`確定要刪除標籤 "${tagName}" 嗎？觸發器會自動從所有餐點中移除此標籤。`)) {
      await onDeleteTag(tagName)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 標題 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 flex justify-between items-center">
          <h3 className="text-xl font-semibold">標籤管理</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">
            ×
          </button>
        </div>

        <div className="p-5 max-h-[calc(90vh-80px)] overflow-y-auto">
          {/* 新增標籤 */}
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="新增標籤名稱"
              className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            >
              新增標籤
            </button>
          </form>

          {/* 現有標籤列表 */}
          <div className="space-y-2">
            {categories.map(category => (
              <div key={category} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg border-l-4 border-l-blue-500">
                <span className="font-semibold text-gray-800">{category}</span>
                <button
                  onClick={() => handleDelete(category)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                >
                  刪除
                </button>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              還沒有任何標籤
            </div>
          )}
        </div>
      </div>
    </div>
  )
}