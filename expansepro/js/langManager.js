// Language management for Hindi and Gujarati
const LANGS = ['en', 'hi', 'gu'];
let currentLang = localStorage.getItem('lang') || 'en';
let translations = {};

function loadLangFile(lang, cb) {
    fetch(`lang/${lang}.json`)
        .then(res => res.json())
        .then(data => {
            translations = data;
            cb && cb();
        });
}

function updateTextNodes() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            el.innerHTML = translations[key];
        }
    });
}

export function toggleLanguage() {
    const idx = LANGS.indexOf(currentLang);
    currentLang = LANGS[(idx + 1) % LANGS.length];
    localStorage.setItem('lang', currentLang);
    loadLangFile(currentLang, updateTextNodes);
}

export function initLanguage() {
    loadLangFile(currentLang, updateTextNodes);
}
