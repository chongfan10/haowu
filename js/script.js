document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. 读取数据 & 解析
    // ==========================================
    // 直接从 data.js 中获取数据，如果没找到（比如忘了引入），就显示空
    const sourceData = window.goodsData || '';
    
    const database = [];
    let currentEpisodeObj = null;

    sourceData.trim().split('\n').forEach(line => {
        line = line.trim();
        if (!line) return; 

        const parts = line.split('|');
        
        if (parts[0].includes('期') && parts[1] && parts[1].includes('http')) {
            currentEpisodeObj = { episode: parts[0], videoLink: parts[1], items: [] };
            database.push(currentEpisodeObj);
        } 
        else if (currentEpisodeObj) {
            const [name, brand, category, rec, platform, url, image] = parts;
            currentEpisodeObj.items.push({
                name: name || '未命名好物',
                brand: brand || '暂无描述',
                category: category || '日用',
                rec: rec || 'UP主推荐',
                platform: platform || '',
                url: url || '',
                image: image || `https://via.placeholder.com/500x300?text=${name || '暂无图片'}`
            });
        }
    });

    // ==========================================
    // 2. 常量与变量声明
    // ==========================================
    const allCategories = [...new Set(database.flatMap(ep => ep.items.map(item => item.category)))];
    const biliSvg = `<svg class="bili-icon" viewBox="0 0 24 24"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .356-.124.658-.373.907l-1.166 1.12zM5.333 7.24a1.98 1.98 0 0 0-1.436.587c-.382.382-.587.854-.587 1.436v7.36c0 .582.205 1.054.587 1.436.382.382.854.587 1.436.587h13.334a1.98 1.98 0 0 0 1.436-.587c.382-.382.587-.854.587-1.436v-7.36c0-.582-.205-1.054-.587-1.436a1.98 1.98 0 0 0-1.436-.587H5.333zM8 11.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zm8 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"/></svg>`;
    const emptyPlatforms = ['未提及', '未提及平台', '无', ''];

    let currentMode = 'episode'; 
    let currentEpisode = 'all';
    let currentCategory = 'all';
    let searchKeyword = '';

    const mainNav = document.getElementById('mainNav');
    const cardGrid = document.getElementById('cardGrid');
    const videoLinkArea = document.getElementById('videoLinkArea');

    // ==========================================
    // 3. 渲染逻辑 (原封不动)
    // ==========================================
    function renderNav() {
        let html = `<button class="icon-btn" id="toggleModeBtn" title="点击切换：期数 / 分类"><svg viewBox="0 0 24 24"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/></svg></button>`;
        if (currentMode === 'episode') {
            html += `<button class="${currentEpisode === 'all' ? 'active' : ''}" data-val="all">全部</button>`;
            database.forEach(ep => { html += `<button class="${currentEpisode === ep.episode ? 'active' : ''}" data-val="${ep.episode}">${ep.episode}</button>`; });
        } else {
            html += `<button class="${currentCategory === 'all' ? 'active' : ''}" data-val="all">全部分类</button>`;
            allCategories.forEach(cat => { html += `<button class="${currentCategory === cat ? 'active' : ''}" data-val="${cat}">${cat}</button>`; });
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
                    const matchSearch = searchKeyword === '' || item.name.toLowerCase().includes(searchKeyword.toLowerCase()) || item.brand.toLowerCase().includes(searchKeyword.toLowerCase());
                    if (matchCategory && matchSearch) itemsToRender.push({ ...item, episodeTag: ep.episode });
                });
            }
        });

        if (currentEpisode === 'all') {
            videoLinkArea.innerHTML = `视频传送门：B站博主 <a href="https://space.bilibili.com/14127001" target="_blank">${biliSvg} 逛拼多多的品检员</a> 《好物整理合集》`;
        } else {
            videoLinkArea.innerHTML = `视频传送门：<a href="${activeVideoLink}" target="_blank">${biliSvg} <span>${currentEpisode} 视频传送门</span></a>`;
        }

        if (itemsToRender.length === 0) {
            cardGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 40px;">没有找到相关好物~</div>`;
            return;
        }

        itemsToRender.forEach(item => {
            const linkHTML = item.url ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="card-link"><svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>去看看</a>` : `<span class="card-link disabled">暂无链接</span>`;

            const recTag = currentEpisode === 'all' ? `${item.episodeTag}` : item.rec;
            let platformText = emptyPlatforms.includes(item.platform) ? '推荐官方旗舰店购买' : item.platform;

            cardGrid.innerHTML += `
                <div class="card">
                    <div class="card-tags"><span class="tag category">${item.category}</span><span class="tag rec">${recTag}</span></div>
                    <div class="card-image-wrapper"><img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x300?text=图片加载失败'"></div>
                    <div class="card-content">
                        <div class="card-title">${item.name}</div>
                        <div class="card-desc">${item.brand}</div>
                        <div class="card-footer">
                            <span class="card-platform">购物平台：${platformText}</span>
                            ${linkHTML}
                        </div>
                    </div>
                </div>
            `;
        });
    }

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

    // ==========================================
    // 4. 弹窗逻辑
    // ==========================================
    const modal = document.getElementById('disclaimerModal');
    const openBtn = document.getElementById('openDisclaimerBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const confirmBtn = document.getElementById('confirmModalBtn');

    if (!localStorage.getItem('hasReadDisclaimer')) {
        setTimeout(() => modal.classList.add('show'), 500);
    }
    openBtn.addEventListener('click', () => modal.classList.add('show'));
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
    
    confirmBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        localStorage.setItem('hasReadDisclaimer', 'true');
    });

    // 启动
    renderNav();
    renderCards();
});