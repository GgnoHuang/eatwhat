import { createClient } from '@supabase/supabase-js'

// Supabase 客戶端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 上傳圖片到 Supabase Storage
 * @param file - 要上傳的圖片檔案
 * @param folder - 存放的資料夾名稱（選填）
 * @returns Promise<string | null> - 成功返回圖片 URL，失敗返回 null
 */
export async function uploadImage(file: File, folder: string = 'foods'): Promise<string | null> {
  try {
    // 檢查檔案類型 - 支援 HEIC 檔案
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'image/heic', 'image/heif' // 支援 HEIC/HEIF 格式
    ]
    
    const fileExtension = file.name.toLowerCase().split('.').pop()
    const isValidExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(fileExtension || '')
    
    if (!file.type.startsWith('image/') && !isValidExtension) {
      throw new Error('請選擇圖片檔案 (支援 JPG, PNG, GIF, WebP, HEIC 格式)')
    }

    // 檢查檔案大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('圖片檔案不能超過 5MB')
    }

    // 生成唯一檔名
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // 上傳到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('food-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('上傳錯誤:', error)
      throw new Error('圖片上傳失敗')
    }

    // 獲取公開 URL
    const { data: urlData } = supabase.storage
      .from('food-images')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error('圖片上傳失敗:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('未知錯誤')
  }
}

/**
 * 刪除 Supabase Storage 中的圖片
 * @param imageUrl - 要刪除的圖片 URL
 * @returns Promise<boolean> - 成功返回 true
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    // 從 URL 提取檔案路徑
    const url = new URL(imageUrl)
    const pathSegments = url.pathname.split('/')
    const bucketIndex = pathSegments.findIndex(segment => segment === 'food-images')
    
    if (bucketIndex === -1) {
      throw new Error('無效的圖片 URL')
    }

    const filePath = pathSegments.slice(bucketIndex + 1).join('/')

    // 從 Storage 中刪除
    const { error } = await supabase.storage
      .from('food-images')
      .remove([filePath])

    if (error) {
      console.error('刪除錯誤:', error)
      throw new Error('圖片刪除失敗')
    }

    return true
  } catch (error) {
    console.error('圖片刪除失敗:', error)
    return false
  }
}

/**
 * 壓縮圖片
 * @param file - 原始圖片檔案
 * @param maxWidth - 最大寬度（預設 800px）
 * @param quality - 品質 0-1（預設 0.8）
 * @returns Promise<File> - 壓縮後的檔案
 */
export function compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    img.onload = () => {
      // 計算新尺寸
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      const newWidth = img.width * ratio
      const newHeight = img.height * ratio

      // 設定 canvas 大小
      canvas.width = newWidth
      canvas.height = newHeight

      // 繪製壓縮後的圖片
      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      // 轉換為 Blob
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(compressedFile)
        },
        file.type,
        quality
      )
    }

    img.src = URL.createObjectURL(file)
  })
}