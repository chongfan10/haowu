// ==========================================
// 🌟 工具库 (Utils)
// ==========================================
window.icons = {
    bili: `<svg class="bili-icon" viewBox="0 0 24 24"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .356-.124.658-.373.907l-1.166 1.12zM5.333 7.24a1.98 1.98 0 0 0-1.436.587c-.382.382-.587.854-.587 1.436v7.36c0 .582.205 1.054.587 1.436.382.382.854.587 1.436.587h13.334a1.98 1.98 0 0 0 1.436-.587c.382-.382.587-.854.587-1.436v-7.36c0-.582-.205-1.054-.587-1.436a1.98 1.98 0 0 0-1.436-.587H5.333zM8 11.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zm8 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/></svg>`,
    link: `<svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`,
    camera: `<svg viewBox="0 0 24 24"><path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg>`
};

window.parseGoodsData = function(rawText) {
    if (!rawText) return [];
    const database = [];
    let currentEpisodeObj = null;
    rawText.replace(/\u3000/g, ' ').split('\n').forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return; 
        const parts = cleanLine.split('|').map(str => str.trim()); 
        if (parts[0].includes('期')) {
            currentEpisodeObj = { episode: parts[0], videoLink: (parts[1] && parts[1].includes('http')) ? parts[1] : '', items: [] };
            database.push(currentEpisodeObj);
        } else if (currentEpisodeObj) {
            const [name, brand, category, rec, platform, url, image, price, comment] = parts;
            currentEpisodeObj.items.push({
                name: name || '未命名好物', brand: brand || '暂无描述', category: category || '日用',
                rec: rec || 'UP主推荐', platform: platform || '', url: url || '', image: image || '',
                price: price || '价格待定', comment: comment || '暂无评论', videoUrl: ''
            });
        }
    });
    return database;
};

window.parseSpecialData = function(rawText) {
    if (!rawText) return [];
    const database = [];
    let currentEpisodeObj = null;
    rawText.replace(/\u3000/g, ' ').split('\n').forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return; 
        const parts = cleanLine.split('|').map(str => str.trim()); 
        if (parts.length === 1 || parts[0].includes('补充') || parts[0].includes('特别')) {
            currentEpisodeObj = { episode: parts[0], videoLink: '', items: [] };
            database.push(currentEpisodeObj);
        } else if (currentEpisodeObj) {
            const [name, brand, videoUrl, url] = parts;
            currentEpisodeObj.items.push({
                name: name || '未命名好物', brand: brand || '', videoUrl: videoUrl || '', url: url || '',
                category: '特别推荐', rec: 'UP主推荐', platform: '', image: '', price: '', comment: ''
            });
        }
    });
    return database;
};

// 🌟 核心修改：如果没有平台，返回空字符串，不再返回“推荐官方旗舰店购买”
window.getPlatformText = function(platform) {
    const emptyPlatforms = ['未提及', '未提及平台', '无', ''];
    return emptyPlatforms.includes(platform) ? '' : platform;
};

window.formatPrice = function(price) {
    return price !== '价格待定' ? `¥ ${price}` : price;
};

window.highlightText = function(text, keyword) {
    if (!keyword || !text) return text;
    const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeKeyword})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
};