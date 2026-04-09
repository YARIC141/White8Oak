// js/main.js — Общие функции: тема, утилиты

// === ТЁМНАЯ ТЕМА ===
const themeToggleBtn = document.getElementById('themeToggleBtn');
if (themeToggleBtn) {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggleBtn.innerHTML = '☀️ Светлая';
    }
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        themeToggleBtn.innerHTML = isDark ? '☀️ Светлая' : '🌙 Тёмная';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// === КОПИРОВАНИЕ EMAIL ===
const copyBtn = document.getElementById('copyEmailBtn');
if (copyBtn) {
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('yarich92@gmail.com');
        const original = copyBtn.innerText;
        copyBtn.innerText = '✓ Скопировано!';
        setTimeout(() => copyBtn.innerText = original, 2000);
    });
}

// === УТИЛИТЫ ===
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

function getCategoryName(id) {
    const map = { tables: 'Столы', chairs: 'Кресла и стулья', beds: 'Кровати', shelves: 'Шкафы и комоды', nightstands: 'Тумбы', chests: 'Комоды' };
    return map[id] || id;
}

function getCategoryIcon(id) {
    const map = { tables: 'fa-table', chairs: 'fa-chair', beds: 'fa-bed', shelves: 'fa-layer-group', nightstands: 'fa-draw-polygon', chests: 'fa-archive' };
    return map[id] || 'fa-couch';
}

function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function formatPrice(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
}
