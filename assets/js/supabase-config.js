/**
 * GreenShift v2.0 - Supabase Cloud Database Configuration
 * Cau hinh ket noi Co so Du lieu Supabase (PostgreSQL)
 */
(function() {
  const DEFAULT_CONFIG = {
    // URL du an Supabase (Cau hinh qua localStorage hoac bien moi truong, khong hardcode key san xuat)
    url: '',
    // Supabase Publishable / Anon API Key
    anonKey: ''
  };

  window.GREENSHIFT_SUPABASE_CONFIG = {
    url: DEFAULT_CONFIG.url,
    anonKey: DEFAULT_CONFIG.anonKey,

    getUrl() {
      const saved = (typeof localStorage !== 'undefined') ? localStorage.getItem('gs_supabase_url') : null;
      return (saved && saved.trim()) ? saved.trim() : (this.url || '');
    },

    getKey() {
      const saved = (typeof localStorage !== 'undefined') ? localStorage.getItem('gs_supabase_key') : null;
      return (saved && saved.trim()) ? saved.trim() : (this.anonKey || '');
    },

    setConfig(newUrl, newKey) {
      if (typeof localStorage !== 'undefined') {
        if (newUrl !== undefined) {
          localStorage.setItem('gs_supabase_url', (newUrl || '').trim());
        }
        if (newKey !== undefined) {
          localStorage.setItem('gs_supabase_key', (newKey || '').trim());
        }
      }
    },

    isConfigured() {
      const u = this.getUrl();
      const k = this.getKey();
      return Boolean(u && k && u.startsWith('http') && k.length > 15 && !k.includes('your_'));
    }
  };
})();
