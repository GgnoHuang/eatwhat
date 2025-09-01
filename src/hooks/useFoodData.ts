'use client'

import { useState, useEffect } from 'react'
import { supabase, Food, Tag, formatPrice, formatTaste } from '@/lib/supabase'

export interface FoodItem {
  id: string
  name: string
  imageUrl?: string
  price: string
  taste: string
  tags: string[]
  tagIds: string[]
  dateAdded: number
}

export function useFoodData() {
  const [items, setItems] = useState<FoodItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [tagNameToId, setTagNameToId] = useState<Map<string, string>>(new Map())
  const [tagIdToName, setTagIdToName] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTags = async () => {
    try {
      const { data: tags, error } = await supabase
        .from('tag')
        .select('*')

      if (error) throw error

      const nameToId = new Map<string, string>()
      const idToName = new Map<string, string>()
      
      tags?.forEach(tag => {
        nameToId.set(tag.name, tag.id)
        idToName.set(tag.id, tag.name)
      })
      
      setTagNameToId(nameToId)
      setTagIdToName(idToName)
      setCategories(tags?.map(tag => tag.name) || [])
      
      return tags || []
    } catch (err) {
      console.error('載入標籤失敗:', err)
      setError('載入標籤失敗')
      return []
    }
  }

  const loadFood = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 先載入標籤
      const tags = await loadTags()
      const idToName = new Map<string, string>()
      tags.forEach(tag => idToName.set(tag.id, tag.name))
      
      const { data: foods, error } = await supabase
        .from('food')
        .select('*')

      if (error) throw error

      const mappedItems: FoodItem[] = foods?.map(food => {
        const tagNames = food.tag_ids?.map((tagId: string) => 
          idToName.get(tagId) || tagId
        ) || []
        
        return {
          id: food.id,
          name: food.payload.foodname || '未命名',
          imageUrl: food.payload.imgurl,
          price: formatPrice(food.payload.price),
          taste: formatTaste(food.payload.taste),
          tags: tagNames,
          tagIds: food.tag_ids || [],
          dateAdded: new Date(food.created_at).getTime()
        }
      }) || []

      setItems(mappedItems)
    } catch (err) {
      console.error('載入食物資料失敗:', err)
      setError('載入資料失敗')
    } finally {
      setLoading(false)
    }
  }

  const addFood = async (foodData: {
    name: string
    imageUrl?: string
    price: string
    taste: string
    tagNames: string[]
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const selectedTagIds = foodData.tagNames
        .map(name => tagNameToId.get(name))
        .filter(id => id) as string[]

      const { error } = await supabase
        .from('food')
        .insert({
          payload: {
            foodname: foodData.name,
            imgurl: foodData.imageUrl || null,
            price: foodData.price === '$' ? 'low' : foodData.price === '$$' ? 'medium' : 'high',
            taste: foodData.taste === '🩷' ? 1 : foodData.taste === '🩷🩷' ? 2 : 3
          },
          tag_ids: selectedTagIds
        })

      if (error) throw error
      await loadFood()
      
      return true
    } catch (err) {
      console.error('新增食物失敗:', err)
      setError('新增食物失敗')
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateFood = async (id: string, foodData: {
    name: string
    imageUrl?: string
    price: string
    taste: string
    tagNames: string[]
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const selectedTagIds = foodData.tagNames
        .map(name => tagNameToId.get(name))
        .filter(id => id) as string[]

      const { error } = await supabase
        .from('food')
        .update({
          payload: {
            foodname: foodData.name,
            imgurl: foodData.imageUrl || null,
            price: foodData.price === '$' ? 'low' : foodData.price === '$$' ? 'medium' : 'high',
            taste: foodData.taste === '🩷' ? 1 : foodData.taste === '🩷🩷' ? 2 : 3
          },
          tag_ids: selectedTagIds
        })
        .eq('id', id)

      if (error) throw error
      await loadFood()
      
      return true
    } catch (err) {
      console.error('更新食物失敗:', err)
      setError('更新食物失敗')
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteFood = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('food')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadFood()
      
      return true
    } catch (err) {
      console.error('刪除食物失敗:', err)
      setError('刪除食物失敗')
      return false
    } finally {
      setLoading(false)
    }
  }

  const addTag = async (name: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('tag')
        .insert({
          name,
          food_ids: []
        })

      if (error) throw error
      await loadTags()
      
      return true
    } catch (err) {
      console.error('新增標籤失敗:', err)
      setError('新增標籤失敗')
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteTag = async (name: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const tagId = tagNameToId.get(name)
      if (!tagId) return false

      const { error } = await supabase
        .from('tag')
        .delete()
        .eq('id', tagId)

      if (error) throw error
      await loadFood()
      
      return true
    } catch (err) {
      console.error('刪除標籤失敗:', err)
      setError('刪除標籤失敗')
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateTag = async (oldName: string, newName: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const tagId = tagNameToId.get(oldName)
      if (!tagId) return false

      // 檢查新名稱是否已存在
      if (categories.includes(newName)) {
        setError('這個標籤名稱已經存在了')
        return false
      }

      const { error } = await supabase
        .from('tag')
        .update({ name: newName })
        .eq('id', tagId)

      if (error) throw error
      await loadFood() // 重新載入所有資料
      
      return true
    } catch (err) {
      console.error('更新標籤失敗:', err)
      setError('更新標籤失敗')
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFood()
  }, [])

  return {
    items,
    categories,
    loading,
    error,
    addFood,
    updateFood,
    deleteFood,
    addTag,
    updateTag,
    deleteTag,
    reload: loadFood
  }
}