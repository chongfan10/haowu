document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. 获取数据 & 初始化
    // ==========================================
    const database = window.parseGoodsData(window.goodsData);
    
    let allCategories = [...new Set(database.flatMap(ep => ep.items.map(item => item.category)))];
    allCategories = allCategories.filter(Boolean).sort((a, b) => a.localeCompare(b, 'zh-CN'));

    let currentMode = 'episode'; 
    let currentEpisode = 'all';
    let currentCategory = 'all';
    let searchKeyword = '';

    const mainNav = document.getElementById('mainNav');
    const cardGrid = document.getElementById('cardGrid');
    const videoLinkArea = document.getElementById('videoLinkArea');

    // ==========================================
    // 2. 渲染逻辑
    // ==========================================
    function renderNav() {
        let html = `<button class="icon-btn" id="toggleModeBtn" title="点击切换：期数 / 分类">${window.icons.arrow}</button>`;
        
        if (currentMode === 'episode') {
            const totalCount = database.reduce((sum, ep) => sum + ep.items.length, 0);
            html += `<button class="${currentEpisode === 'all' ? 'active' : ''}" data-val="all">全部 (${totalCount})</button>`;
            
            database.forEach(ep => { 
                const count = ep.items.length;
                html += `<button class="${currentEpisode === ep.episode ? 'active' : ''}" data-val="${ep.episode}">${ep.episode} (${count})</button>`; 
            });
        } else {
            const totalCount = database.reduce((sum, ep) => sum + ep.items.length, 0);
            html += `<button class="${currentCategory === 'all' ? 'active' : ''}" data-val="all">全部分类 (${totalCount})</button>`;
            
            const allItems = database.flatMap(ep => ep.items);

            allCategories.forEach(cat => { 
                const count = allItems.filter(item => item.category === cat).length;
                html += `<button class="${currentCategory === cat ? 'active' : ''}" data-val="${cat}">${cat} (${count})</button>`; 
            });
        }
        mainNav.innerHTML = html;
    }

    function renderCards() {
        cardGrid.innerHTML = '';
        let itemsToRender = [];
        let activeVideoLink = '';

        database.forEach(ep => {
            if (currentEpisode === 'all' || ep.episode === currentEpisode) {
                if (currentEpisode !== 'all') activeVideoLink = ep.videoLink;
                ep.items.forEach(item => {
                    const matchCategory = (currentCategory === 'all' || item.category === currentCategory);
                    const matchSearch = searchKeyword === '' || 
                        item.name.toLowerCase().includes(searchKeyword.toLowerCase()) || 
                        item.brand.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                        item.comment.toLowerCase().includes(searchKeyword.toLowerCase());
                    
                    if (matchCategory && matchSearch) {
                        itemsToRender.push({ ...item, episodeTag: ep.episode });
                    }
                });
            }
        });

        if (currentEpisode === 'all') {
            videoLinkArea.innerHTML = `视频传送门：B站博主 <a href="https://space.bilibili.com/14127001" target="_blank">${window.icons.bili} 逛拼多多的品检员</a> 《好物整理合集》`;
        } else {
            videoLinkArea.innerHTML = `视频传送门：<a href="${activeVideoLink}" target="_blank">${window.icons.bili} <span>${currentEpisode} 视频传送门</span></a>`;
        }

        if (itemsToRender.length === 0) {
            cardGrid.innerHTML = `<div class="empty-state">没有找到相关好物，换个词试试吧~</div>`;
            return;
        }

        let cardHtml = '';
        itemsToRender.forEach(item => {
            const linkHTML = item.url 
                ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="card-link">${window.icons.link}去看看</a>` 
                : `<span class="card-link disabled">暂无链接</span>`;

            const recTag = currentEpisode === 'all' ? `${item.episodeTag}` : item.rec;
            const platformText = window.getPlatformText(item.platform);
            const priceText = item.price !== '价格待定' ? `¥ ${item.price}` : item.price;

            let imageHTML = '';
            if (item.image) {
                imageHTML = `
                    <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="img-placeholder" style="display:none;">${window.icons.camera} <span>暂无实拍图</span></div>
                `;
            } else {
                imageHTML = `
                    <div class="img-placeholder" style="display:flex;">${window.icons.camera} <span>暂无实拍图</span></div>
                `;
            }

            cardHtml += `
                <div class="card">
                    <div class="card-tags">
                        <span class="tag category">${item.category}</span>
                        <span class="tag rec">${recTag}</span>
                    </div>
                    <div class="card-image-wrapper">
                        ${imageHTML}
                    </div>
                    <div class="card-content">
                        <div class="card-title-row">
                            <div class="card-title">${item.name}</div>
                            <div class="card-price">${priceText}</div>
                        </div>
                        
                        <div class="card-desc">品牌：${item.brand}</div>
                        <div class="card-comment">视频评论：${item.comment}</div>
                        
                        <div class="card-footer">
                            <span class="card-platform">购物平台：${platformText}</span>
                            ${linkHTML}
                        </div>
                    </div>
                </div>
            `;
        });
        cardGrid.innerHTML = cardHtml;
    }

    // ==========================================
    // 3. 事件绑定
    // ==========================================
    mainNav.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.id === 'toggleModeBtn') {
            currentMode = currentMode === 'episode' ? 'category' : 'episode';
            renderNav();
            mainNav.scrollTo({ left: 0, behavior: 'smooth' });
        } else if (btn.hasAttribute('data-val')) {
            const val = btn.getAttribute('data-val');
            if (currentMode === 'episode') currentEpisode = val;
            else currentCategory = val;
            renderNav();
            renderCards();
        }
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchKeyword = e.target.value.trim();
        renderCards();
    });

    // 🌟 鼠标拖拽滑动导航栏
    let isDown = false;
    let startX;
    let scrollLeft;

    mainNav.addEventListener('mousedown', (e) => {
        isDown = true;
        mainNav.style.cursor = 'grabbing';
        startX = e.pageX - mainNav.offsetLeft;
        scrollLeft = mainNav.scrollLeft;
    });

    mainNav.addEventListener('mouseleave', () => {
        isDown = false;
        mainNav.style.cursor = 'grab';
    });

    mainNav.addEventListener('mouseup', () => {
        isDown = false;
        mainNav.style.cursor = 'grab';
    });

    mainNav.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - mainNav.offsetLeft;
        const walk = (x - startX) * 2; 
        mainNav.scrollLeft = scrollLeft - walk;
    });

    // ==========================================
    // 4. 弹窗逻辑
    // ==========================================
    const modal = document.getElementById('disclaimerModal');
    const openBtn = document.getElementById('openDisclaimerBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const confirmBtn = document.getElementById('confirmModalBtn');

    const hasRead = localStorage.getItem('hasReadDisclaimer');
    if (!hasRead) {
        setTimeout(() => modal.classList.add('show'), 300);
    }
    openBtn.addEventListener('click', () => modal.classList.add('show'));
    function closeModal() { modal.classList.remove('show'); }
    function confirmAndCloseModal() {
        closeModal();
        localStorage.setItem('hasReadDisclaimer', 'true');
    }
    closeBtn.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', confirmAndCloseModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // 启动
    renderNav();
    renderCards();
});