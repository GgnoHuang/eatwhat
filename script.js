class WheelOfFood {
    constructor() {
        this.items = [];
        this.categories = [];
        this.currentCategory = 'all';
        this.isSpinning = false;
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        
        // 從環境變數讀取配置
        this.supabaseUrl = window.ENV?.SUPABASE_URL;
        this.supabaseKey = window.ENV?.SUPABASE_API_KEY;
        
        if (!this.supabaseUrl || !this.supabaseKey) {
            console.error('缺少必要的環境變數配置');
        }
        
        // UUID 雙向映射管理
        this.tagNameToId = new Map();
        this.tagIdToName = new Map();
        this.tagData = new Map(); // 完整標籤資料
        
        this.initializeElements();
        this.bindEvents();
        this.loadFromSupabase();
    }
    
    initializeElements() {
        this.wheel = document.getElementById('wheel');
        this.spinBtn = document.getElementById('spinBtn');
        this.result = document.getElementById('result');
        this.addItemModal = document.getElementById('addItemModal');
        this.modalItemName = document.getElementById('modalItemName');
        this.modalItemImage = document.getElementById('modalItemImage');
        this.modalTagsCheckboxes = document.getElementById('modalTagsCheckboxes');
        this.modalAddBtn = document.getElementById('modalAddBtn');
        this.closeAddItemBtn = document.getElementById('closeAddItemBtn');
        this.editItemModal = document.getElementById('editItemModal');
        this.editItemName = document.getElementById('editItemName');
        this.editItemImage = document.getElementById('editItemImage');
        this.editTagsCheckboxes = document.getElementById('editTagsCheckboxes');
        this.editSaveBtn = document.getElementById('editSaveBtn');
        this.editDeleteBtn = document.getElementById('editDeleteBtn');
        this.closeEditItemBtn = document.getElementById('closeEditItemBtn');
        this.itemsList = document.getElementById('itemsList');
        this.sortBySelect = document.getElementById('sortBy');
        this.sortOrderBtn = document.getElementById('sortOrder');
        this.categoryButtons = document.getElementById('categoryButtons');
        this.categoryModal = document.getElementById('categoryModal');
        this.newCategoryName = document.getElementById('newCategoryName');
        this.addCategoryBtn = document.getElementById('addCategoryBtn');
        this.categoriesList = document.getElementById('categoriesList');
        this.closeCategoryManagementBtn = document.getElementById('closeCategoryManagementBtn');
        this.currentEditingIndex = -1;
        
        // 性能優化相關
        this.loadingElement = null;
        this.debounceTimeout = null;
    }
    
    bindEvents() {
        this.spinBtn.addEventListener('click', () => this.spin());
        this.modalAddBtn.addEventListener('click', () => this.addItemFromModal());
        this.closeAddItemBtn.addEventListener('click', () => this.hideAddItemModal());
        this.modalItemName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItemFromModal();
        });
        
        // 編輯餐點彈窗事件
        this.editSaveBtn.addEventListener('click', () => this.saveEditItemFromModal());
        this.editDeleteBtn.addEventListener('click', () => this.deleteItemFromModal());
        this.closeEditItemBtn.addEventListener('click', () => this.hideEditItemModal());
        this.editItemName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEditItemFromModal();
        });
        
        // 分類管理事件將通過動態添加的按鈕處理
        this.closeCategoryManagementBtn.addEventListener('click', () => this.hideCategoryModal());
        
        // 點擊彈窗背景關閉
        this.categoryModal.addEventListener('click', (e) => {
            if (e.target === this.categoryModal) {
                this.hideCategoryModal();
            }
        });
        
        this.addItemModal.addEventListener('click', (e) => {
            if (e.target === this.addItemModal) {
                this.hideAddItemModal();
            }
        });
        
        this.editItemModal.addEventListener('click', (e) => {
            if (e.target === this.editItemModal) {
                this.hideEditItemModal();
            }
        });
        
        // ESC 鍵關閉彈窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.categoryModal.style.display === 'flex') {
                    this.hideCategoryModal();
                }
                if (this.addItemModal.style.display === 'flex') {
                    this.hideAddItemModal();
                }
                if (this.editItemModal.style.display === 'flex') {
                    this.hideEditItemModal();
                }
            }
        });
        this.addCategoryBtn.addEventListener('click', () => this.addCategory());
        this.newCategoryName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCategory();
        });
        
        // 排序控件事件
        this.sortBySelect.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.updateItemsList();
        });
        
        this.sortOrderBtn.addEventListener('click', () => {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            this.sortOrderBtn.textContent = this.sortOrder === 'asc' ? '↑' : '↓';
            this.sortOrderBtn.dataset.order = this.sortOrder;
            this.updateItemsList();
        });
    }
    
    getFilteredItems() {
        if (this.currentCategory === 'all') {
            return this.items;
        }
        return this.items.filter(item => item.tags && item.tags.includes(this.currentCategory));
    }
    
    updateWheel() {
        const filteredItems = this.getFilteredItems();
        
        if (filteredItems.length === 0) {
            this.wheel.innerHTML = '<div class="no-items">沒有餐點</div>';
            return;
        }
        
        const colors = [
            '#7c9fb3', '#a0aec0', '#b8c4d0', '#9bb0c4',
            '#87a3b8', '#6b8a9e', '#8ea8bb', '#759097',
            '#a5b8c7', '#94a9bc', '#6f8a9d', '#8ba4b7'
        ];
        
        // 創建 SVG 轉盤
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 300 300');
        
        const centerX = 150;
        const centerY = 150;
        const radius = 140;
        const itemAngle = 360 / filteredItems.length;
        
        console.log('轉盤結構：');
        filteredItems.forEach((item, index) => {
            const startAngle = index * itemAngle;
            const endAngle = startAngle + itemAngle;
            const centerAngle = startAngle + itemAngle / 2;
            
            console.log(`${item.name}: 起始=${startAngle.toFixed(1)}° 結束=${endAngle.toFixed(1)}° 中心=${centerAngle.toFixed(1)}° (調整後中心=${(centerAngle-90).toFixed(1)}°)`);
            
            // 轉換為弧度
            const startRadians = (startAngle - 90) * Math.PI / 180;
            const endRadians = (endAngle - 90) * Math.PI / 180;
            
            // 計算弧形路徑點
            const x1 = centerX + radius * Math.cos(startRadians);
            const y1 = centerY + radius * Math.sin(startRadians);
            const x2 = centerX + radius * Math.cos(endRadians);
            const y2 = centerY + radius * Math.sin(endRadians);
            
            const largeArcFlag = itemAngle > 180 ? 1 : 0;
            
            // 創建扇形路徑
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            path.setAttribute('d', pathData);
            path.setAttribute('fill', colors[index % colors.length]);
            path.setAttribute('stroke', '#fff');
            path.setAttribute('stroke-width', '2');
            
            svg.appendChild(path);
            
            // 添加文字
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            const textAngle = startAngle + itemAngle / 2;
            const textRadius = radius * 0.6;
            const textRadians = (textAngle - 90) * Math.PI / 180;
            const textX = centerX + textRadius * Math.cos(textRadians);
            const textY = centerY + textRadius * Math.sin(textRadians);
            
            text.setAttribute('x', textX);
            text.setAttribute('y', textY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', this.getContrastColor(colors[index % colors.length]));
            text.setAttribute('font-size', '14');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('transform', `rotate(${textAngle}, ${textX}, ${textY})`);
            text.textContent = item.name;
            
            svg.appendChild(text);
        });
        
        this.wheel.innerHTML = '';
        this.wheel.appendChild(svg);
    }
    
    getContrastColor(hexcolor) {
        // 移除 # 符號
        hexcolor = hexcolor.replace('#', '');
        
        // 轉換為 RGB
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);
        
        // 計算亮度
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        
        return brightness > 128 ? '#000000' : '#FFFFFF';
    }
    
    spin() {
        const filteredItems = this.getFilteredItems();
        
        if (filteredItems.length === 0) {
            alert('請先新增餐點！');
            return;
        }
        
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.spinBtn.textContent = '轉轉中...';
        this.result.textContent = '';
        
        // 生成隨機的最終角度
        const spins = 3 + Math.random() * 3; // 3-6圈
        const randomFinalAngle = spins * 360 + Math.random() * 360;
        
        // 先暫時移除 transition 來重置位置
        this.wheel.style.transition = 'none';
        this.wheel.style.transform = 'rotate(0deg)';
        
        // 強制重新繪製
        this.wheel.offsetHeight;
        
        // 恢復 transition
        this.wheel.style.transition = 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        const itemAngle = 360 / filteredItems.length;
        const finalAngle = randomFinalAngle;
        
        // 應用轉換
        setTimeout(() => {
            this.wheel.style.transform = `rotate(${finalAngle}deg)`;
        }, 10);
        
        // 4秒後顯示結果
        setTimeout(() => {
            // 計算轉盤停止後實際指向的項目
            const finalAngleNormalized = finalAngle % 360;
            
            // 正確的角度計算：
            // 1. 轉盤生成時從-90度開始，第一個項目在12點鐘方向（0度視覺位置）
            // 2. 指針固定在12點方向
            // 3. 轉盤順時針旋轉了finalAngleNormalized度
            // 4. 指針相對轉盤的角度 = -轉盤旋轉角度
            
            // 計算指針相對於轉盤的角度
            let pointerRelativeAngle = (-finalAngleNormalized + 360) % 360;
            
            // 根據相對角度計算指向哪個項目
            const actualPointingIndex = Math.floor(pointerRelativeAngle / itemAngle) % filteredItems.length;
            const actualPointingItem = filteredItems[actualPointingIndex];
            
            // 顯示實際指向的項目
            this.result.textContent = `🎉 ${actualPointingItem.name}`;
            this.result.style.color = '#7c9fb3';
            
            // 調試信息
            console.log(`最終角度: ${finalAngle.toFixed(2)}度`);
            console.log(`正規化最終角度: ${finalAngleNormalized.toFixed(2)}度`);
            console.log(`指針相對角度: ${pointerRelativeAngle.toFixed(2)}度`);
            console.log(`每個項目角度: ${itemAngle.toFixed(2)}度`);
            console.log(`計算索引: ${actualPointingIndex}`);
            console.log(`實際指向項目: ${actualPointingItem.name}`);
            console.log('---');
            
            this.isSpinning = false;
            this.spinBtn.disabled = false;
            this.spinBtn.textContent = '開始轉轉';
        }, 4000);
    }
    
    showAddItemModal() {
        this.addItemModal.style.display = 'flex';
        this.updateModalTagsCheckboxes();
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            this.modalItemName.focus();
        }, 300);
    }
    
    hideAddItemModal() {
        this.addItemModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.modalItemName.value = '';
        this.modalItemImage.value = '';
        // 清除所有勾選
        const checkboxes = this.modalTagsCheckboxes.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = false;
            cb.parentElement.classList.remove('selected');
        });
        // 重置價格選擇為 $
        const priceOptions = this.addItemModal.querySelectorAll('.price-option');
        priceOptions.forEach(option => option.classList.remove('selected'));
        const firstPriceRadio = this.addItemModal.querySelector('input[name="modal-price"][value="$"]');
        if (firstPriceRadio) {
            firstPriceRadio.checked = true;
            firstPriceRadio.parentElement.classList.add('selected');
        }
        
        // 重置好吃程度選擇為 ok
        const tasteOptions = this.addItemModal.querySelectorAll('.taste-option');
        tasteOptions.forEach(option => option.classList.remove('selected'));
        const firstTasteRadio = this.addItemModal.querySelector('input[name="modal-taste"][value="ok"]');
        if (firstTasteRadio) {
            firstTasteRadio.checked = true;
            firstTasteRadio.parentElement.classList.add('selected');
        }
    }
    
    setupPriceSelectors() {
        // 為新增餐點彈窗的價格選擇器添加事件監聽
        const modalPriceOptions = this.addItemModal.querySelectorAll('input[name="modal-price"]');
        modalPriceOptions.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const priceOptions = this.addItemModal.querySelectorAll('.price-option');
                priceOptions.forEach(option => option.classList.remove('selected'));
                e.target.parentElement.classList.add('selected');
            });
        });
        
        // 為新增餐點彈窗的好吃程度選擇器添加事件監聽
        const modalTasteOptions = this.addItemModal.querySelectorAll('input[name="modal-taste"]');
        modalTasteOptions.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const tasteOptions = this.addItemModal.querySelectorAll('.taste-option');
                tasteOptions.forEach(option => option.classList.remove('selected'));
                e.target.parentElement.classList.add('selected');
            });
        });

        // 為編輯餐點彈窗的價格選擇器添加事件監聽
        const editPriceOptions = this.editItemModal.querySelectorAll('input[name="edit-price"]');
        editPriceOptions.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const priceOptions = this.editItemModal.querySelectorAll('.price-option');
                priceOptions.forEach(option => option.classList.remove('selected'));
                e.target.parentElement.classList.add('selected');
            });
        });
        
        // 為編輯餐點彈窗的好吃程度選擇器添加事件監聽
        const editTasteOptions = this.editItemModal.querySelectorAll('input[name="edit-taste"]');
        editTasteOptions.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const tasteOptions = this.editItemModal.querySelectorAll('.taste-option');
                tasteOptions.forEach(option => option.classList.remove('selected'));
                e.target.parentElement.classList.add('selected');
            });
        });
    }

    async addItemFromModal() {
        const name = this.modalItemName.value.trim();
        const imageUrl = this.modalItemImage.value.trim();
        const selectedTags = [];
        
        // 收集選中的標籤名稱
        const checkboxes = this.modalTagsCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            selectedTags.push(cb.value); // 這裡是標籤名稱
        });
        
        // 轉換為 UUID
        const selectedTagIds = selectedTags.map(tagName => this.tagNameToId.get(tagName)).filter(id => id);
        
        // 收集選中的價格和好吃程度
        const selectedPriceRadio = this.addItemModal.querySelector('input[name="modal-price"]:checked');
        const selectedTasteRadio = this.addItemModal.querySelector('input[name="modal-taste"]:checked');
        const selectedPrice = selectedPriceRadio ? selectedPriceRadio.value : '$';
        const selectedTaste = selectedTasteRadio ? selectedTasteRadio.value : 'ok';
        
        if (!name) {
            alert('請輸入餐點名稱！');
            return;
        }
        
        if (selectedTagIds.length === 0) {
            alert('請至少選擇一個標籤！');
            return;
        }
        
        // 檢查是否已存在
        if (this.items.some(item => item.name === name)) {
            alert('這個餐點已經存在了！');
            return;
        }
        
        try {
            // 顯示加載指示器
            this.showLoading(true);
            
            // 轉換價格格式
            let priceValue;
            switch(selectedPrice) {
                case '$': priceValue = 'low'; break;
                case '$$': priceValue = 'medium'; break;
                case '$$$': priceValue = 'high'; break;
                default: priceValue = 'low';
            }
            
            // 轉換好吃程度
            let tasteValue;
            switch(selectedTaste) {
                case '🩷': tasteValue = 1; break;
                case '🩷🩷': tasteValue = 2; break;
                case '🩷🩷🩷': tasteValue = 3; break;
                default: tasteValue = 1;
            }

            const foodData = {
                payload: {
                    foodname: name,
                    imgurl: imageUrl || null,
                    price: priceValue,
                    taste: tasteValue
                },
                tag_ids: selectedTagIds
            };

            const response = await fetch(`${this.supabaseUrl}/rest/v1/food`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(foodData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 重新載入數據
            await this.loadFromSupabase();
            this.hideAddItemModal();

        } catch (error) {
            console.error('新增餐點失敗:', error);
            alert('新增餐點失敗，請稍後再試');
        } finally {
            this.showLoading(false);
        }
    }
    
    
    getSortedItems() {
        const sortedItems = [...this.items];
        
        sortedItems.sort((a, b) => {
            let comparison = 0;
            
            switch (this.sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name, 'zh-TW');
                    break;
                case 'date':
                    comparison = (a.dateAdded || 0) - (b.dateAdded || 0);
                    break;
                case 'tags':
                    comparison = (a.tags?.length || 0) - (b.tags?.length || 0);
                    break;
                case 'price':
                    // 價格排序：$ < $$ < $$$
                    const priceOrder = { '$': 1, '$$': 2, '$$$': 3 };
                    const priceA = priceOrder[a.price || '$'] || 1;
                    const priceB = priceOrder[b.price || '$'] || 1;
                    comparison = priceA - priceB;
                    break;
                case 'taste':
                    // 好吃程度排序：🩷 < 🩷🩷 < 🩷🩷🩷
                    const tasteOrder = { '🩷': 1, '🩷🩷': 2, '🩷🩷🩷': 3 };
                    const tasteA = tasteOrder[a.taste || '🩷'] || 1;
                    const tasteB = tasteOrder[b.taste || '🩷'] || 1;
                    comparison = tasteA - tasteB;
                    break;
                default:
                    comparison = a.name.localeCompare(b.name, 'zh-TW');
            }
            
            return this.sortOrder === 'asc' ? comparison : -comparison;
        });
        
        return sortedItems;
    }
    
    updateItemsList() {
        this.itemsList.innerHTML = '';
        
        // 首先添加「+」新增卡片
        this.addNewItemCard();
        
        if (this.items.length === 0) {
            return;
        }
        
        const sortedItems = this.getSortedItems();
        
        sortedItems.forEach((item, index) => {
            // 找到原始索引位置
            const originalIndex = this.items.findIndex(originalItem => 
                originalItem.name === item.name && 
                originalItem.dateAdded === item.dateAdded
            );
            
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            const imageHtml = item.imageUrl ? 
                `<div class="item-image">
                    <img src="${item.imageUrl}" alt="${item.name}" onerror="this.parentElement.style.display='none'">
                </div>` : '';
            
            itemCard.innerHTML = `
                ${imageHtml}
                <div class="item-info">
                    <div class="item-badges">
                        <span class="item-price">${item.price || '$'}</span>
                        <span class="item-taste">${item.taste || 'ok'}</span>
                    </div>
                    <div class="item-name-center">${item.name}</div>
                    <div class="item-mini-actions">
                        <button class="mini-btn edit" onclick="wheel.showEditItemModal(${originalIndex})" title="編輯餐點">✏️</button>
                    </div>
                </div>
            `;
            
            this.itemsList.appendChild(itemCard);
        });
    }
    
    addNewItemCard() {
        const addCard = document.createElement('div');
        addCard.className = 'add-item-card';
        addCard.innerHTML = `
            <div class="add-item-content">
                <div class="add-item-icon">+</div>

            </div>
        `;
        
        addCard.addEventListener('click', () => this.showAddItemModal());
        
        this.itemsList.appendChild(addCard);
    }
    
    showEditItemModal(itemIndex) {
        this.currentEditingIndex = itemIndex;
        const item = this.items[itemIndex];
        
        // 填入當前資料
        this.editItemName.value = item.name;
        this.editItemImage.value = item.imageUrl || '';
        
        // 設定價格選項
        const editPriceOptions = this.editItemModal.querySelectorAll('input[name="edit-price"]');
        editPriceOptions.forEach(radio => {
            radio.checked = radio.value === item.price;
            if (radio.checked) {
                radio.parentElement.classList.add('selected');
            } else {
                radio.parentElement.classList.remove('selected');
            }
        });
        
        // 設定好吃程度選項
        const editTasteOptions = this.editItemModal.querySelectorAll('input[name="edit-taste"]');
        editTasteOptions.forEach(radio => {
            radio.checked = radio.value === item.taste;
            if (radio.checked) {
                radio.parentElement.classList.add('selected');
            } else {
                radio.parentElement.classList.remove('selected');
            }
        });
        
        // 更新標籤選項
        this.updateEditTagsCheckboxes(item.tags);
        
        // 顯示彈窗
        this.editItemModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            this.editItemName.focus();
        }, 300);
    }
    
    hideEditItemModal() {
        this.editItemModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentEditingIndex = -1;
    }
    
    updateEditTagsCheckboxes(selectedTags = []) {
        this.editTagsCheckboxes.innerHTML = '';
        
        this.categories.forEach(category => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = category;
            checkbox.id = `edit-tag-${category}`;
            checkbox.checked = selectedTags.includes(category);
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = category;
            label.className = 'tag-checkbox';
            if (checkbox.checked) {
                label.classList.add('selected');
            }
            
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    label.classList.add('selected');
                } else {
                    label.classList.remove('selected');
                }
            });
            
            label.appendChild(checkbox);
            this.editTagsCheckboxes.appendChild(label);
        });
        
        // 添加管理分類的「+」按鈕
        const addLabel = document.createElement('label');
        addLabel.className = 'tag-checkbox';
        addLabel.textContent = '+';
        addLabel.title = '管理標籤';
        addLabel.style.cursor = 'pointer';
        addLabel.addEventListener('click', () => {
            this.showCategoryModal();
            // 當分類管理彈窗關閉後，更新編輯餐點彈窗的標籤選項
            const originalHideCategoryModal = this.hideCategoryModal.bind(this);
            this.hideCategoryModal = () => {
                originalHideCategoryModal();
                // 重新更新編輯餐點彈窗的標籤選項
                if (this.currentEditingIndex >= 0) {
                    this.updateEditTagsCheckboxes(this.items[this.currentEditingIndex].tags);
                }
                // 恢復原本的 hideCategoryModal 方法
                this.hideCategoryModal = originalHideCategoryModal;
            };
        });
        
        this.editTagsCheckboxes.appendChild(addLabel);
    }
    
    async saveEditItemFromModal() {
        const name = this.editItemName.value.trim();
        const imageUrl = this.editItemImage.value.trim();
        const selectedTags = [];
        
        // 收集選中的標籤名稱
        const checkboxes = this.editTagsCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            selectedTags.push(cb.value); // 這裡是標籤名稱
        });
        
        // 轉換為 UUID
        const selectedTagIds = selectedTags.map(tagName => this.tagNameToId.get(tagName)).filter(id => id);
        
        // 收集選中的價格和好吃程度
        const selectedPriceRadio = this.editItemModal.querySelector('input[name="edit-price"]:checked');
        const selectedTasteRadio = this.editItemModal.querySelector('input[name="edit-taste"]:checked');
        const selectedPrice = selectedPriceRadio ? selectedPriceRadio.value : '$';
        const selectedTaste = selectedTasteRadio ? selectedTasteRadio.value : 'ok';
        
        if (!name) {
            alert('請輸入餐點名稱！');
            return;
        }
        
        if (selectedTags.length === 0) {
            alert('請至少選擇一個標籤！');
            return;
        }
        
        // 檢查是否已存在（排除自己）
        if (this.items.some((item, index) => item.name === name && index !== this.currentEditingIndex)) {
            alert('這個餐點名稱已經存在了！');
            return;
        }
        
        try {
            const currentItem = this.items[this.currentEditingIndex];
            
            // 轉換價格格式
            let priceValue;
            switch(selectedPrice) {
                case '$': priceValue = 'low'; break;
                case '$$': priceValue = 'medium'; break;
                case '$$$': priceValue = 'high'; break;
                default: priceValue = 'low';
            }
            
            // 轉換好吃程度
            let tasteValue;
            switch(selectedTaste) {
                case '🩷': tasteValue = 1; break;
                case '🩷🩷': tasteValue = 2; break;
                case '🩷🩷🩷': tasteValue = 3; break;
                default: tasteValue = 1;
            }

            const foodData = {
                payload: {
                    foodname: name,
                    imgurl: imageUrl || null,
                    price: priceValue,
                    taste: tasteValue
                },
                tag_ids: selectedTagIds
            };

            const response = await fetch(`${this.supabaseUrl}/rest/v1/food?id=eq.${currentItem.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(foodData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 重新載入數據
            await this.loadFromSupabase();
            this.hideEditItemModal();

        } catch (error) {
            console.error('更新餐點失敗:', error);
            alert('更新餐點失敗，請稍後再試');
        }
    }
    
    async deleteItemFromModal() {
        if (this.currentEditingIndex >= 0) {
            const currentItem = this.items[this.currentEditingIndex];
            const itemName = currentItem.name;
            
            if (confirm(`確定要刪除 "${itemName}" 嗎？`)) {
                try {
                    const response = await fetch(`${this.supabaseUrl}/rest/v1/food?id=eq.${currentItem.id}`, {
                        method: 'DELETE',
                        headers: {
                            'apikey': this.supabaseKey,
                            'Authorization': `Bearer ${this.supabaseKey}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    // 重新載入數據
                    await this.loadFromSupabase();
                    this.hideEditItemModal();

                } catch (error) {
                    console.error('刪除餐點失敗:', error);
                    alert('刪除餐點失敗，請稍後再試');
                }
            }
        }
    }
    
    
    // 分類管理方法
    updateCategoryButtons() {
        this.categoryButtons.innerHTML = '';
        
        this.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.textContent = category;
            btn.dataset.category = category;
            btn.addEventListener('click', (e) => {
                this.filterCategory(e.target.dataset.category);
            });
            
            if (this.currentCategory === category) {
                btn.classList.add('active');
            }
            
            this.categoryButtons.appendChild(btn);
        });
        
        // 添加管理分類的「+」按鈕
        const addBtn = document.createElement('button');
        addBtn.className = 'category-btn category-add-btn';
        addBtn.textContent = '+';
        addBtn.title = '管理標籤';
        addBtn.addEventListener('click', () => this.showCategoryModal());
        
        this.categoryButtons.appendChild(addBtn);
    }
    
    updateModalTagsCheckboxes() {
        this.modalTagsCheckboxes.innerHTML = '';
        
        this.categories.forEach(category => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = category;
            checkbox.id = `modal-tag-${category}`;
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = category;
            label.className = 'tag-checkbox';
            
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    label.classList.add('selected');
                } else {
                    label.classList.remove('selected');
                }
            });
            
            label.appendChild(checkbox);
            this.modalTagsCheckboxes.appendChild(label);
        });
        
        // 添加管理分類的「+」按鈕
        const addLabel = document.createElement('label');
        addLabel.className = 'tag-checkbox';
        addLabel.textContent = '+';
        addLabel.title = '管理標籤';
        addLabel.style.cursor = 'pointer';
        addLabel.addEventListener('click', () => {
            this.showCategoryModal();
            // 當分類管理彈窗關閉後，更新新增餐點彈窗的標籤選項
            const originalHideCategoryModal = this.hideCategoryModal.bind(this);
            this.hideCategoryModal = () => {
                originalHideCategoryModal();
                // 重新更新新增餐點彈窗的標籤選項
                this.updateModalTagsCheckboxes();
                // 恢復原本的 hideCategoryModal 方法
                this.hideCategoryModal = originalHideCategoryModal;
            };
        });
        
        this.modalTagsCheckboxes.appendChild(addLabel);
    }
    
    showCategoryModal() {
        this.categoryModal.style.display = 'flex';
        this.updateCategoriesManagementList();
        // 防止背景滾動
        document.body.style.overflow = 'hidden';
        // 自動聚焦到新增標籤輸入框
        setTimeout(() => {
            this.newCategoryName.focus();
        }, 300);
    }
    
    hideCategoryModal() {
        this.categoryModal.style.display = 'none';
        // 恢復背景滾動
        document.body.style.overflow = 'auto';
        // 清空輸入框
        this.newCategoryName.value = '';
    }
    
    async addCategory() {
        const name = this.newCategoryName.value.trim();
        
        if (!name) {
            alert('請輸入分類名稱！');
            return;
        }
        
        if (this.categories.includes(name)) {
            alert('這個分類已經存在了！');
            return;
        }
        
        try {
            const tagData = {
                name: name,
                food_ids: []
            };

            const response = await fetch(`${this.supabaseUrl}/rest/v1/tag`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(tagData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.newCategoryName.value = '';
            
            // 重新載入標籤
            await this.loadTagsFromSupabase();
            this.updateCategoryButtons();
            this.updateModalTagsCheckboxes();
            this.updateCategoriesManagementList();
            this.updateItemsList();

        } catch (error) {
            console.error('新增標籤失敗:', error);
            alert('新增標籤失敗，請稍後再試');
        }
    }
    
    editCategory(index, newName) {
        if (!newName || newName.trim() === '') {
            alert('分類名稱不能為空！');
            return false;
        }
        
        if (this.categories.includes(newName) && this.categories[index] !== newName) {
            alert('這個分類名稱已經存在！');
            return false;
        }
        
        const oldName = this.categories[index];
        this.categories[index] = newName.trim();
        
        // 更新所有使用此標籤的餐點
        this.items.forEach(item => {
            if (item.tags && item.tags.includes(oldName)) {
                const tagIndex = item.tags.indexOf(oldName);
                item.tags[tagIndex] = newName.trim();
            }
        });
        
        this.updateCategoryButtons();
        this.updateModalTagsCheckboxes();
        this.updateCategoriesManagementList();
        this.updateWheel();
        this.updateItemsList();
        this.saveData();
        
        return true;
    }
    
    async deleteCategory(index) {
        const categoryName = this.categories[index];
        const tagId = this.tagNameToId.get(categoryName);
        const itemsWithTag = this.items.filter(item => item.tags && item.tags.includes(categoryName));
        
        if (itemsWithTag.length > 0) {
            const confirmMessage = `標籤 "${categoryName}" 還在 ${itemsWithTag.length} 個餐點中使用。\n確定要刪除這個標籤嗎？觸發器會自動從所有餐點中移除此標籤。`;
            if (!confirm(confirmMessage)) {
                return;
            }
        } else {
            if (!confirm(`確定要刪除標籤 "${categoryName}" 嗎？`)) {
                return;
            }
        }
        
        try {
            if (tagId) {
                const response = await fetch(`${this.supabaseUrl}/rest/v1/tag?id=eq.${tagId}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': this.supabaseKey,
                        'Authorization': `Bearer ${this.supabaseKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // 重新載入數據
                await this.loadFromSupabase();
                this.updateCategoriesManagementList();
            }
        } catch (error) {
            console.error('刪除標籤失敗:', error);
            alert('刪除標籤失敗，請稍後再試');
        }
    }
    
    updateCategoriesManagementList() {
        this.categoriesList.innerHTML = '';
        
        this.categories.forEach((category, index) => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            
            categoryItem.innerHTML = `
                <input type="text" value="${category}" disabled data-original="${category}">
                <div class="category-actions">
                    <button class="edit-btn" onclick="wheel.startEditCategory(${index})">編輯</button>
                    <button class="delete-btn" onclick="wheel.deleteCategory(${index})">刪除</button>
                </div>
            `;
            
            this.categoriesList.appendChild(categoryItem);
        });
    }
    
    startEditCategory(index) {
        const categoryItem = this.categoriesList.children[index];
        const input = categoryItem.querySelector('input');
        const actions = categoryItem.querySelector('.category-actions');
        
        input.disabled = false;
        input.focus();
        input.select();
        
        actions.innerHTML = `
            <button class="save-btn" onclick="wheel.saveEditCategory(${index})">保存</button>
            <button class="cancel-btn" onclick="wheel.cancelEditCategory(${index})">取消</button>
        `;
    }
    
    saveEditCategory(index) {
        const categoryItem = this.categoriesList.children[index];
        const input = categoryItem.querySelector('input');
        const newName = input.value.trim();
        
        if (this.editCategory(index, newName)) {
            // 編輯成功，重新載入列表
            this.updateCategoriesManagementList();
        }
    }
    
    cancelEditCategory(index) {
        const categoryItem = this.categoriesList.children[index];
        const input = categoryItem.querySelector('input');
        
        input.value = input.dataset.original;
        input.disabled = true;
        
        const actions = categoryItem.querySelector('.category-actions');
        actions.innerHTML = `
            <button class="edit-btn" onclick="wheel.startEditCategory(${index})">編輯</button>
            <button class="delete-btn" onclick="wheel.deleteCategory(${index})">刪除</button>
        `;
    }
    
    // 性能優化方法
    showLoading(show) {
        if (show) {
            if (!this.loadingElement) {
                this.loadingElement = document.createElement('div');
                this.loadingElement.className = 'loading-overlay';
                this.loadingElement.innerHTML = `
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>載入中...</p>
                    </div>
                `;
                document.body.appendChild(this.loadingElement);
            }
            this.loadingElement.style.display = 'flex';
        } else {
            if (this.loadingElement) {
                this.loadingElement.style.display = 'none';
            }
        }
    }
    
    // 防抖函數
    debounce(func, wait) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(func, wait);
    }
    
    filterCategory(category) {
        this.currentCategory = category;
        
        // 更新按鈕樣式
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category || (category === 'all' && btn.textContent === '全部')) {
                btn.classList.add('active');
            }
        });
        
        this.updateWheel();
        this.result.textContent = '';
    }
    
    async loadFromSupabase() {
        // 顯示加載指示器
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/food?select=*`, {
                method: 'GET',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            this.items = data.map(food => {
                const payload = food.payload;
                const tagIds = food.tag_ids || [];
                
                // 將價格格式轉換
                let priceDisplay;
                switch(payload.price) {
                    case 'low': priceDisplay = '$'; break;
                    case 'medium': priceDisplay = '$$'; break;
                    case 'high': priceDisplay = '$$$'; break;
                    default: priceDisplay = '$';
                }
                
                // 將好吃程度轉換為皇冠
                let tasteDisplay;
                switch(payload.taste) {
                    case 1: tasteDisplay = '🩷'; break;
                    case 2: tasteDisplay = '🩷🩷'; break;
                    case 3: tasteDisplay = '🩷🩷🩷'; break;
                    default: tasteDisplay = '🩷';
                }
                
                // 將 UUID 轉換為標籤名稱 (用於顯示和過濾)
                const tagNames = tagIds.map(tagId => this.tagIdToName.get(tagId) || tagId);
                
                return {
                    id: food.id,
                    name: payload.foodname || '未命名',
                    imageUrl: payload.imgurl,
                    price: priceDisplay,
                    taste: tasteDisplay,
                    tags: tagNames,
                    tagIds: tagIds, // 保留原始 UUID 供 API 使用
                    dateAdded: new Date(food.created_at).getTime()
                };
            });

            await this.loadTagsFromSupabase();
            
            this.updateCategoryButtons();
            this.updateModalTagsCheckboxes();
            this.setupPriceSelectors();
            this.updateWheel();
            this.updateItemsList();

        } catch (error) {
            console.error('載入 Supabase 資料失敗:', error);
            this.items = [];
            this.categories = [];
            this.updateCategoryButtons();
            this.updateModalTagsCheckboxes();
            this.setupPriceSelectors();
            this.updateWheel();
            this.updateItemsList();
        } finally {
            // 隱藏加載指示器
            this.showLoading(false);
        }
    }

    async loadTagsFromSupabase() {
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/tag?select=*`, {
                method: 'GET',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tags = await response.json();
            
            // 清空現有映射
            this.tagNameToId.clear();
            this.tagIdToName.clear();
            this.tagData.clear();
            
            // 建立雙向映射
            tags.forEach(tag => {
                this.tagNameToId.set(tag.name, tag.id);
                this.tagIdToName.set(tag.id, tag.name);
                this.tagData.set(tag.id, tag);
            });
            
            // UI 顯示用的分類名稱
            this.categories = tags.map(tag => tag.name);
            
        } catch (error) {
            console.error('載入標籤失敗:', error);
            this.categories = [];
        }
    }

    saveData() {
        localStorage.setItem('wheelOfFoodItems', JSON.stringify(this.items));
        localStorage.setItem('wheelOfFoodCategories', JSON.stringify(this.categories));
    }
    
    loadData() {
        const savedItems = localStorage.getItem('wheelOfFoodItems');
        const savedCategories = localStorage.getItem('wheelOfFoodCategories');
        
        if (savedItems) {
            this.items = JSON.parse(savedItems);
            this.items.forEach((item, index) => {
                if (item.category && !item.tags) {
                    item.tags = [item.category];
                    delete item.category;
                }
                if (!item.tags) {
                    item.tags = ['其他'];
                }
                if (!item.price) {
                    item.price = '$';
                }
                if (!item.taste) {
                    item.taste = '🩷';
                }
                if (!item.dateAdded) {
                    item.dateAdded = Date.now() - (this.items.length - index) * 100000;
                }
            });
        }
        
        if (savedCategories) {
            this.categories = JSON.parse(savedCategories);
        }
        
    }
}

// 清理舊的預設資料（一次性清理）
if (localStorage.getItem('wheelOfFoodCategories')) {
    const savedCategories = JSON.parse(localStorage.getItem('wheelOfFoodCategories'));
    const filteredCategories = savedCategories.filter(cat => cat !== '熱食' && cat !== '其他');
    if (filteredCategories.length !== savedCategories.length) {
        if (filteredCategories.length === 0) {
            localStorage.removeItem('wheelOfFoodCategories');
        } else {
            localStorage.setItem('wheelOfFoodCategories', JSON.stringify(filteredCategories));
        }
    }
}

// 初始化轉盤
const wheel = new WheelOfFood();