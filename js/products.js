// js/products.js — Загрузка товаров из JSON, каталог, детали, заказ, галерея

// EmailJS
if (typeof emailjs !== 'undefined') emailjs.init('tdquCtSwQN3Y_BhMR');

let allProductsData = { products: [], categories: [] };
let currentImageIndex = 0;
let currentProductImages = [];

// === ЗАГРУЗКА ТОВАРОВ ===
async function loadProducts() {
    try {
        const r = await fetch('data/products.json?_=' + Date.now());
        if (r.ok) { allProductsData = await r.json(); }
        return allProductsData;
    } catch (e) {
        console.error('Ошибка загрузки товаров:', e);
        return { products: [], categories: [] };
    }
}

// === ГЛАВНАЯ — ПОПУЛЯРНЫЕ ТОВАРЫ ===
async function loadFeaturedProducts() {
    const data = await loadProducts();
    const container = document.getElementById('featured-products');
    if (!container) return;

    const featured = data.products.filter(p => p.featured && p.inStock);
    if (featured.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; grid-column:1/-1; color:var(--text-secondary);">Нет популярных товаров</div>';
        return;
    }

    container.innerHTML = featured.map(p => {
        const icon = getCategoryIcon(p.category);
        const hasImage = p.image && p.image !== '';
        return `
        <div class="product-card" onclick="location.href='product.html?id=${p.id}'">
            <div class="product-card-img">
                ${hasImage ? `<img src="images/products/${p.image}" alt="${escapeHtml(p.title)}" onerror="this.parentElement.innerHTML='<i class=\\'fas ${icon}\\' style=\\'font-size:64px;\\'></i>'">` : `<i class="fas ${icon}" style="font-size:64px;"></i>`}
            </div>
            <div class="product-card-body">
                <div class="product-card-title">${escapeHtml(p.title)}</div>
                <div class="product-card-desc">${escapeHtml(p.description)}</div>
                <div class="product-card-price">${formatPrice(p.price)}${p.oldPrice ? `<span class="old">${formatPrice(p.oldPrice)}</span>` : ''}</div>
            </div>
        </div>`;
    }).join('');
}

// === КАТАЛОГ ===
async function loadCatalog() {
    const container = document.getElementById('catalog-products');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding:60px; grid-column:1/-1;">Загрузка...</div>';

    const data = await loadProducts();
    if (!data.products || data.products.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:60px; grid-column:1/-1;"><i class="fas fa-box-open" style="font-size:48px; opacity:0.5;"></i><h3 style="margin-top:16px;">Нет товаров</h3></div>';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const activeCategory = urlParams.get('category');

    // Фильтры
    const filterContainer = document.getElementById('categories-filter');
    if (filterContainer && data.categories) {
        filterContainer.innerHTML = `
            <button class="filter-btn ${!activeCategory ? 'active' : ''}" data-category="all">Все (${data.products.length})</button>
            ${data.categories.map(cat => {
                const count = data.products.filter(p => p.category === cat.id).length;
                return `<button class="filter-btn ${activeCategory === cat.id ? 'active' : ''}" data-category="${cat.id}"><i class="fas ${cat.icon}"></i> ${cat.name} (${count})</button>`;
            }).join('')}
        `;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.dataset.category;
                window.location.href = cat === 'all' ? 'catalog.html' : `catalog.html?category=${cat}`;
            });
        });
    }

    let products = data.products;
    if (activeCategory && activeCategory !== 'all') products = data.products.filter(p => p.category === activeCategory);

    if (products.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:60px; grid-column:1/-1;"><h3>Нет товаров в этой категории</h3></div>';
    } else {
        container.innerHTML = products.map(p => renderProductCard(p)).join('');
    }
}

function renderProductCard(p) {
    const icon = getCategoryIcon(p.category);
    const hasImage = p.image && p.image !== '';
    const hasModel = p.model3d && p.model3d !== '';
    return `
    <div class="product-card" onclick="location.href='product.html?id=${p.id}'">
        <div class="product-card-img">
            ${hasImage ? `<img src="images/products/${p.image}" alt="${escapeHtml(p.title)}" onerror="this.parentElement.innerHTML='<i class=\\'fas ${icon}\\' style=\\'font-size:64px;\\'></i>'">` : `<i class="fas ${icon}" style="font-size:64px;"></i>`}
        </div>
        <div class="product-card-body">
            <div class="product-card-title">${escapeHtml(p.title)}</div>
            <div class="product-card-desc">${escapeHtml(p.description)}</div>
            <div class="product-card-price">${formatPrice(p.price)}${p.oldPrice ? `<span class="old">${formatPrice(p.oldPrice)}</span>` : ''}</div>
            ${!p.inStock ? '<div class="out-of-stock">Нет в наличии</div>' : ''}
            ${hasModel ? '<div style="margin-top:8px; font-size:12px; color:var(--accent-green);"><i class="fas fa-cube"></i> 3D модель</div>' : ''}
        </div>
    </div>`;
}

// === ДЕТАЛИ ТОВАРА ===
async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const data = await loadProducts();
    const product = data.products.find(p => p.id === productId);
    const container = document.getElementById('product-detail');
    if (!container) return;

    if (!product) {
        container.innerHTML = '<div style="text-align:center; padding:60px;">Товар не найден</div>';
        return;
    }

    const hasImage = product.image && product.image !== '';
    const icon = getCategoryIcon(product.category);

    // Собираем все изображения: главное + дополнительные
    currentProductImages = [];
    if (hasImage) currentProductImages.push(`images/products/${product.image}`);
    if (product.images && Array.isArray(product.images)) {
        product.images.forEach(img => {
            if (img && img !== product.image) {
                currentProductImages.push(`images/products/${img}`);
            }
        });
    }
    // Если нет ни одного изображения — показываем иконку
    const hasAnyImage = currentProductImages.length > 0;
    const mainImagePath = hasAnyImage ? currentProductImages[0] : null;

    const hasModel = product.model3d && product.model3d !== '';

    container.innerHTML = `
        <div class="product-detail-container">
            <div>
                <div class="product-img-large" id="mainImageContainer">
                    ${mainImagePath
                        ? `<img src="${mainImagePath}" alt="${escapeHtml(product.title)}" id="mainProductImage" onerror="this.parentElement.innerHTML='<i class=\\'fas ${icon}\\' style=\\'font-size:120px;\\'></i>'">`
                        : `<i class="fas ${icon}" style="font-size:120px;"></i>`}
                </div>
                ${currentProductImages.length > 1 ? `
                <div class="thumbnails-container">
                    ${currentProductImages.map((img, idx) => `<div class="thumbnail ${idx === 0 ? 'active' : ''}" data-index="${idx}"><img src="${img}" onerror="this.parentElement.style.display='none'"></div>`).join('')}
                </div>` : ''}
            </div>
            <div class="product-info-section">
                <h1 style="font-size:32px; margin-bottom:12px;">${escapeHtml(product.title)}</h1>
                <div style="font-size:28px; color:var(--accent-green); margin-bottom:12px; font-family:'Cormorant Garamond',serif;">
                    ${formatPrice(product.price)}
                    ${product.oldPrice ? `<span style="text-decoration:line-through; font-size:18px; margin-left:10px; color:var(--text-secondary);">${formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                <div style="margin-bottom:20px;">
                    ${product.inStock ? '<span style="color:green;">✓ В наличии</span>' : '<span style="color:#e74c3c;">✗ Нет в наличии</span>'}
                    <span style="margin-left:12px; color:var(--text-secondary); font-size:14px;">${getCategoryName(product.category)}</span>
                </div>
                <p style="line-height:1.7; margin-bottom:24px; color:var(--text-secondary);">${escapeHtml(product.description) || 'Описание отсутствует'}</p>
                ${product.inStock ? `<button class="btn-primary" style="width:100%; padding:16px;" id="orderProductBtn">🛒 Заказать сейчас</button>` : '<button class="btn-secondary" style="width:100%; padding:16px;" disabled>Нет в наличии</button>'}
                ${hasModel ? `<button class="model-viewer-btn" onclick="open3DViewer('${escapeHtml(product.model3d)}')"><i class="fas fa-cube"></i> Просмотреть 3D модель</button>` : ''}
            </div>
        </div>
    `;

    initImageGallery();

    // Клик на главное фото — увеличение
    const mainContainer = document.getElementById('mainImageContainer');
    if (mainContainer && hasAnyImage) {
        mainContainer.addEventListener('click', () => {
            currentImageIndex = 0;
            const modal = document.getElementById('imageModal');
            const modalImage = document.getElementById('modalImage');
            if (modal && modalImage) {
                modalImage.src = currentProductImages[0];
                modal.classList.add('active');
                updateCounter();
            }
        });
    }

    if (product.inStock) {
        const btn = document.getElementById('orderProductBtn');
        if (btn) btn.addEventListener('click', () => showOrderModal(product));
    }
}

// === ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ ===
function initImageGallery() {
    const mainImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const modal = document.getElementById('imageModal');
    if (!modal || currentProductImages.length === 0) return;

    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');
    const prevBtn = document.querySelector('.nav-prev');
    const nextBtn = document.querySelector('.nav-next');
    const counter = document.getElementById('imageCounter');

    // Клик по миниатюрам — смена главного фото
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(thumb.dataset.index);
            currentImageIndex = idx;
            if (mainImage) mainImage.src = currentProductImages[idx];
            thumbnails.forEach((t, i) => t.classList.toggle('active', i === idx));
        });
    });

    function updateCounter() { if (counter) counter.textContent = `${currentImageIndex + 1} / ${currentProductImages.length}`; }
    function showPrev() { currentImageIndex = (currentImageIndex - 1 + currentProductImages.length) % currentProductImages.length; modalImage.src = currentProductImages[currentImageIndex]; updateCounter(); }
    function showNext() { currentImageIndex = (currentImageIndex + 1) % currentProductImages.length; modalImage.src = currentProductImages[currentImageIndex]; updateCounter(); }

    if (closeModal) closeModal.addEventListener('click', () => modal.classList.remove('active'));
    if (prevBtn) prevBtn.addEventListener('click', e => { e.stopPropagation(); showPrev(); });
    if (nextBtn) nextBtn.addEventListener('click', e => { e.stopPropagation(); showNext(); });
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
    document.addEventListener('keydown', e => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'Escape') modal.classList.remove('active');
        else if (e.key === 'ArrowLeft') showPrev();
        else if (e.key === 'ArrowRight') showNext();
    });
}

// === Открыть модалку галереи (вызывается из клика на главное фото) ===
function updateCounter() {
    const counter = document.getElementById('imageCounter');
    if (counter) counter.textContent = `${currentImageIndex + 1} / ${currentProductImages.length}`;
}

// === МОДАЛЬНОЕ ОКНО ЗАКАЗА ===
function showOrderModal(product) {
    const modal = document.createElement('div');
    modal.id = 'orderModal';
    modal.innerHTML = `
        <div>
            <h2 style="margin-bottom:20px; font-family:'Cormorant Garamond',serif; font-size:28px;">🛒 Оформление заказа</h2>
            <div style="margin-bottom:20px; padding:16px; background:var(--bg-surface); border-radius:12px; border:1px solid var(--border);">
                <p><strong>Товар:</strong> ${escapeHtml(product.title)}</p>
                <p><strong>Цена:</strong> ${formatPrice(product.price)}</p>
                <p><strong>Категория:</strong> ${getCategoryName(product.category)}</p>
            </div>
            <form id="orderForm">
                <div style="margin-bottom:16px;"><label>👤 Ваше имя *</label><input type="text" id="oName" required></div>
                <div style="margin-bottom:16px;"><label>📧 Email *</label><input type="email" id="oEmail" required></div>
                <div style="margin-bottom:16px;"><label>📞 Телефон *</label><input type="tel" id="oPhone" required></div>
                <div style="margin-bottom:16px;"><label>🎨 Цвет / Материал</label><input type="text" id="oColor" placeholder="Например: Дуб натуральный"></div>
                <div style="margin-bottom:16px;"><label>📦 Количество *</label><input type="number" id="oQty" value="1" min="1" required></div>
                <div style="margin-bottom:16px;">
                    <label>🚚 Способ получения *</label>
                    <div style="display:flex; gap:20px; margin-top:8px;">
                        <label style="display:flex; align-items:center; gap:8px;"><input type="radio" name="delivery" value="delivery" checked> Доставка</label>
                        <label style="display:flex; align-items:center; gap:8px;"><input type="radio" name="delivery" value="pickup"> Самовывоз</label>
                    </div>
                </div>
                <div id="addressField" style="margin-bottom:16px;"><label>🏠 Адрес доставки</label><input type="text" id="oAddress" placeholder="Город, улица, дом, квартира"></div>
                <div style="margin-bottom:24px;"><label>💬 Пожелания</label><textarea id="oMessage" rows="3" placeholder="Дополнительные пожелания..."></textarea></div>
                <div style="display:flex; gap:12px;">
                    <button type="submit" class="btn-primary" style="flex:1; border-radius:8px;">📤 Отправить заказ</button>
                    <button type="button" id="closeModalBtn" class="btn-secondary" style="flex:1; border-radius:8px; background:#e74c3c; color:white; border:none;">❌ Отмена</button>
                </div>
            </form>
            <div id="orderStatus" style="margin-top:16px; text-align:center;"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // Показ/скрытие адреса
    modal.querySelectorAll('input[name="delivery"]').forEach(r => {
        r.addEventListener('change', e => {
            document.getElementById('addressField').style.display = e.target.value === 'delivery' ? 'block' : 'none';
        });
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    document.getElementById('orderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const deliveryVal = modal.querySelector('input[name="delivery"]:checked').value;
        const orderData = {
            orderId: generateOrderId(),
            customerName: document.getElementById('oName').value,
            customerEmail: document.getElementById('oEmail').value,
            customerPhone: document.getElementById('oPhone').value,
            furnitureType: getCategoryName(product.category),
            productName: product.title,
            color: document.getElementById('oColor').value || 'Не указан',
            price: product.price,
            quantity: parseInt(document.getElementById('oQty').value),
            delivery: deliveryVal === 'delivery' ? 'Доставка' : 'Самовывоз',
            address: deliveryVal === 'delivery' ? document.getElementById('oAddress').value : 'Самовывоз',
            message: document.getElementById('oMessage').value || '',
            status: 'новый',
            createdAt: new Date().toISOString()
        };

        const statusDiv = document.getElementById('orderStatus');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true; submitBtn.textContent = '⏳ Отправка...';
        statusDiv.innerHTML = '<div style="color:var(--accent-green);">💾 Сохранение заказа...</div>';

        // Сохраняем заказ
        await saveOrder(orderData);

        // Пытаемся отправить email
        if (typeof emailjs !== 'undefined') {
            try {
                await emailjs.send('whiteoak', 'template_ec3phrc', { ...orderData, time: new Date().toLocaleString('ru-RU') });
                statusDiv.innerHTML = `<div style="color:#155724; padding:12px; background:#d4edda; border-radius:8px;">✅ Заказ #${orderData.orderId} оформлен!<br>Менеджер свяжется с вами.</div>`;
            } catch (err) {
                statusDiv.innerHTML = `<div style="color:#856404; padding:12px; background:#fff3cd; border-radius:8px;">⚠️ Заказ #${orderData.orderId} сохранён, но письмо не отправлено.</div>`;
            }
        } else {
            statusDiv.innerHTML = `<div style="color:#155724; padding:12px; background:#d4edda; border-radius:8px;">✅ Заказ #${orderData.orderId} оформлен!</div>`;
        }
        setTimeout(() => modal.remove(), 4000);
    });
}

// === СОХРАНЕНИЕ ЗАКАЗА (клиентская версия — только EmailJS) ===
async function saveOrder(orderData) {
    // Локальный бэкап в localStorage
    try {
        let localOrders = JSON.parse(localStorage.getItem('whiteoak_orders') || '[]');
        localOrders.push(orderData);
        localStorage.setItem('whiteoak_orders', JSON.stringify(localOrders));
        console.log('[📦] Заказ #' + orderData.orderId + ' сохранён в localStorage');
    } catch(e) {
        console.warn('localStorage недоступен:', e.message);
    }

    // Отправляем email через EmailJS
    if (typeof emailjs !== 'undefined') {
        try {
            await emailjs.send('whiteoak', 'template_ec3phrc', {
                ...orderData,
                to_email: 'yarich92@gmail.com',
                time: new Date().toLocaleString('ru-RU')
            });
            console.log('[✉️] Email отправлен для заказа #' + orderData.orderId);
        } catch (err) {
            console.warn('[✉️] Ошибка отправки email:', err);
        }
    }
}

// === 3D VIEWER (Three.js) ===
let scene, camera, renderer, controls, currentModel, animationId;

function open3DViewer(modelPath) {
    const modal = document.getElementById('modelViewerModal');
    const canvas = document.getElementById('modelViewerCanvas');
    const title = document.getElementById('modelViewerTitle');
    if (!modal || !canvas) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Размер canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100;

    // Инициализация Three.js
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f1eb);

    camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
    camera.position.set(3, 2, 3);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.width, canvas.height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Сетка-пол
    const gridHelper = new THREE.GridHelper(10, 20, 0xe0d8ce, 0xe0d8ce);
    scene.add(gridHelper);

    // OrbitControls
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

    // Загрузка модели
    const loader = new THREE.GLTFLoader();
    loader.load(
        modelPath,
        function (gltf) {
            currentModel = gltf.scene;
            // Автоматическое масштабирование и центрирование
            const box = new THREE.Box3().setFromObject(currentModel);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            currentModel.scale.set(scale, scale, scale);

            const center = box.getCenter(new THREE.Vector3());
            currentModel.position.sub(center.multiplyScalar(scale));

            scene.add(currentModel);

            // Камера смотрит на центр
            controls.target.set(0, size.y * scale / 2, 0);
            camera.position.set(3, 2, 3);
            controls.update();

            if (title) title.textContent = '3D модель';
        },
        function (progress) {
            if (title) title.textContent = 'Загрузка... ' + Math.round((progress.loaded / progress.total) * 100) + '%';
        },
        function (error) {
            console.error('Ошибка загрузки GLB:', error);
            if (title) title.textContent = 'Ошибка загрузки модели';
        }
    );

    // Анимация
    function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

function close3DViewer() {
    const modal = document.getElementById('modelViewerModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';

    if (animationId) cancelAnimationFrame(animationId);
    if (renderer) renderer.dispose();
    if (controls) controls.dispose();
    if (scene) {
        scene.traverse(function (obj) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
    }
    scene = null; camera = null; renderer = null; controls = null; currentModel = null;
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    // Определяем страницу
    if (document.getElementById('featured-products')) loadFeaturedProducts();
    if (document.getElementById('catalog-products')) loadCatalog();
    if (document.getElementById('product-detail')) loadProductDetail();
});
