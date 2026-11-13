document.addEventListener('DOMContentLoaded', () => {
    const mainData = window.parseGoodsData(window.goodsData || '');
    const specialData = window.parseSpecialData(window.specialData || '');
    const database = [...mainData, ...specialData];
    
    let currentMainTab = 'main'; 
    let currentMode = 'episode', currentEpisode = 'all', currentCategory = 'all', searchKeyword = '';
    
    // 🌟 新增：分页状态变量
    let currentPage = 1;
    const itemsPerPage = 24; // 每页显示的数量

    const mainTabs = document.getElementById('mainTabs');
    const fixedNavArea = document.getElementById('fixedNavArea');
    const mainNav = document.getElementById('mainNav');
    const cardGrid = document.getElementById('cardGrid');
    const videoLinkArea = document.getElementById('videoLinkArea');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const paginationContainer = document.getElementById('pagination');

    const isMainEpisode = (episodeName) => episodeName.includes('期');

    function renderTopTabs() {
        mainTabs.innerHTML = `
            <button class="${currentMainTab === 'main' ? 'active' : ''}" data-tab="main">正片期数</button>
            <button class="${currentMainTab === 'special' ? 'active' : ''}" data-tab="special">特别补充</button>
        `;
    }

    function getTabEpisodes() {
        return database.filter(ep => {
            const isMain = isMainEpisode(ep.episode);
            return currentMainTab === 'main' ? isMain : !isMain;
        });
    }

    function renderFixedBtn() {
        fixedNavArea.innerHTML = `<button class="btn-base" id="toggleModeBtn" title="切换模式">${window.icons.arrow}</button>`;
    }

    function renderNav() {
        const tabEpisodes = getTabEpisodes();
        const tabItems = tabEpisodes.flatMap(ep => ep.items);
        const tabCategories = [...new Set(tabItems.map(item => item.category))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'zh-CN'));

        let html = '';
        
        if (currentMode === 'episode') {
            const totalCount = tabEpisodes.reduce((s, e) => s + e.items.length, 0);
            html += `<button class="btn-base ${currentEpisode === 'all' ? 'active' : ''}" data-val="all">全部 (${totalCount})</button>`;
            
            [...tabEpisodes].reverse().forEach(ep => {
                html += `<button class="btn-base ${currentEpisode === ep.episode ? 'active' : ''}" data-val="${ep.episode}">${ep.episode} (${ep.items.length})</button>`;
            });
        } else {
            const itemsToCount = currentEpisode === 'all' ? tabItems : (tabEpisodes.find(ep => ep.episode === currentEpisode)?.items || []);
            html += `<button class="btn-base ${currentCategory === 'all' ? 'active' : ''}" data-val="all">全部分类 (${itemsToCount.length})</button>`;
            tabCategories.forEach(cat => {
                const count = itemsToCount.filter(i => i.category === cat).length;
                html += `<button class="btn-base ${currentCategory === cat ? 'active' : ''}" data-val="${cat}">${cat} (${count})</button>`;
            });
        }
        mainNav.innerHTML = html;
    }

    // 🌟 核心修改：添加了分页切片逻辑
    function renderCards() {
        let allMatchedItems = [];
        let activeVideoLink = '';

        database.forEach(ep => {
            const isMain = isMainEpisode(ep.episode);
            if (searchKeyword === '') {
                if (currentMainTab === 'main' && !isMain) return;
                if (currentMainTab === 'special' && isMain) return;
            }

            if (currentEpisode === 'all' || ep.episode === currentEpisode) {
                if (currentEpisode !== 'all') activeVideoLink = ep.videoLink;
                ep.items.forEach(item => {
                    const matchCat = (currentCategory === 'all' || item.category === currentCategory);
                    const matchSearch = searchKeyword === '' || [item.name, item.brand, item.comment].some(str => str.toLowerCase().includes(searchKeyword.toLowerCase()));
                    if (matchCat && matchSearch) allMatchedItems.push({ ...item, episodeTag: ep.episode });
                });
            }
        });

        // 更新顶部传送门
        if (currentEpisode === 'all') {
            if (currentMainTab === 'main' || searchKeyword !== '') {
                videoLinkArea.innerHTML = `视频传送门：B站博主 <a href="https://space.bilibili.com/14127001" target="_blank">${window.icons.bili} 逛拼多多的品检员</a> 《好物整理合集》`;
            } else {
                videoLinkArea.innerHTML = `推荐列表：<span style="font-weight:bold; color:var(--accent-color);">特别补充</span> （UP主单独列出）`;
            }
        } else {
            if (activeVideoLink) {
                videoLinkArea.innerHTML = `视频传送门：<a href="${activeVideoLink}" target="_blank">${window.icons.bili} <span>${currentEpisode} 视频传送门</span></a>`;
            } else {
                videoLinkArea.innerHTML = `推荐列表：<span style="font-weight:bold; color:var(--accent-color);">${currentEpisode}</span> （无对应视频）`;
            }
        }

        if (allMatchedItems.length === 0) {
            cardGrid.innerHTML = `<div class="empty-state">没有找到相关好物，换个词试试吧~</div>`;
            paginationContainer.innerHTML = '';
            return;
        }

        // 🌟 分页计算逻辑
        const totalPages = Math.ceil(allMatchedItems.length / itemsPerPage);
        // 防止页码越界
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        
        // 截取当前页的数据
        const startIndex = (currentPage - 1) * itemsPerPage;
        const itemsToRender = allMatchedItems.slice(startIndex, startIndex + itemsPerPage);

        // 渲染卡片...
        if (currentMainTab === 'special' && searchKeyword === '') {
            let listHtml = `<div class="special-list-wrapper">`;
            itemsToRender.forEach(item => {
                const highlightedName = window.highlightText(item.name, searchKeyword);
                const brandHtml = item.brand ? `<span style="font-size:13px; color:var(--sub); font-weight:normal; margin-left:8px;">${item.brand}</span>` : '';
                let btnGroupHtml = `<div class="special-btn-group">`;
                if (item.videoUrl) btnGroupHtml += `<a href="${item.videoUrl}" target="_blank" rel="noopener noreferrer" class="special-link-btn video-btn">${window.icons.bili} 看视频</a>`;
                if (item.url) btnGroupHtml += `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="special-link-btn">${window.icons.link} 前往购买</a>`;
                if (!item.videoUrl && !item.url) btnGroupHtml += `<span class="special-no-link">暂无相关链接</span>`;
                btnGroupHtml += `</div>`;

                listHtml += `
                    <div class="special-item">
                        <div class="special-item-info"><div class="special-title">${highlightedName}${brandHtml}</div></div>
                        ${btnGroupHtml}
                    </div>
                `;
            });
            listHtml += `</div>`;
            cardGrid.innerHTML = listHtml;
        } else {
            const htmlArray = itemsToRender.map(item => {
                const linkHTML = item.url 
                    ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="card-link">${window.icons.link}去看看</a>` 
                    : `<span class="card-link disabled">暂无链接</span>`;

                const imageHTML = item.image
                    ? `<img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="img-placeholder" style="display:none;">${window.icons.camera} <span>无具体推荐物品</span></div>`
                    : `<div class="img-placeholder" style="display:flex;">${window.icons.camera} <span>无具体推荐物品</span></div>`;
                
                const episodeTagHTML = (currentEpisode === 'all') 
                    ? `<button class="tag episode btn-episode" data-episode="${item.episodeTag}" title="点击切换至 ${item.episodeTag}">${item.episodeTag}</button>` 
                    : '';
                
                const highlightedName = window.highlightText(item.name, searchKeyword);
                const highlightedBrand = window.highlightText(item.brand, searchKeyword);
                const highlightedComment = window.highlightText(item.comment, searchKeyword);

                const platformText = window.getPlatformText(item.platform);
                const platformHtml = platformText 
                    ? `<span class="card-platform">购物平台：${platformText}</span>` 
                    : `<span class="card-platform" style="opacity: 0.6;">暂无平台信息</span>`;

                return `
                    <div class="card">
                        <div class="card-image-wrapper">${imageHTML}</div>
                        <div class="card-content">
                            <div class="card-tags">
                                <span class="tag category">${item.category}</span>
                                ${episodeTagHTML}
                                <span class="tag rec">${item.rec}</span>
                            </div>
                            <div class="card-title-row">
                                <div class="card-title">${highlightedName}</div>
                                <div class="card-price">${window.formatPrice(item.price)}</div>
                            </div>
                            <div class="card-desc">品牌：<span class="brand-text">${highlightedBrand}</span></div>
                            <div class="card-comment">视频评论：${highlightedComment}</div>
                            <div class="card-footer">
                                ${platformHtml}
                                ${linkHTML}
                            </div>
                        </div>
                    </div>
                `;
            });
            cardGrid.innerHTML = htmlArray.join('');
        }

        // 🌟 渲染底部分页器
        renderPagination(totalPages);
    }

    // 🌟 动态生成分页按钮
    function renderPagination(totalPages) {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '';
        
        // 上一页按钮
        html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>`;

        // 页码计算（最多显示 5 个页码，多余用省略号）
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            html += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
            html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // 下一页按钮
        html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>`;

        paginationContainer.innerHTML = html;
    }

    // ==========================================
    // 事件绑定
    // ==========================================
    mainTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || btn.classList.contains('active')) return;
        currentMainTab = btn.getAttribute('data-tab');
        currentMode = 'episode'; 
        currentEpisode = 'all'; 
        currentCategory = 'all'; 
        searchKeyword = '';
        currentPage = 1; // 重置页码
        searchInput.value = ''; 
        clearSearchBtn.classList.remove('show');
        renderTopTabs(); renderNav(); renderCards();
    });

    fixedNavArea.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn && btn.id === 'toggleModeBtn') {
            currentMode = currentMode === 'episode' ? 'category' : 'episode';
            currentEpisode = 'all';
            currentCategory = 'all';
            currentPage = 1; // 重置页码
            renderNav();
            mainNav.scrollTo({ left: 0, behavior: 'smooth' });
        }
    });

    mainNav.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || !btn.hasAttribute('data-val')) return;
        
        const val = btn.getAttribute('data-val');
        if (currentMode === 'episode') {
            currentEpisode = val;
            currentCategory = 'all'; 
        } else {
            currentCategory = val;
            currentEpisode = 'all'; 
        }
        currentPage = 1; // 重置页码
        renderNav(); renderCards();
    });

    cardGrid.addEventListener('click', (e) => {
        const btnEp = e.target.closest('.btn-episode');
        if (btnEp) {
            const targetEp = btnEp.getAttribute('data-episode');
            if (currentMainTab !== 'main') {
                currentMainTab = 'main';
                renderTopTabs();
            }
            if (currentMode !== 'episode') {
                currentMode = 'episode';
            }

            currentEpisode = targetEp;
            currentCategory = 'all';
            searchKeyword = '';
            currentPage = 1; // 重置页码
            searchInput.value = '';
            clearSearchBtn.classList.remove('show');

            renderNav();
            renderCards();

            setTimeout(() => {
                const activeNavBtn = mainNav.querySelector('.active');
                if (activeNavBtn) {
                    const scrollPos = activeNavBtn.offsetLeft - (mainNav.clientWidth / 2) + (activeNavBtn.clientWidth / 2);
                    mainNav.scrollTo({ left: scrollPos, behavior: 'smooth' });
                }
            }, 50);
            return; 
        }

        if (e.target.tagName === 'IMG') {
            const previewImg = document.getElementById('previewImg');
            const imgPreviewModal = document.getElementById('imagePreviewModal');
            previewImg.src = e.target.src; 
            imgPreviewModal.classList.add('show');
        }
    });

    // 🌟 分页器点击事件
    paginationContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (!btn || btn.disabled || btn.classList.contains('active')) return;
        
        const targetPage = parseInt(btn.getAttribute('data-page'));
        if (!isNaN(targetPage)) {
            currentPage = targetPage;
            renderCards();
            
            // 平滑滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    let searchTimer;
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        clearSearchBtn.classList.toggle('show', val.length > 0);
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { 
            searchKeyword = val; 
            currentPage = 1; // 重置页码
            renderCards(); 
        }, 300);
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = ''; 
        clearSearchBtn.classList.remove('show'); 
        searchKeyword = ''; 
        currentPage = 1; // 重置页码
        renderCards(); 
        searchInput.focus();
    });

    let isDown = false, startX, scrollLeft;
    mainNav.addEventListener('mousedown', (e) => { isDown = true; mainNav.style.cursor = 'grabbing'; startX = e.pageX - mainNav.offsetLeft; scrollLeft = mainNav.scrollLeft; });
    mainNav.addEventListener('mouseleave', () => { isDown = false; mainNav.style.cursor = 'grab'; });
    mainNav.addEventListener('mouseup', () => { isDown = false; mainNav.style.cursor = 'grab'; });
    mainNav.addEventListener('mousemove', (e) => { if (isDown) { e.preventDefault(); mainNav.scrollLeft = scrollLeft - (e.pageX - mainNav.offsetLeft - startX) * 2; } });

    document.getElementById('closePreviewBtn').addEventListener('click', () => { 
        const imgPreviewModal = document.getElementById('imagePreviewModal');
        const previewImg = document.getElementById('previewImg');
        imgPreviewModal.classList.remove('show'); 
        setTimeout(() => { previewImg.src = ''; }, 300); 
    });
    document.getElementById('imagePreviewModal').addEventListener('click', (e) => { 
        const imgPreviewModal = document.getElementById('imagePreviewModal');
        const previewImg = document.getElementById('previewImg');
        if (e.target === imgPreviewModal) { 
            imgPreviewModal.classList.remove('show'); 
            setTimeout(() => { previewImg.src = ''; }, 300); 
        } 
    });

    const backToTopBtn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => backToTopBtn.classList.toggle('show', window.scrollY > 300));
    backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const modal = document.getElementById('disclaimerModal');
    const closeModal = () => modal.classList.remove('show');
    if (!localStorage.getItem('hasReadDisclaimer')) setTimeout(() => modal.classList.add('show'), 300);
    document.getElementById('openDisclaimerBtn').addEventListener('click', () => modal.classList.add('show'));
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('confirmModalBtn').addEventListener('click', () => { closeModal(); localStorage.setItem('hasReadDisclaimer', 'true'); });
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    renderTopTabs();
    renderFixedBtn();
    renderNav();
    renderCards();
});