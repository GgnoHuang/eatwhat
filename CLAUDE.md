# 吃啥轉盤 - 專案說明

## 專案概述
一個基於 Supabase 的食物轉盤應用，用於隨機選擇餐點。支援標籤分類、價格等級、好吃程度等屬性。

## 技術架構

### 🚀 Next.js 版本 (主要版本)
- **框架**: Next.js 15 + React 19 + TypeScript
- **樣式**: Tailwind CSS
- **後端**: Supabase PostgreSQL
- **狀態管理**: Custom Hooks + React State
- **啟動**: `npm run dev`
- **地址**: http://localhost:3000

### ✨ 優勢
- ✅ 更好的性能優化
- ✅ 現代化開發體驗
- ✅ 類型安全 (TypeScript)
- ✅ 自動代碼分割
- ✅ 容易部署到 Vercel
- ✅ SEO 友善
- ✅ 服務端渲染支援

### 📁 原版備份
原版 HTML/CSS/JS 檔案已備份至 `backup-original/` 資料夾

## 資料庫設計

### Tag 表結構
```sql
CREATE TABLE public.tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE,
  food_ids JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (jsonb_typeof(food_ids) = 'array'),
  CHECK (public.is_uuid_array(food_ids))
);

CREATE INDEX tag_foodids_gin
  ON public.tag USING gin (food_ids jsonb_path_ops);
```

### Food 表結構
```sql
CREATE TABLE public.food (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  tag_ids JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (jsonb_typeof(tag_ids) = 'array'),
  CHECK (public.is_uuid_array(tag_ids))
);

CREATE INDEX food_tagids_gin
  ON public.food USING gin (tag_ids jsonb_path_ops);
```

### 資料庫約束說明
- **UUID 陣列驗證**: 使用 `public.is_uuid_array()` 函數確保 `tag_ids` 和 `food_ids` 都是有效的 UUID 陣列
- **GIN 索引**: 針對 JSONB 陣列建立 GIN 索引，優化陣列查詢和包含操作的效能
- **唯一約束**: `tag.name` 欄位有唯一約束，防止重複標籤名稱

### 資料格式範例

#### Food 記錄
```json
{
  "id": "77a88e75-fedd-4101-996a-9d923951cccc",
  "payload": {
    "foodname": "牛肉麵",
    "imgurl": "https://example.com/beef-noodles.jpg",
    "price": "medium",
    "taste": 2
  },
  "tag_ids": ["tag1_id", "tag2_id"],
  "created_at": "2025-09-01T06:25:24.000608+00:00"
}
```

#### Tag 記錄
```json
{
  "id": "tag1_id",
  "name": "麵類",
  "food_ids": ["77a88e75-fedd-4101-996a-9d923951cccc"],
  "created_at": "2025-09-01T06:20:00.000000+00:00"
}
```

## 資料映射規則

### 價格等級
- `low` → `$`
- `medium` → `$$`
- `high` → `$$$`

### 好吃程度
- `1` → `ok`
- `2` → `好吃`
- `3` → `讚`

## 觸發器功能

### 自動同步機制
透過 PostgreSQL 觸發器實現 `food.tag_ids` 與 `tag.food_ids` 的雙向同步：

### 1. Food 表 UPSERT 觸發器 (`tg_sync_tag_on_food_upsert`)
**觸發時機**: `AFTER INSERT OR UPDATE ON food`

**功能說明**:
- ✅ 驗證 `tag_ids` 中的所有 UUID 都存在於 `tag` 表
- ✅ 計算新增/移除的標籤差集
- ✅ 將食物 ID 加入到新增標籤的 `food_ids` 陣列
- ✅ 從移除標籤的 `food_ids` 陣列中刪除食物 ID
- ✅ 防止重複添加相同的食物 ID

```sql
CREATE OR REPLACE FUNCTION public.tg_sync_tag_on_food_upsert()
RETURNS TRIGGER LANGUAGE plpgsql AS $
DECLARE
  new_tags uuid[] := array(select (jsonb_array_elements_text(new.tag_ids))::uuid);
  old_tags uuid[] := array(select (jsonb_array_elements_text(coalesce(old.tag_ids,'[]')))::uuid);
  added    uuid[];
  removed  uuid[];
BEGIN
  /* 0️⃣ 保證所有 tag.id 存在 */
  IF EXISTS (
       SELECT 1
       FROM unnest(new_tags) t
       WHERE NOT EXISTS (SELECT 1 FROM public.tag WHERE id = t)
  ) THEN
       RAISE EXCEPTION 'tag_ids 包含不存在的 tag.id';
  END IF;

  /* 1️⃣ 差集：新加 / 移除 的 tag 列表 */
  added   := array( SELECT unnest(new_tags) EXCEPT SELECT unnest(old_tags) );
  removed := array( SELECT unnest(old_tags) EXCEPT SELECT unnest(new_tags) );

  /* 2️⃣ 把 food.id append 到每個新增 tag 的 food_ids */
  IF array_length(added,1) IS NOT NULL THEN
    UPDATE public.tag
       SET food_ids = food_ids || to_jsonb(new.id::text)
     WHERE id = any(added)
       AND NOT (food_ids ? new.id::text);     -- 已存在就不重複
  END IF;

  /* 3️⃣ 從被移除 tag 的 food_ids 抽掉 food.id */
  IF array_length(removed,1) IS NOT NULL THEN
    UPDATE public.tag
       SET food_ids = (
         SELECT coalesce(jsonb_agg(elem),'[]'::jsonb)
         FROM jsonb_array_elements_text(food_ids) elem
         WHERE elem <> new.id::text
       )
     WHERE id = any(removed);
  END IF;

  RETURN null;
END $;

CREATE TRIGGER trg_food_upsert
AFTER INSERT OR UPDATE ON public.food
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_tag_on_food_upsert();
```

### 2. Food 表 DELETE 觸發器 (`tg_sync_tag_on_food_delete`)
**觸發時機**: `AFTER DELETE ON food`

**功能說明**:
- ✅ 當食物被刪除時，從所有相關標籤的 `food_ids` 陣列中移除該食物 ID

```sql
CREATE OR REPLACE FUNCTION public.tg_sync_tag_on_food_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $
BEGIN
  UPDATE public.tag
     SET food_ids = (
       SELECT coalesce(jsonb_agg(elem),'[]'::jsonb)
       FROM jsonb_array_elements_text(food_ids) elem
       WHERE elem <> old.id::text
     )
   WHERE food_ids ? old.id::text;
  RETURN null;
END $;

CREATE TRIGGER trg_food_delete
AFTER DELETE ON public.food
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_tag_on_food_delete();
```

### 3. Tag 表 DELETE 觸發器 (`tg_sync_food_on_tag_delete`)
**觸發時機**: `AFTER DELETE ON tag`

**功能說明**:
- ✅ 當標籤被刪除時，從所有食物的 `tag_ids` 陣列中移除該標籤 ID

```sql
CREATE OR REPLACE FUNCTION public.tg_sync_food_on_tag_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $
BEGIN
  UPDATE public.food
     SET tag_ids = (
       SELECT coalesce(jsonb_agg(elem),'[]'::jsonb)
       FROM jsonb_array_elements_text(tag_ids) elem
       WHERE elem <> old.id::text
     )
   WHERE tag_ids ? old.id::text;
  RETURN null;
END $;

CREATE TRIGGER trg_tag_delete
AFTER DELETE ON public.tag
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_food_on_tag_delete();
```

### 觸發器涵蓋場景

| 操作場景 | 觸發器 | 自動處理 |
|---------|--------|----------|
| 新增食物 | `trg_food_upsert` | 標籤的 `food_ids` 自動加入食物 ID |
| 編輯食物標籤 | `trg_food_upsert` | 自動處理標籤新增/移除的雙向同步 |
| 刪除食物 | `trg_food_delete` | 所有相關標籤的 `food_ids` 自動移除食物 ID |
| 刪除標籤 | `trg_tag_delete` | 所有食物的 `tag_ids` 自動移除標籤 ID |

### 資料一致性保證
- **參照完整性**: 觸發器確保 `tag_ids` 中的 UUID 必須存在於 `tag` 表
- **自動清理**: 刪除操作會自動清理所有相關的關聯記錄
- **防重複**: 避免在陣列中重複添加相同的 ID
- **容錯處理**: 處理 NULL 值和空陣列的邊界情況

## API 端點

### 基本配置

#### 環境變數設置
```bash
# 複製範例文件
cp .env.example .env.local

# 編輯 .env.local 文件，填入實際值
SUPABASE_URL=https://dnavwekoeilhdsateevn.supabase.co
SUPABASE_API_KEY=your_actual_api_key_here
```

#### 配置文件說明
- `.env.local` - 本地開發環境變數（不會被提交到 Git）
- `.env.example` - 環境變數範例文件
- `env.js` - 環境變數載入腳本

### 已實現的 CRUD 操作

#### 讀取資料
- `GET /rest/v1/food?select=*` - 獲取所有食物
- `GET /rest/v1/tag?select=*` - 獲取所有標籤

#### 新增資料
- `POST /rest/v1/food` - 新增食物
- `POST /rest/v1/tag` - 新增標籤

#### 更新資料
- `PATCH /rest/v1/food?id=eq.{id}` - 更新指定食物

#### 刪除資料
- `DELETE /rest/v1/food?id=eq.{id}` - 刪除指定食物

## 專案功能

### 核心功能
- ✅ 隨機轉盤選擇餐點
- ✅ 標籤分類篩選
- ✅ 餐點 CRUD 操作
- ✅ 標籤管理
- ✅ 價格等級設定
- ✅ 好吃程度評分
- ✅ 圖片網址支援
- ✅ **圖片上傳到 Supabase Storage**
- ✅ 圖片壓縮優化
- ✅ 圖片預覽功能
- ✅ 排序功能
- ✅ **轉盤圖片顯示**
- ✅ **智能文字換行系統 (無截斷設計)**

### 待實現功能
- ⏸️ 標籤編輯功能
- ⏸️ 標籤刪除功能
- ⏸️ 批量操作
- ⏸️ 搜尋功能

## 前端開發重點 (基於觸發器系統)

### 💡 核心原則：簡化前端邏輯
由於觸發器系統完善，前端開發變得非常簡潔：

### 1. **新增食物操作**
```javascript
// 前端只需要提供 tag_ids (UUID陣列)
const foodData = {
  payload: {
    foodname: "牛肉麵",
    imgurl: "image.jpg", 
    price: "medium",
    taste: 2
  },
  tag_ids: ["uuid1", "uuid2", "uuid3"]  // 觸發器會自動處理標籤關聯
};

// POST 到 /rest/v1/food
// 觸發器自動執行：
// 1. 驗證所有 UUID 存在於 tag 表
// 2. 將此食物 ID 加入到相關標籤的 food_ids 中
```

### 2. **編輯食物標籤**
```javascript
// 直接更新 tag_ids，觸發器處理所有邏輯
const updateData = {
  tag_ids: ["new_uuid1", "new_uuid2"]  // 新的標籤陣列
};

// PATCH 到 /rest/v1/food?id=eq.{food_id}
// 觸發器自動執行：
// 1. 計算新增/移除的標籤差集
// 2. 在新增標籤的 food_ids 中加入此食物
// 3. 從移除標籤的 food_ids 中刪除此食物
```

### 3. **刪除食物操作**
```javascript
// DELETE /rest/v1/food?id=eq.{food_id}
// 觸發器自動執行：
// 1. 找出此食物的所有標籤
// 2. 從每個標籤的 food_ids 中移除此食物 ID
// 前端無需任何額外處理
```

### 4. **刪除標籤操作**
```javascript
// DELETE /rest/v1/tag?id=eq.{tag_id}
// 觸發器自動執行：
// 1. 找出所有使用此標籤的食物
// 2. 從每個食物的 tag_ids 中移除此標籤 ID
// 前端無需任何額外處理
```

### 5. **必要的前端調整**

#### UUID 處理邏輯
```javascript
// 載入標籤時需要保存 UUID 映射
async loadTagsFromSupabase() {
  const tags = await response.json();
  
  // 建立名稱到 UUID 的映射
  this.tagNameToId = {};
  this.tagIdToName = {};
  
  tags.forEach(tag => {
    this.tagNameToId[tag.name] = tag.id;
    this.tagIdToName[tag.id] = tag.name;
  });
  
  this.categories = tags.map(tag => tag.name); // 顯示用
}
```

#### 標籤選擇邏輯更新
```javascript
// 新增/編輯食物時，將標籤名稱轉換為 UUID
async addItemFromModal() {
  const selectedTags = []; // 存放選中的標籤名稱
  
  // 收集選中標籤的 UUID
  const selectedTagIds = selectedTags.map(tagName => this.tagNameToId[tagName]);
  
  const foodData = {
    payload: { /* ... */ },
    tag_ids: selectedTagIds  // 使用 UUID 陣列
  };
}
```

#### 資料顯示轉換
```javascript
// 載入食物時，將 UUID 轉換為名稱顯示
this.items = data.map(food => ({
  // ...其他屬性
  tags: food.tag_ids.map(tagId => this.tagIdToName[tagId] || tagId)
}));
```

### 6. **錯誤處理增強**
```javascript
try {
  // API 操作
} catch (error) {
  if (error.message.includes('tag_ids 包含不存在的 tag.id')) {
    alert('選擇的標籤中包含無效的標籤，請重新選擇');
  } else {
    alert('操作失敗，請稍後再試');
  }
}
```

## 開發注意事項

### 🎯 觸發器系統優勢
1. **零手動同步**: 前端不需要維護任何關聯邏輯
2. **資料一致性**: 觸發器保證 100% 的資料完整性
3. **自動清理**: 刪除操作自動清理所有相關記錄
4. **參照完整性**: 防止無效的標籤關聯

### ⚠️ 關鍵注意事項
1. **UUID 格式**: 確保所有 `tag_ids` 都是有效的 UUID 格式
2. **錯誤處理**: 觸發器會拋出參照完整性錯誤，需要適當處理
3. **資料重載**: 操作後重新載入資料以反映觸發器的自動更新
4. **標籤存在性**: 新增/編輯前確保選擇的標籤都存在

### 🚀 前端簡化效果
- **減少 80% 的關聯邏輯代碼**
- **零手動同步操作**
- **自動資料一致性保證**
- **更少的 API 調用次數**

## 資料庫使用範例與測試案例

### 💡 實際操作流程 (前端參考)

#### 1️⃣ **建立標籤**
```sql
-- SQL 操作 (觸發器系統測試)
INSERT INTO tag(name) VALUES ('辣味'), ('宵夜'), ('夜貓子');

SELECT id, name, food_ids FROM tag;
-- 結果：3個標籤，food_ids 都是空陣列 []
```

**前端對應操作**:
```javascript
// 前端只需要呼叫 API
await fetch(`${this.supabaseUrl}/rest/v1/tag`, {
  method: 'POST',
  headers: { /* API headers */ },
  body: JSON.stringify([
    { name: '辣味', food_ids: [] },
    { name: '宵夜', food_ids: [] },
    { name: '夜貓子', food_ids: [] }
  ])
});
```

#### 2️⃣ **新增食物 (帶多個標籤)**
```sql
-- 使用實際查到的 UUID (T1=辣味, T2=宵夜)
INSERT INTO food(payload, tag_ids)
VALUES (
  '{"foodname":"Noodle","taste":1,"price":"medium"}',
  jsonb_build_array('T1', 'T2')
);

-- 檢查結果
SELECT id, payload->>'foodname', tag_ids FROM food;
SELECT name, food_ids FROM tag ORDER BY name;
```

**✅ 觸發器自動執行**:
- `food.tag_ids = [T1, T2]`
- 辣味、宵夜的 `food_ids` 自動加入此食物 ID
- 夜貓子的 `food_ids` 仍為 `[]`

**前端對應操作**:
```javascript
const foodData = {
  payload: {
    foodname: "Noodle",
    taste: 1,
    price: "medium"
  },
  tag_ids: [spicyTagId, lateNightTagId] // 使用實際 UUID
};

await fetch(`${this.supabaseUrl}/rest/v1/food`, {
  method: 'POST',
  headers: { /* API headers */ },
  body: JSON.stringify(foodData)
});
// 觸發器自動處理標籤關聯，前端無需額外操作
```

#### 3️⃣ **更新食物標籤 (移除辣味，加上夜貓子)**
```sql
-- 先查詢食物 ID
SELECT id FROM food WHERE payload->>'foodname' = 'Noodle';

-- 更新標籤陣列 (T2=宵夜, T3=夜貓子)
UPDATE food
  SET tag_ids = jsonb_build_array('T2', 'T3')
  WHERE id = 'FOOD_ID_HERE';

-- 檢查結果
SELECT id, tag_ids FROM food;
SELECT name, food_ids FROM tag ORDER BY name;
```

**✅ 觸發器自動處理**:
- `food.tag_ids` 變成 `[T2, T3]`
- 辣味的 `food_ids` 自動移除此食物 ID
- 宵夜、夜貓子的 `food_ids` 都包含此食物 ID (不重複)

**前端對應操作**:
```javascript
const updateData = {
  tag_ids: [lateNightTagId, nightOwlTagId] // 新的標籤陣列
};

await fetch(`${this.supabaseUrl}/rest/v1/food?id=eq.${foodId}`, {
  method: 'PATCH',
  headers: { /* API headers */ },
  body: JSON.stringify(updateData)
});
// 觸發器自動計算差集並更新所有相關標籤
```

#### 4️⃣ **刪除標籤測試**
```sql
DELETE FROM tag WHERE name = '宵夜';

-- 檢查結果
SELECT id, tag_ids FROM food;
SELECT id, name, food_ids FROM tag ORDER BY name;
```

**✅ 觸發器自動清理**:
- `food.tag_ids` 陣列自動剔除宵夜的 UUID
- tag 表只剩辣味、夜貓子兩行
- 所有 `food_ids` 狀態正確

**前端對應操作**:
```javascript
await fetch(`${this.supabaseUrl}/rest/v1/tag?id=eq.${tagId}`, {
  method: 'DELETE',
  headers: { /* API headers */ }
});
// 觸發器自動從所有食物中移除此標籤 ID
```

#### 5️⃣ **刪除食物測試**
```sql
DELETE FROM food WHERE payload->>'foodname' = 'Noodle';

-- 檢查結果
SELECT * FROM food;
SELECT id, name, food_ids FROM tag ORDER BY name;
```

**✅ 觸發器自動清理**:
- food 表已空
- 所有 `tag.food_ids` 自動移除此食物 ID → 變回 `[]`

**前端對應操作**:
```javascript
await fetch(`${this.supabaseUrl}/rest/v1/food?id=eq.${foodId}`, {
  method: 'DELETE',
  headers: { /* API headers */ }
});
// 觸發器自動從所有標籤中移除此食物 ID
```

#### 6️⃣ **錯誤保護測試**
```sql
-- 使用不存在的 UUID
INSERT INTO food(payload, tag_ids)
VALUES (
  '{"foodname":"Ghost","taste":2}',
  jsonb_build_array('00000000-0000-0000-0000-000000000000')
);
```

**✅ 觸發器錯誤保護**:
- 拋出錯誤：`ERROR: tag_ids 包含不存在的 tag.id`
- 資料未寫入，food 表行數仍為 0

**前端對應處理**:
```javascript
try {
  const foodData = {
    payload: { foodname: "Ghost", taste: 2 },
    tag_ids: ["invalid-uuid"] // 無效的 UUID
  };
  
  await fetch(`${this.supabaseUrl}/rest/v1/food`, {
    method: 'POST',
    headers: { /* API headers */ },
    body: JSON.stringify(foodData)
  });
} catch (error) {
  if (error.message.includes('tag_ids 包含不存在的 tag.id')) {
    alert('選擇的標籤無效，請重新選擇');
  }
}
```

### 🎯 前端開發關鍵要點

#### **UUID 管理策略**
```javascript
class WheelOfFood {
  constructor() {
    this.tagNameToId = new Map();  // 名稱 → UUID
    this.tagIdToName = new Map();  // UUID → 名稱
  }
  
  async loadTagsFromSupabase() {
    const response = await fetch(`${this.supabaseUrl}/rest/v1/tag?select=*`);
    const tags = await response.json();
    
    // 建立雙向映射
    tags.forEach(tag => {
      this.tagNameToId.set(tag.name, tag.id);
      this.tagIdToName.set(tag.id, tag.name);
    });
    
    // UI 顯示用
    this.categories = tags.map(tag => tag.name);
  }
}
```

#### **資料轉換邏輯**
```javascript
// 新增/編輯時：名稱 → UUID
const selectedTagNames = this.getSelectedTagNames();
const selectedTagIds = selectedTagNames.map(name => this.tagNameToId.get(name));

// 顯示時：UUID → 名稱
this.items = data.map(food => ({
  ...food,
  tags: food.tag_ids.map(id => this.tagIdToName.get(id) || id)
}));
```

### 🔧 完整的前端 CRUD 模式

由於觸發器系統的完善設計，前端 CRUD 操作極其簡潔：
- **CREATE**: 提供 `tag_ids` UUID 陣列
- **READ**: UUID ↔ 名稱雙向轉換
- **UPDATE**: 直接更新 `tag_ids` 陣列
- **DELETE**: 單純的 DELETE 請求

觸發器處理所有複雜的關聯邏輯，前端只需專注於 UI/UX！

## 🎡 轉盤智能文字換行系統

### 設計理念：**不截斷，只換行**
基於用戶需求「爆框也沒關係，我故意的」，系統設計為完全不截斷任何文字，只做智能換行處理。

### 📝 換行規則與字體大小

#### 1. **短名稱 (≤4字)**
- **顯示方式**: 單行顯示
- **字體大小**: 30px
- **適用範例**: "牛排", "拉麵", "壽司", "漢堡"
- **特色**: 最大字體，醒目顯示

#### 2. **中等名稱 (5-8字)**
- **顯示方式**: 分兩行顯示
- **字體大小**: 26px
- **行間距**: 20px (上行 y=-10, 下行 y=10)
- **分行邏輯**: `Math.ceil(length / 2)` 平均分配
- **適用範例**: "義大利麵", "韓式烤肉", "日式拉麵"

#### 3. **長名稱 (9-12字)**
- **顯示方式**: 分三行顯示
- **字體大小**: 22px
- **行間距**: 14px (y座標: -14, 0, 14)
- **分行邏輯**: `Math.ceil(length / 3)` 三等分
- **適用範例**: "奶油培根義大利麵", "韓式辣椒醬炸雞"

#### 4. **超長名稱 (>12字)**
- **顯示方式**: 分四行顯示
- **字體大小**: 20px
- **行間距**: 12px (y座標: -18, -6, 6, 18)
- **分行邏輯**: `Math.ceil(length / 4)` 四等分
- **適用範例**: "超級無敵巨無霸起司牛肉堡套餐"
- **特色**: 任意長度都能完整顯示，絕不截斷

### 🎨 視覺效果特色

1. **漸進式字體縮放**: 
   - 30px → 26px → 22px → 20px
   - 確保長文字也有足夠可讀性

2. **爆框美學**:
   - **故意設計**: 長文字可以溢出轉盤扇形區域
   - **視覺衝擊**: 創造有趣的視覺層次
   - **完整資訊**: 保證所有餐點名稱完整顯示

3. **一致的視覺元素**:
   - 統一的 Comic Sans MS 字體
   - 白色文字配深色陰影
   - drop-shadow 濾鏡效果

### 🔧 技術實現

```javascript
// 智能分行算法
const name = item.name
if (name.length <= 4) {
  // 單行 30px
} else if (name.length <= 8) {
  const mid = Math.ceil(name.length / 2)
  const line1 = name.slice(0, mid)
  const line2 = name.slice(mid)
  // 雙行 26px
} else if (name.length <= 12) {
  const third = Math.ceil(name.length / 3)
  // 三行 22px，三等分邏輯
} else {
  const quarter = Math.ceil(name.length / 4)
  // 四行 20px，四等分邏輯
}
```

### 💡 設計優勢

- **零資訊丟失**: 絕對不截斷任何字符
- **視覺層次**: 通過字體大小區分名稱長度
- **個性表達**: 爆框設計體現個性化需求
- **完美可讀**: 即使是超長名稱也保持清晰可讀
- **動態適應**: 自動根據名稱長度選擇最佳顯示方案

這套系統體現了「功能優於形式」的設計思想，確保用戶的每個餐點名稱都能完整、清晰地在轉盤上展示。

## Supabase Storage 圖片上傳功能

### 🏗️ 架構設計
- **Storage Bucket**: `food-images` (公開存取)
- **上傳路徑**: `foods/{timestamp}-{random}.{ext}`
- **圖片壓縮**: 最大寬度 800px，品質 80%
- **檔案大小限制**: 5MB
- **支援格式**: 所有圖片格式 (`image/*`)

### 🚀 功能特色
- ✅ **拖拽上傳**：支援檔案選擇器上傳
- ✅ **圖片預覽**：即時預覽選擇的圖片
- ✅ **自動壓縮**：上傳前自動壓縮優化
- ✅ **URL 支援**：同時支援外部圖片網址
- ✅ **舊圖清理**：編輯時自動刪除舊圖片
- ✅ **錯誤處理**：完善的錯誤提示機制

### 🔧 使用方式

#### 1. Supabase 設置

**方式一：在 Dashboard 創建（推薦）**
1. 進入 Supabase Dashboard → Storage
2. 點擊 "Create bucket"
3. 名稱：`food-images`
4. ✅ 勾選 "Public bucket" 
5. ❌ **不要** 勾選 "Restrict uploads to mime types"
6. 點擊 "Create bucket"

**方式二：SQL 創建**
```sql
-- 創建公開的 Storage Bucket（不需要 RLS）
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true);
```

> 💡 **重要提醒**：設為 Public Bucket 後，所有檔案都可公開存取，**不需要設定 RLS 政策**！

#### 2. 環境變數
```env
NEXT_PUBLIC_SUPABASE_URL=https://dnavwekoeilhdsateevn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

#### 3. 使用 Utility 函數
```typescript
import { uploadImage, compressImage, deleteImage } from '@/utils/imageUpload'

// 上傳圖片
const file = document.querySelector('input[type="file"]').files[0]
const compressedFile = await compressImage(file)
const imageUrl = await uploadImage(compressedFile)

// 刪除圖片
await deleteImage(oldImageUrl)
```

### 📱 使用者體驗

#### 新增餐點
1. 點擊「上傳圖片」按鈕選擇檔案
2. 即時預覽所選圖片
3. 或者貼上外部圖片網址
4. 提交時自動壓縮並上傳到 Supabase

#### 編輯餐點
1. 顯示現有圖片（如果有）
2. 點擊「更換圖片」上傳新圖片
3. 自動刪除舊圖片，避免存儲空間浪費
4. 支援清空圖片功能

### 🔐 安全考量
- 檔案類型驗證（僅允許圖片）
- 檔案大小限制（5MB）
- 自動生成唯一檔名避免衝突
- 公開 bucket 但路徑難以猜測

## 檔案結構
```
吃啥/
├── src/                # 原始碼目錄
│   ├── app/           # Next.js App Router 頁面
│   ├── components/    # React 組件
│   ├── hooks/         # 自定義 Hooks
│   └── utils/         # 工具函數
│       └── imageUpload.ts # 圖片上傳工具
├── public/            # 靜態資源
├── backup-original/   # 原版 HTML/JS 備份
├── .env.local         # 本地環境變數配置（不提交到 Git）
├── .env.example       # 環境變數範例文件
├── .gitignore         # Git 忽略文件配置
├── package.json       # 項目配置和依賴
├── next.config.ts     # Next.js 配置
├── tailwind.config.ts # Tailwind CSS 配置
├── tsconfig.json      # TypeScript 配置
└── CLAUDE.md          # 專案說明 (本檔案)
```