// 夜间模式功能
let darkModeToggle;
let viewModeToggle;
let currentViewMode = 1; // 默认为分组展示(1)，卡片展示(2)
let applyFiltersFunction; // 用于存储applyFilters函数引用
let domainsData = []; // 存储所有域名数据
let currentLanguage = 'zh-CN'; // 默认语言为中文
let siteConfig = {}; // 网站配置
let currentFilters = {    // 添加全局筛选条件
    status: 'all',
    registrar: 'all',
    tld: 'all'
};

// 创建域名卡片的全局函数
function createDomainCard(domain) {
    if (!domain) {
        console.error('域名数据为空');
        return document.createElement('div');
    }
    
    // 创建域名卡片元素
    const domainCard = document.createElement('div');
    domainCard.className = `domain-card ${getRegistrarClass(domain.注册商)}`;
    
    // 判断是否为非卖域名和是否可购买
    const isPremium = domain.非卖 === "是";
    const isAvailable = domain.可购买 === "是";
    
    // 如果是收藏(非卖)域名，添加特殊类名
    if (isPremium) {
        domainCard.classList.add('domain-card-favorite');
    }
    
    // 格式化日期
    const expiryDate = formatDate(domain.到期);
    
    // 设置价格类和按钮类
    const priceClass = isPremium ? 'premium-price' : '';
    const buttonClass = isPremium 
        ? 'buy-btn unavailable premium' 
        : (isAvailable ? 'buy-btn' : 'buy-btn unavailable');
    
    // 获取按钮文本（使用翻译）
    const buttonText = isPremium 
        ? getText('collected') 
        : (isAvailable ? getText('buy') : getText('notAvailable'));
    
    // 获取注册商首字母和颜色
    const firstLetter = getFirstLetter(domain.注册商);
    const bgColor = getRegistrarColor(domain.注册商);
    
    // 设置卡片内容
    domainCard.innerHTML = `
        <div class="card-header">
            <div class="registrar">
                <span class="letter-icon" style="background-color: ${bgColor};">${firstLetter}</span>
                <span class="registrar-name">${domain.注册商}</span>
            </div>
            <div class="expiry-date">${getText('expiry')} ${expiryDate}</div>
        </div>
        <div class="card-body">
            <div class="domain-name">
                <span class="domain-part">${domain.前缀}</span><span class="tld-part">${domain.后缀}</span>
            </div>
        </div>
        <div class="card-footer">
            <div class="price ${priceClass}">${formatPrice(domain.价格)}</div>
            <button class="${buttonClass}" ${isPremium || !isAvailable ? 'disabled' : ''} 
                onclick="showModal(${domain.id})">
                ${buttonText}
            </button>
        </div>
    `;
    
    return domainCard;
}

// 获取中文拼音首字母
function getFirstLetter(str) {
    if (!str) return 'A';
    
    // 如果是英文，直接返回第一个字母
    if (/^[A-Za-z]/.test(str)) {
        return str.charAt(0).toUpperCase();
    }
    
    // 如果是中文，直接返回第一个字符
    return str.charAt(0);
}

// 为注册商分配固定颜色
function getRegistrarColor(registrar) {
    // 预定义一组好看的颜色
    const colors = [
        '#3498db', // 蓝色
        '#2ecc71', // 绿色
        '#e74c3c', // 红色
        '#f39c12', // 橙色
        '#9b59b6', // 紫色
        '#1abc9c', // 青绿色
        '#d35400', // 深橙色
        '#c0392b', // 深红色
        '#16a085', // 深青色
        '#8e44ad', // 深紫色
        '#27ae60', // 深绿色
        '#2980b9', // 深蓝色
        '#f1c40f', // 黄色
        '#e67e22', // 橙黄色
        '#34495e'  // 深灰蓝色
    ];
    
    // 为常见注册商分配固定颜色
    const registrarColors = {
        'GoDaddy': '#2980b9',    // 深蓝色
        'Namecheap': '#e74c3c',  // 红色
        'Alibaba': '#f39c12',    // 橙色
        '阿里云': '#f39c12',      // 橙色
        '西部数码': '#2ecc71'     // 绿色
    };
    
    // 如果是已知注册商，返回固定颜色
    if (registrarColors[registrar]) {
        return registrarColors[registrar];
    }
    
    // 对于未知注册商，使用字符串哈希生成固定索引
    let hash = 0;
    for (let i = 0; i < registrar.length; i++) {
        hash = registrar.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // 确保索引在颜色数组范围内
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

// 获取注册商对应的CSS类
function getRegistrarClass(registrar) {
    if (!registrar) {
        console.error('注册商为空');
        return '';
    }
    const registrarMap = {
        'GoDaddy': 'card-godaddy',
        'Namecheap': 'card-namecheap',
        'Alibaba': 'card-alibaba',
        '西部数码': 'card-west'
    };
    
    return registrarMap[registrar] || '';
}

// 格式化价格
function formatPrice(price) {
    if (price === undefined || isNaN(price)) {
        console.error('价格格式错误:', price);
        return '￥0.00';
    }
    return `￥${Number(price).toFixed(2)}`;
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) {
        console.error('日期格式错误:', dateString);
        return '未知';
    }
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.error('无效日期:', dateString);
            return '未知';
        }
        return date.toLocaleDateString('zh-CN');
    } catch (error) {
        console.error('日期格式化错误:', error);
        return '未知';
    }
}

// 初始化夜间模式
function initDarkMode() {
    console.log('开始初始化夜间模式');
    
    // 获取按钮元素
    darkModeToggle = document.getElementById('darkModeToggle');
    
    // 检查按钮是否存在
    if (!darkModeToggle) {
        console.error('找不到夜间模式切换按钮，ID: darkModeToggle');
        return;
    }
    
    console.log('找到夜间模式按钮:', darkModeToggle);
    
    // 检查本地存储中的夜间模式设置
    const isDarkMode = localStorage.getItem('darkMode') === '1';
    console.log('当前夜间模式状态:', isDarkMode);
    
    // 应用夜间模式设置
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // 将toggleDarkMode添加到全局作用域
    window.toggleDarkMode = toggleDarkMode;
    
    console.log('已添加夜间模式切换事件');
}

// 初始化展示方式切换
function initViewMode() {
    console.log('开始初始化展示方式切换');
    
    // 获取按钮元素
    viewModeToggle = document.getElementById('viewModeToggle');
    
    // 检查按钮是否存在
    if (!viewModeToggle) {
        console.error('找不到展示方式切换按钮，ID: viewModeToggle');
        return;
    }
    
    console.log('找到展示方式切换按钮:', viewModeToggle);
    
    // 读取展示方式设置
    // 1. 优先从本地存储读取用户设置
    // 2. 如果本地存储没有设置，则尝试从JSON配置中读取
    // 3. 如果都没有，则使用默认值1（分组视图）
    const savedViewMode = localStorage.getItem('viewMode');
    if (savedViewMode) {
        currentViewMode = parseInt(savedViewMode);
        console.log('从本地存储读取展示方式:', currentViewMode);
    } else if (window.siteConfig && window.siteConfig.展示方式 && window.siteConfig.展示方式.当前模式 !== undefined) {
        currentViewMode = parseInt(window.siteConfig.展示方式.当前模式);
        console.log('从JSON配置读取展示方式:', currentViewMode);
        localStorage.setItem('viewMode', currentViewMode.toString());
    } else {
        console.log('使用默认展示方式:1(分组视图)');
    }
    
    // 更新图标
    updateViewModeIcon();
    
    // 应用视图模式
    if (currentViewMode === 1) { // 分组视图
        document.body.classList.add('grouped-view-mode');
        document.body.classList.remove('card-view-mode');
    } else { // 卡片视图
        document.body.classList.add('card-view-mode');
        document.body.classList.remove('grouped-view-mode');
    }
    
    // 将toggleViewMode添加到全局作用域
    window.toggleViewMode = toggleViewMode;
    
    console.log('已添加展示方式切换事件');
}

// 切换夜间模式
function toggleDarkMode() {
    console.log('执行夜间模式切换函数');
    
    if (!darkModeToggle) {
        console.error('切换夜间模式时找不到按钮');
        darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) {
            return;
        }
    }
    
    const isDarkMode = document.body.classList.toggle('dark-mode');
    console.log('切换后的夜间模式状态:', isDarkMode);
    
    // 更新图标
    darkModeToggle.innerHTML = isDarkMode 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
    
    // 保存设置到本地存储
    localStorage.setItem('darkMode', isDarkMode ? '1' : '0');
    console.log('夜间模式设置已保存到本地存储');
    
    // 添加视觉反馈
    darkModeToggle.classList.add('clicked');
    setTimeout(() => {
        darkModeToggle.classList.remove('clicked');
    }, 300);
    
    return false; // 阻止默认行为
}

// 切换展示方式
function toggleViewMode() {
    console.log('执行展示方式切换函数');
    
    if (!viewModeToggle) {
        console.error('切换展示方式时找不到按钮');
        viewModeToggle = document.getElementById('viewModeToggle');
        if (!viewModeToggle) {
            return;
        }
    }
    
    // 切换展示方式：1(分组) <-> 2(卡片)
    currentViewMode = currentViewMode === 1 ? 2 : 1;
    console.log('切换后的展示方式:', currentViewMode);
    
    // 保存设置到本地存储
    localStorage.setItem('viewMode', currentViewMode.toString());
    console.log('展示方式设置已保存到本地存储');
    
    // 更新图标
    updateViewModeIcon();
    
    // 添加视觉反馈
    viewModeToggle.classList.add('clicked');
    setTimeout(() => {
        viewModeToggle.classList.remove('clicked');
    }, 300);
    
    // 应用视图模式
    if (currentViewMode === 1) { // 分组视图
        document.body.classList.add('grouped-view-mode');
        document.body.classList.remove('card-view-mode');
    } else { // 卡片视图
        document.body.classList.add('card-view-mode');
        document.body.classList.remove('grouped-view-mode');
    }
    
    // 尝试获取全局存储的域名数据
    let domains = [];
    if (window.domainsData && Array.isArray(window.domainsData)) {
        domains = window.domainsData;
    } else if (domainsData && Array.isArray(domainsData)) {
        domains = domainsData;
    }
    
    if (domains.length === 0) {
        console.error('无法获取域名数据，将刷新页面');
        location.reload();
        return false;
    }
    
    // 重新应用筛选并渲染
    try {
        // 尝试获取domainsContainer
        const domainsContainer = document.getElementById('domainsContainer');
        if (!domainsContainer) {
            throw new Error('找不到域名容器');
        }
        
        // 保存当前滚动位置
        const scrollPosition = window.scrollY;
        
        // 清空容器
        domainsContainer.innerHTML = '';
        
        // 重新渲染当前视图
        if (currentViewMode === 1) {
            console.log('渲染分组视图，域名数量:', domains.length);
            // 按后缀对域名进行分组
            const domainsByTld = {};
            domains.forEach(domain => {
                if (!domainsByTld[domain.后缀]) {
                    domainsByTld[domain.后缀] = [];
                }
                domainsByTld[domain.后缀].push(domain);
            });
            
            // 遍历每个后缀分组
            Object.keys(domainsByTld).forEach(tld => {
                const tldDomains = domainsByTld[tld];
                
                // 创建后缀分组标题
                const tldHeader = document.createElement('div');
                tldHeader.className = 'tld-header';
                tldHeader.setAttribute('data-tld', tld);
                tldHeader.innerHTML = `
                    <h2 class="tld-title">
                        <i class="fas fa-globe tld-icon"></i>
                        ${tld}
                    </h2>
                    <span class="tld-count">${tldDomains.length} ${getText('domainCount')}</span>
                `;
                
                // 创建域名容器
                const tldContainer = document.createElement('div');
                tldContainer.className = 'domains-group';
                
                // 将标题和容器添加到主容器
                domainsContainer.appendChild(tldHeader);
                domainsContainer.appendChild(tldContainer);
                
                // 为每个域名创建卡片
                tldDomains.forEach(domain => {
                    // 创建域名卡片
                    const domainCard = createDomainCard(domain);
                    
                    // 将卡片添加到当前后缀容器
                    tldContainer.appendChild(domainCard);
                });
            });
        } else {
            console.log('渲染卡片视图，域名数量:', domains.length);
            // 卡片展示模式
            domains.forEach(domain => {
                // 创建域名卡片
                const domainCard = createDomainCard(domain);
                
                // 将卡片添加到容器
                domainsContainer.appendChild(domainCard);
            });
        }
        
        // 恢复滚动位置
        window.scrollTo(0, scrollPosition);
    } catch (error) {
        console.error('重新渲染视图失败:', error);
        // 如果出错，尝试刷新页面
        location.reload();
    }
    
    return false; // 阻止默认行为
}

// 更新展示方式图标
function updateViewModeIcon() {
    if (!viewModeToggle) return;
    
    viewModeToggle.innerHTML = currentViewMode === 1 
        ? '<i class="fas fa-th-large"></i>' 
        : '<i class="fas fa-th-list"></i>';
}

// 获取当前语言下的翻译文本
function getText(key) {
    if (!translations || !translations[currentLanguage]) {
        return key;
    }
    return translations[currentLanguage][key] || key;
}

// 应用语言设置
function applyLanguage(langCode) {
    if (!translations || !translations[langCode]) {
        console.error('无法找到语言包:', langCode);
        return;
    }

    currentLanguage = langCode;
    localStorage.setItem('language', langCode);
    
    // 更新页面标题
    document.title = getText('title');
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = getText('title');
    }
    
    // 更新统计卡片文本
    const totalDomainsTitle = document.querySelector('.stat-card:nth-child(1) .stat-title');
    const availableDomainsTitle = document.querySelector('.stat-card:nth-child(2) .stat-title');
    const soldDomainsTitle = document.querySelector('.stat-card:nth-child(3) .stat-title');
    
    if (totalDomainsTitle) totalDomainsTitle.textContent = getText('totalDomains');
    if (availableDomainsTitle) availableDomainsTitle.textContent = getText('availableDomains');
    if (soldDomainsTitle) soldDomainsTitle.textContent = getText('soldDomains');
    
    // 更新域名列表标题栏
    const domainListTitle = document.querySelector('.domain-list-title h2');
    const domainListSubtitle = document.querySelector('.domain-list-subtitle');
    
    if (domainListTitle) domainListTitle.textContent = getText('domainList');
    if (domainListSubtitle) domainListSubtitle.textContent = getText('selectDomainStatus');
    
    // 更新选项卡文本
    const allTab = document.querySelector('.domain-tab[data-filter="all"]');
    const availableTab = document.querySelector('.domain-tab[data-filter="available"]');
    const soldTab = document.querySelector('.domain-tab[data-filter="sold"]');
    const favoriteTab = document.querySelector('.domain-tab[data-filter="favorite"]');
    
    if (allTab) allTab.childNodes[0].textContent = getText('all') + ' ';
    if (availableTab) availableTab.childNodes[0].textContent = getText('available') + ' ';
    if (soldTab) soldTab.childNodes[0].textContent = getText('sold') + ' ';
    if (favoriteTab) favoriteTab.childNodes[0].textContent = getText('favorite') + ' ';
    
    // 更新筛选器
    const registrarLabel = document.querySelector('.filter-item:nth-child(1) .filter-label');
    const tldLabel = document.querySelector('.filter-item:nth-child(3) .filter-label');
    const allRegistrarsOption = document.querySelector('#registrarFilter option[value="all"]');
    const allTldsOption = document.querySelector('#tldFilter option[value="all"]');
    
    if (registrarLabel) registrarLabel.textContent = getText('registrar');
    if (tldLabel) tldLabel.textContent = getText('tldSuffix');
    if (allRegistrarsOption) allRegistrarsOption.textContent = getText('allRegistrars');
    if (allTldsOption) allTldsOption.textContent = getText('allTlds');
    
    // 更新筛选按钮
    const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
    const availableBtn = document.querySelector('.filter-btn[data-filter="available"]');
    const premiumBtn = document.querySelector('.filter-btn[data-filter="premium"]');
    
    if (allBtn) allBtn.textContent = getText('all');
    if (availableBtn) availableBtn.textContent = getText('purchasable');
    if (premiumBtn) premiumBtn.textContent = getText('premium');
    
    // 更新友情链接标题
    const friendLinksTitle = document.querySelector('.friend-links-title');
    if (friendLinksTitle) friendLinksTitle.textContent = getText('friendLinks');
    
    // 更新模态框文本
    const modalTitle = document.querySelector('.modal-title');
    const modalDomainLabel = document.querySelector('.domain-info p:nth-child(1)');
    const modalPriceLabel = document.querySelector('.domain-info p:nth-child(2)');
    const qrTip = document.querySelector('.qr-tip');
    
    if (modalTitle) modalTitle.textContent = getText('scanToBuy');
    if (modalDomainLabel) modalDomainLabel.innerHTML = `${getText('domain')} <span id="modalDomainName"></span>`;
    if (modalPriceLabel) modalPriceLabel.innerHTML = `${getText('price')} <span id="modalDomainPrice"></span>`;
    if (qrTip) qrTip.textContent = getText('scanWithWechat');
    
    // 更新分组视图中的"个域名"文本
    const tldCounts = document.querySelectorAll('.tld-count');
    if (tldCounts && tldCounts.length > 0) {
        tldCounts.forEach(tldCount => {
            const count = tldCount.textContent.split(' ')[0];
            tldCount.textContent = `${count} ${getText('domainCount')}`;
        });
    }
    
    // 重新渲染域名列表
    if (domainsData.length > 0) {
        // 先更新统计卡片
        updateDomainStats(domainsData);
        
        // 然后应用筛选条件
        if (applyFiltersFunction) {
            applyFiltersFunction();
        }
    }
}

// 初始化语言设置
function initLanguage() {
    console.log('初始化语言设置');
    
    // 0. 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const forceRefresh = urlParams.get('force') === 'true'; // 强制刷新缓存参数
    
    // 优先级处理：
    // 1. URL参数指定的语言
    // 2. 如果有force=true参数或JSON配置中有overrideLocal=true，则使用JSON配置
    // 3. 本地存储中的语言设置
    // 4. JSON配置文件中的语言设置
    // 5. 默认值zh-CN
    if (urlLang && translations[urlLang]) {
        currentLanguage = urlLang;
        localStorage.setItem('language', urlLang);
        console.log('从URL参数读取语言设置:', currentLanguage);
    } else if (forceRefresh || 
              (window.siteConfig && 
               window.siteConfig.语言设置 && 
               window.siteConfig.语言设置.覆盖本地设置 === true && 
               window.siteConfig.语言设置.当前语言)) {
        // 强制使用JSON配置
        currentLanguage = window.siteConfig.语言设置.当前语言;
        localStorage.setItem('language', currentLanguage);
        console.log('强制使用JSON配置的语言设置:', currentLanguage);
    } else {
        const savedLanguage = localStorage.getItem('language');
        
        if (savedLanguage && translations[savedLanguage]) {
            currentLanguage = savedLanguage;
            console.log('从本地存储读取语言设置:', currentLanguage);
        } else if (window.siteConfig && window.siteConfig.语言设置 && window.siteConfig.语言设置.当前语言) {
            currentLanguage = window.siteConfig.语言设置.当前语言;
            console.log('从JSON配置读取语言设置:', currentLanguage);
            localStorage.setItem('language', currentLanguage);
        } else {
            console.log('使用默认语言设置: zh-CN');
        }
    }
    
    // 应用语言设置
    applyLanguage(currentLanguage);
}

// 使用Fetch API获取域名数据
async function fetchDomains() {
    try {
        const response = await fetch('domains.json');
        
        if (!response.ok) {
            throw new Error(`HTTP 错误! 状态: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('获取到的数据:', data); // 添加日志输出查看数据
        
        // 设置网站配置
        siteConfig = data.网站配置 || {};
        // 将配置存储到全局变量
        window.siteConfig = siteConfig;
        console.log('网站配置:', siteConfig);
        
        // 应用网站配置
        applySiteConfig();
        
        // 获取域名列表
        domainsData = data.域名列表 || [];
        console.log('解析后的域名数据:', domainsData); // 检查域名列表是否正确获取
        
        // 确保domainsData是数组
        if (!Array.isArray(domainsData)) {
            console.error('域名数据不是数组:', domainsData);
            domainsData = [];
        }
        
        // 将域名数据存储到全局变量
        window.domainsData = domainsData;
        
        return domainsData;
    } catch (error) {
        console.error('获取域名数据时出错:', error);
        const domainsContainer = document.getElementById('domainsContainer');
        if(domainsContainer) {
            domainsContainer.innerHTML = `
                <div class="error-message">
                    <p>加载域名数据时出错。请稍后再试。</p>
                    <p>错误详情: ${error.message}</p>
                </div>
            `;
        }
        throw error;
    }
}

// 只保留一个DOMContentLoaded事件监听器，删除多余的
// 删除旧的602-641行的DOMContentLoaded事件处理程序
document.addEventListener('DOMContentLoaded', async function() {
    console.log('页面已加载');
    
    try {
        // 获取并应用网站配置
        await fetchDomains();
        console.log('获取域名数据成功');
        
        // 初始化页面设置
        initDarkMode();
        initViewMode();
        initLanguage(); // 添加语言初始化
        
        // 获取DOM元素
        const domainsContainer = document.getElementById('domainsContainer');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const domainTabs = document.querySelectorAll('.domain-tab');
        const qrModal = document.getElementById('qrModal');
        const closeModal = document.getElementById('closeModal');
        const modalDomainName = document.getElementById('modalDomainName');
        const modalDomainPrice = document.getElementById('modalDomainPrice');
        const qrCodeImage = document.getElementById('qrCodeImage');
        
        // 获取筛选器元素
        const registrarFilter = document.getElementById('registrarFilter');
        const tldFilter = document.getElementById('tldFilter');
        
        // 获取统计元素
        const totalDomainsEl = document.getElementById('totalDomains');
        const availableDomainsEl = document.getElementById('availableDomains');
        const soldDomainsEl = document.getElementById('soldDomains');
        
        // 获取标签计数元素
        const tabCountAll = document.getElementById('tabCountAll');
        const tabCountAvailable = document.getElementById('tabCountAvailable');
        const tabCountSold = document.getElementById('tabCountSold');
        const tabCountFavorite = document.getElementById('tabCountFavorite');
        
        // 填充后缀下拉菜单
        populateTldOptions();
        
        // 填充注册商下拉菜单
        populateRegistrarOptions();
        
        // 应用初始筛选并渲染
        applyFilters();
        updateDomainStats(domainsData);
    } catch (error) {
        console.error('初始化错误:', error);
    }
});

// 填充后缀下拉菜单（从数据中提取）
function populateTldOptions() {
    if (!tldFilter) return;
    
    // 获取所有不重复的后缀
    const tlds = [...new Set(domainsData.map(domain => domain.后缀))];
    
    // 清空现有选项（保留"全部"选项）
    while (tldFilter.options.length > 1) {
        tldFilter.remove(1);
    }
    
    // 添加后缀选项
    tlds.forEach(tld => {
        const option = document.createElement('option');
        option.value = tld;
        option.textContent = tld;
        tldFilter.appendChild(option);
    });
}

// 填充注册商下拉菜单（从数据中提取）
function populateRegistrarOptions() {
    if (!registrarFilter) return;
    
    // 获取所有不重复的注册商
    const registrars = [...new Set(domainsData.map(domain => domain.注册商))];
    
    // 清空现有选项（保留"全部"选项）
    while (registrarFilter.options.length > 1) {
        registrarFilter.remove(1);
    }
    
    // 添加注册商选项
    registrars.forEach(registrar => {
        const option = document.createElement('option');
        option.value = registrar;
        option.textContent = registrar;
        registrarFilter.appendChild(option);
    });
}

// 更新域名统计信息
function updateDomainStats(domains) {
    console.log('更新统计信息，域名数量:', domains.length); // 添加日志
    
    // 获取DOM元素
    const totalDomainsEl = document.getElementById('totalDomains');
    const availableDomainsEl = document.getElementById('availableDomains');
    const soldDomainsEl = document.getElementById('soldDomains');
    const tabCountAll = document.getElementById('tabCountAll');
    const tabCountAvailable = document.getElementById('tabCountAvailable');
    const tabCountSold = document.getElementById('tabCountSold');
    const tabCountFavorite = document.getElementById('tabCountFavorite');
    
    // 计算总域名数
    const totalCount = domains.length;
    
    // 计算待售域名数（可购买且非"非卖"的域名）
    const availableCount = domains.filter(domain => 
        domain.可购买 === "是" && domain.非卖 === "否"
    ).length;
    
    // 计算已售域名数（不可购买的域名）
    const soldCount = domains.filter(domain => 
        domain.可购买 === "否"
    ).length;
    
    // 计算收藏域名数（非卖域名）
    const favoriteCount = domains.filter(domain => 
        domain.非卖 === "是"
    ).length;
    
    console.log('统计结果:', {
        总域名: totalCount, 
        待售: availableCount, 
        已售: soldCount,
        收藏: favoriteCount
    }); // 添加日志
    
    // 更新统计卡片
    if (totalDomainsEl) totalDomainsEl.textContent = totalCount;
    if (availableDomainsEl) availableDomainsEl.textContent = availableCount;
    if (soldDomainsEl) soldDomainsEl.textContent = soldCount;
    
    // 更新标签计数
    if (tabCountAll) tabCountAll.textContent = totalCount;
    if (tabCountAvailable) tabCountAvailable.textContent = availableCount;
    if (tabCountSold) tabCountSold.textContent = soldCount;
    if (tabCountFavorite) tabCountFavorite.textContent = favoriteCount;
}

// 应用网站配置
function applySiteConfig() {
    const container = document.querySelector('.container');
    if (!container) {
        console.error('未找到主容器');
        return;
    }
    
    // 检查URL参数是否要求清除语言缓存
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clear_lang') === 'true') {
        localStorage.removeItem('language');
        console.log('已清除语言设置本地缓存');
        // 移除参数后重新加载页面
        const newUrl = window.location.pathname;
        window.location.href = newUrl;
        return;
    }
    
    if (window.siteConfig) {
        // 设置浏览器标签页标题
        if (window.siteConfig.标题) {
            document.title = window.siteConfig.标题;
        }
        
        // 更新页面上的标题
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            // 使用页面标题文本字段（如果存在），否则使用标题字段
            if (window.siteConfig.页面标题文本 !== undefined) {
                pageTitle.textContent = window.siteConfig.页面标题文本;
            } else if (window.siteConfig.标题) {
                pageTitle.textContent = window.siteConfig.标题;
            }
            
            // 处理标题的显示/隐藏
            if (window.siteConfig.显示标题 !== undefined) {
                pageTitle.style.display = window.siteConfig.显示标题 === 1 ? 'block' : 'none';
            }
        }
        
        if (window.siteConfig.图标) {
            // 检查是否已有favicon
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = window.siteConfig.图标;
        }
        
        // 应用语言设置
        if (window.siteConfig.语言设置 && window.siteConfig.语言设置.当前语言 !== undefined) {
            // 如果本地存储中没有设置，则使用JSON中的默认设置
            if (localStorage.getItem('language') === null) {
                const lang = window.siteConfig.语言设置.当前语言;
                localStorage.setItem('language', lang);
                console.log('从JSON配置中设置语言:', lang);
            }
        }
        
        // 应用夜间模式设置
        if (window.siteConfig.夜间模式 !== undefined) {
            // 如果本地存储中没有设置，则使用JSON中的默认设置
            if (localStorage.getItem('darkMode') === null) {
                const isDarkMode = window.siteConfig.夜间模式 === 1;
                localStorage.setItem('darkMode', window.siteConfig.夜间模式.toString());
                
                if (isDarkMode) {
                    document.body.classList.add('dark-mode');
                    const darkModeToggle = document.getElementById('darkModeToggle');
                    if (darkModeToggle) {
                        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                    }
                }
            }
        }
        
        // 应用展示方式设置
        if (window.siteConfig.展示方式 && window.siteConfig.展示方式.当前模式 !== undefined) {
            // 如果本地存储中没有设置，则使用JSON中的默认设置
            if (localStorage.getItem('viewMode') === null) {
                currentViewMode = parseInt(window.siteConfig.展示方式.当前模式);
                localStorage.setItem('viewMode', currentViewMode.toString());
                console.log('从JSON配置中设置展示方式:', currentViewMode);
                
                // 更新视图模式按钮图标
                updateViewModeIcon();
                
                // 应用视图模式
                if (currentViewMode === 1) { // 分组视图
                    document.body.classList.add('grouped-view-mode');
                    document.body.classList.remove('card-view-mode');
                } else { // 卡片视图
                    document.body.classList.add('card-view-mode');
                    document.body.classList.remove('grouped-view-mode');
                }
            }
        }
        
        // 应用界面设置
        applyInterfaceSettings();
        
        // 应用友情链接
        applyFriendLinks();
    }
}

// 应用界面设置
function applyInterfaceSettings() {
    // 默认使用分组视图
    document.body.classList.add('grouped-view-mode');
    document.body.classList.remove('card-view-mode');
    
    // 获取DOM元素
    const registrarFilter = document.getElementById('registrarFilter');
    const tldFilter = document.getElementById('tldFilter');
    const domainTabs = document.querySelectorAll('.domain-tab');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const qrModal = document.getElementById('qrModal');
    const closeModal = document.getElementById('closeModal');
    
    // 添加筛选器事件
    if (registrarFilter) {
        registrarFilter.addEventListener('change', function() {
            currentFilters.registrar = this.value;
            applyFilters();
        });
    }
    
    if (tldFilter) {
        tldFilter.addEventListener('change', function() {
            currentFilters.tld = this.value;
            applyFilters();
        });
    }
    
    // 添加域名状态标签事件
    if (domainTabs && domainTabs.length > 0) {
        domainTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // 移除所有标签的active类
                domainTabs.forEach(t => t.classList.remove('active'));
                // 添加当前标签的active类
                this.classList.add('active');
                
                // 更新当前筛选状态
                currentFilters.status = this.dataset.filter;
                
                // 应用筛选
                applyFilters();
            });
        });
    }
    
    // 添加筛选按钮事件
    if (filterButtons && filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // 移除所有按钮的active类
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // 添加当前按钮的active类
                this.classList.add('active');
                
                // 应用筛选
                filterDomains(this.dataset.filter);
            });
        });
    }
    
    // 添加模态框关闭事件
    if (closeModal && qrModal) {
        closeModal.addEventListener('click', () => {
            qrModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    // 点击模态框外部关闭
    if (qrModal) {
        window.addEventListener('click', (event) => {
            if (event.target === qrModal) {
                qrModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
}

// 渲染域名卡片
function renderDomains(domains) {
    // 获取域名容器
    const domainsContainer = document.getElementById('domainsContainer');
    if (!domainsContainer) {
        console.error('找不到域名容器元素 #domainsContainer');
        return;
    }
    
    // 清空容器
    domainsContainer.innerHTML = '';
    
    // 检查是否有数据
    if (domains.length === 0) {
        domainsContainer.innerHTML = `<p class="no-domains">${getText('no-domains-found')}</p>`;
        return;
    }
    
    // 根据当前展示方式选择渲染方法
    if (currentViewMode === 1) {
        // 分组展示模式
        renderGroupedDomains(domains);
        // 移除卡片模式类
        document.body.classList.remove('card-view-mode');
        document.body.classList.add('grouped-view-mode');
    } else {
        // 卡片展示模式
        renderCardDomains(domains);
        // 添加卡片模式类
        document.body.classList.add('card-view-mode');
        document.body.classList.remove('grouped-view-mode');
    }
}

// 分组展示模式渲染
function renderGroupedDomains(domains) {
    // 获取域名容器
    const domainsContainer = document.getElementById('domainsContainer');
    if (!domainsContainer) {
        console.error('找不到域名容器元素 #domainsContainer');
        return;
    }
    
    // 按后缀对域名进行分组
    const domainsByTld = {};
    domains.forEach(domain => {
        if (!domainsByTld[domain.后缀]) {
            domainsByTld[domain.后缀] = [];
        }
        domainsByTld[domain.后缀].push(domain);
    });
    
    // 遍历每个后缀分组
    Object.keys(domainsByTld).forEach(tld => {
        const tldDomains = domainsByTld[tld];
        
        // 创建后缀分组标题
        const tldHeader = document.createElement('div');
        tldHeader.className = 'tld-header';
        tldHeader.setAttribute('data-tld', tld);
        tldHeader.innerHTML = `
            <h2 class="tld-title">
                <i class="fas fa-globe tld-icon"></i>
                ${tld}
            </h2>
            <span class="tld-count">${tldDomains.length} ${getText('domainCount')}</span>
        `;
        
        // 创建域名容器
        const tldContainer = document.createElement('div');
        tldContainer.className = 'domains-group';
        
        // 将标题和容器添加到主容器
        domainsContainer.appendChild(tldHeader);
        domainsContainer.appendChild(tldContainer);
        
        // 为每个域名创建卡片
        tldDomains.forEach(domain => {
            // 创建域名卡片
            const domainCard = createDomainCard(domain);
            
            // 将卡片添加到当前后缀容器
            tldContainer.appendChild(domainCard);
        });
    });
}

// 卡片展示模式渲染
function renderCardDomains(domains) {
    // 获取域名容器
    const domainsContainer = document.getElementById('domainsContainer');
    if (!domainsContainer) {
        console.error('找不到域名容器元素 #domainsContainer');
        return;
    }
    
    // 直接渲染所有域名卡片，不分组
    domains.forEach(domain => {
        // 创建域名卡片
        const domainCard = createDomainCard(domain);
        
        // 将卡片添加到容器
        domainsContainer.appendChild(domainCard);
    });
}

// 全局函数，用于显示模态框
window.showModal = function(domainId) {
    // 获取域名数据
    const domain = domainsData.find(d => d.id === domainId);
    if (!domain) return;
    
    console.log('显示模态框', domain.前缀 + domain.后缀, domain.价格);
    
    // 获取DOM元素
    const qrModal = document.getElementById('qrModal');
    const modalDomainName = document.getElementById('modalDomainName');
    const modalDomainPrice = document.getElementById('modalDomainPrice');
    const qrCodeImage = document.getElementById('qrCodeImage');
    
    if (!qrModal || !modalDomainName || !modalDomainPrice || !qrCodeImage) {
        console.error('模态框相关DOM元素未找到');
        return;
    }
    
    // 设置模态框内容
    modalDomainName.textContent = domain.前缀 + domain.后缀;
    modalDomainPrice.textContent = formatPrice(domain.价格);
    
    // 设置二维码图片 - 使用固定的lx.png
    qrCodeImage.src = 'images/qrcodes/lx.png';
    qrCodeImage.style.display = 'block';
    
    // 显示模态框
    qrModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

// 关闭模态框按钮事件
document.addEventListener('DOMContentLoaded', function() {
    const closeModal = document.getElementById('closeModal');
    const qrModal = document.getElementById('qrModal');
    
    if (closeModal && qrModal) {
        closeModal.addEventListener('click', () => {
            qrModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    // 点击模态框外部关闭模态框
    if (qrModal) {
        qrModal.addEventListener('click', (e) => {
            if (e.target === qrModal) {
                qrModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && qrModal && qrModal.style.display === 'flex') {
            qrModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
});

// 应用所有筛选条件
function applyFilters() {
    // 根据当前的筛选条件筛选域名
    let filteredDomains = domainsData;
    
    // 获取DOM元素
    const domainsContainer = document.getElementById('domainsContainer');
    if (!domainsContainer) {
        console.error('找不到域名容器元素 #domainsContainer');
        return;
    }
    
    // 根据状态筛选
    if (currentFilters.status === 'available') {
        filteredDomains = filteredDomains.filter(domain => 
            domain.可购买 === "是" && domain.非卖 === "否"
        );
    } else if (currentFilters.status === 'premium' || currentFilters.status === 'favorite') {
        filteredDomains = filteredDomains.filter(domain => 
            domain.非卖 === "是"
        );
    } else if (currentFilters.status === 'sold') {
        filteredDomains = filteredDomains.filter(domain => 
            domain.可购买 === "否"
        );
    }
    
    // 根据注册商筛选
    if (currentFilters.registrar !== 'all') {
        filteredDomains = filteredDomains.filter(domain => 
            domain.注册商 === currentFilters.registrar
        );
    }
    
    // 根据后缀筛选
    if (currentFilters.tld !== 'all') {
        filteredDomains = filteredDomains.filter(domain => 
            domain.后缀 === currentFilters.tld
        );
    }
    
    // 渲染筛选后的域名
    renderDomains(filteredDomains);
}

// 筛选域名的通用函数（旧版本，保留向后兼容性）
function filterDomains(filter) {
    currentFilters.status = filter;
    applyFilters();
}

// 将applyFilters函数存储到全局变量中
applyFiltersFunction = applyFilters;

// 应用友情链接
function applyFriendLinks() {
    if (!window.siteConfig || !window.siteConfig.界面设置 || !window.siteConfig.界面设置.友情链接) {
        console.log('未找到友情链接配置');
        return;
    }
    
    const friendLinksConfig = window.siteConfig.界面设置.友情链接;
    const friendLinksContainer = document.getElementById('friendLinksContainer');
    const friendLinksList = document.getElementById('friendLinksList');
    
    if (!friendLinksContainer || !friendLinksList) {
        console.error('未找到友情链接容器');
        return;
    }
    
    // 如果配置为隐藏，则不显示友情链接部分
    if (friendLinksConfig.显示 !== 1) {
        friendLinksContainer.style.display = 'none';
        return;
    }
    
    // 显示友情链接部分
    friendLinksContainer.style.display = 'block';
    
    // 设置标题
    const titleElement = friendLinksContainer.querySelector('.friend-links-title');
    if (titleElement && friendLinksConfig.标题) {
        titleElement.textContent = friendLinksConfig.标题;
    }
    
    // 清空现有链接
    friendLinksList.innerHTML = '';
    
    // 为链接网站分配固定颜色
    const linkColors = {
        '阿里云': '#FF6A00',
        '腾讯云': '#2980b9',
        '华为云': '#C7000B',
        '西部数码': '#2ecc71',
        '百度智能云': '#3388FF'
    };
    
    // 生成固定颜色的函数（与注册商颜色生成类似）
    function getLinkColor(name) {
        // 预定义一组好看的颜色
        const colors = [
            '#3498db', // 蓝色
            '#2ecc71', // 绿色
            '#e74c3c', // 红色
            '#f39c12', // 橙色
            '#9b59b6', // 紫色
            '#1abc9c', // 青绿色
            '#d35400', // 深橙色
            '#c0392b', // 深红色
            '#16a085', // 深青色
            '#8e44ad', // 深紫色
            '#27ae60', // 深绿色
            '#2980b9', // 深蓝色
            '#f1c40f', // 黄色
            '#e67e22', // 橙黄色
            '#34495e'  // 深灰蓝色
        ];
        
        // 如果是已知网站，返回固定颜色
        if (linkColors[name]) {
            return linkColors[name];
        }
        
        // 对于未知网站，使用字符串哈希生成固定索引
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // 确保索引在颜色数组范围内
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }
    
    // 获取首字母的函数（与注册商首字母获取类似）
    function getFirstLetter(str) {
        if (!str) return 'A';
        
        // 如果是英文，直接返回第一个字母
        if (/^[A-Za-z]/.test(str)) {
            return str.charAt(0).toUpperCase();
        }
        
        // 如果是中文，直接返回第一个字符
        return str.charAt(0);
    }
    
    // 添加链接
    if (friendLinksConfig.链接列表 && Array.isArray(friendLinksConfig.链接列表)) {
        friendLinksConfig.链接列表.forEach(link => {
            if (link.名称 && link.网址) {
                const linkElement = document.createElement('a');
                linkElement.href = link.网址;
                linkElement.className = 'friend-link';
                linkElement.textContent = link.名称;
                linkElement.title = link.描述 || link.名称;
                linkElement.target = '_blank'; // 在新标签页打开
                linkElement.rel = 'noopener noreferrer'; // 安全设置
                
                // 设置首字母图标的样式
                const firstLetter = getFirstLetter(link.名称);
                const bgColor = getLinkColor(link.名称);
                
                // 使用CSS自定义属性设置首字母和颜色
                linkElement.style.setProperty('--first-letter', `"${firstLetter}"`);
                linkElement.style.setProperty('--bg-color', bgColor);
                
                // 或者使用内联样式
                linkElement.style.cssText = `--first-letter: "${firstLetter}"; --bg-color: ${bgColor};`;
                
                // 为不同网站设置不同背景色
                linkElement.style.borderLeftColor = bgColor;
                
                friendLinksList.appendChild(linkElement);
            }
        });
    }
}