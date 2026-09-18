/**
 * GreenShift v2.0 — Supabase Cloud Database Configuration
 * Cấu hình kết nối Cơ sở Dữ liệu Supabase (PostgreSQL)
 */
(function() {
  const DEFAULT_CONFIG = {
    // URL dự án Supabase
    url: 'https://uvdlqzlpnjwodhngpxyk.supabase.co',
    // Supabase Publishable / Anon API Key
    anonKey: 'sb_publishable_UNfFJrjAl8tU4xrB_cbowQ_gZKCo66K'
  };

  window.GREENSHIFT_SUPABASE_CONFIG = {
    url: DEFAULT_CONFIG.url,
    anonKey: DEFAULT_CONFIG.anonKey,

    getUrl() {
      const saved = localStorage.getItem('gs_supabase_url');
      return (saved && saved.trim()) ? saved.trim() : this.url;
    },

    getKey() {
      const saved = localStorage.getItem('gs_supabase_key');
      return (saved && saved.trim()) ? saved.trim() : this.anonKey;
    },

    setConfig(newUrl, newKey) {
      if (newUrl !== undefined) {
        localStorage.setItem('gs_supabase_url', (newUrl || '').trim());
      }
      if (newKey !== undefined) {
        localStorage.setItem('gs_supabase_key', (newKey || '').trim());
      }
    },

    isConfigured() {
      const u = this.getUrl();
      const k = this.getKey();
      return Boolean(u && k && u.startsWith('http') && k.length > 15);
    }
  };
})();
