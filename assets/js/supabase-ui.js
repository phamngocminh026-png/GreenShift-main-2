/**
 * GreenShift v2.0 — Supabase UI Component & Database Settings Modal
 * Cung cấp huy hiệu trạng thái Cloud Sync và Modal cấu hình kết nối CSDL trực quan
 */

(function(window) {
  'use strict';

  function injectCSS() {
    if (document.getElementById('greenshift-db-ui-css')) return;
    const style = document.createElement('style');
    style.id = 'greenshift-db-ui-css';
    style.textContent = `
      .cloud-sync-status-badge {
        display: none !important;
      }
      .cloud-sync-status-badge:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(0,0,0,0.15);
      }
      .badge-connected {
        background: #e6f7ec;
        color: #0d8a43;
        border: 1px solid #a3e6be;
      }
      .badge-syncing {
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
      }
      .badge-local {
        background: #fefce8;
        color: #a16207;
        border: 1px solid #fde047;
      }
      .badge-error {
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fca5a5;
      }

      /* Modal Styling */
      .gs-db-modal-backdrop {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.25s ease;
      }
      .gs-db-modal-backdrop.active {
        opacity: 1;
        visibility: visible;
      }
      .gs-db-modal-box {
        background: #ffffff;
        border-radius: 16px;
        width: 90%;
        max-width: 520px;
        padding: 24px 28px;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1);
        transform: scale(0.95);
        transition: transform 0.25s ease;
      }
      .gs-db-modal-backdrop.active .gs-db-modal-box {
        transform: scale(1);
      }
      .gs-db-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 12px;
      }
      .gs-db-modal-title {
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .gs-db-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #64748b;
        line-height: 1;
      }
      .gs-db-form-group {
        margin-bottom: 16px;
      }
      .gs-db-form-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 6px;
      }
      .gs-db-input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
      }
      .gs-db-input:focus {
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
      }
      .gs-db-status-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 20px;
        font-size: 13px;
        color: #475569;
      }
      .gs-db-btn-row {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .gs-db-btn {
        padding: 9px 18px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
      }
      .gs-db-btn-secondary {
        background: #f1f5f9;
        color: #475569;
      }
      .gs-db-btn-secondary:hover {
        background: #e2e8f0;
      }
      .gs-db-btn-primary {
        background: #10b981;
        color: #ffffff;
      }
      .gs-db-btn-primary:hover {
        background: #059669;
      }
    `;
    document.head.appendChild(style);
  }

  function createModal() {
    if (document.getElementById('gs-db-settings-modal')) return;

    const modalHTML = `
      <div id="gs-db-settings-modal" class="gs-db-modal-backdrop">
        <div class="gs-db-modal-box">
          <div class="gs-db-modal-header">
            <div class="gs-db-modal-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
              Cài Đặt Cơ Sở Dữ Liệu Supabase
            </div>
            <button class="gs-db-modal-close" onclick="GreenShiftDB_UI.closeModal()">&times;</button>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 0; margin-bottom: 16px;">
            Kết nối CSDL Supabase (PostgreSQL) để đồng bộ dữ liệu đám mây đa thiết bị. Hệ thống hoạt động theo mô hình <strong>Local-First</strong> (tính toán tức thì, không gián đoạn kể cả khi mất mạng).
          </p>

          <div class="gs-db-form-group">
            <label class="gs-db-form-label">Supabase Project URL</label>
            <input type="text" id="gs-modal-db-url" class="gs-db-input" placeholder="https://xyzcompany.supabase.co" />
          </div>

          <div class="gs-db-form-group">
            <label class="gs-db-form-label">Supabase Anon / Public API Key</label>
            <input type="password" id="gs-modal-db-key" class="gs-db-input" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
          </div>

          <div id="gs-modal-status-box" class="gs-db-status-box">
            <div id="gs-modal-status-text"><span class="status-indicator-dot dot-yellow" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#eab308;margin-right:6px;"></span>Đang chạy ở chế độ cục bộ (Local Mode). Chưa kết nối CSDL Supabase.</div>
            <div id="gs-modal-status-sub" style="font-size: 12px; color: #94a3b8; margin-top: 4px;"></div>
          </div>

          <div class="gs-db-btn-row" style="display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;">
            <button class="gs-db-btn gs-db-btn-secondary" onclick="GreenShiftDB_UI.testConnectionFromModal()">Kiểm Tra Kết Nối</button>
            <button class="gs-db-btn gs-db-btn-secondary" style="background: #e0f2fe; color: #0369a1;" onclick="GreenShiftDB_UI.pullFromCloudFromModal()">Kéo từ Cloud</button>
            <button class="gs-db-btn gs-db-btn-primary" onclick="GreenShiftDB_UI.saveAndSyncFromModal()">Đồng Bộ 2 Chiều</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function injectBadge() {
    if (document.querySelector('.cloud-sync-status-badge')) return;

    // Tìm vị trí thích hợp trên navbar
    const target = document.querySelector('.header-actions') || 
                   document.querySelector('.nav-actions') || 
                   document.querySelector('.user-profile') ||
                   document.querySelector('header nav');

    const badge = document.createElement('div');
    badge.className = 'cloud-sync-status-badge badge-local';
    badge.innerHTML = '<span class="status-indicator-dot dot-yellow" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#eab308;margin-right:6px;"></span><span class="sync-text">Local Mode</span>';
    badge.title = 'Trạng thái CSDL. Nhấp để xem và cấu hình Supabase.';
    badge.onclick = () => GreenShiftDB_UI.openModal();

    if (target) {
      target.insertBefore(badge, target.firstChild);
    } else {
      // Nếu không tìm thấy header, đặt ở góc trên bên phải
      badge.style.position = 'fixed';
      badge.style.top = '14px';
      badge.style.right = '16px';
      badge.style.zIndex = '9999';
      document.body.appendChild(badge);
    }
  }

  const GreenShiftDB_UI = {
    openModal() {
      const modal = document.getElementById('gs-db-settings-modal');
      if (!modal) return;

      const config = window.GREENSHIFT_SUPABASE_CONFIG;
      const urlInput = document.getElementById('gs-modal-db-url');
      const keyInput = document.getElementById('gs-modal-db-key');

      if (urlInput) urlInput.value = config ? config.getUrl() : '';
      if (keyInput) keyInput.value = config ? config.getKey() : '';

      this.updateModalStatus();
      modal.classList.add('active');
    },

    closeModal() {
      const modal = document.getElementById('gs-db-settings-modal');
      if (modal) modal.classList.remove('active');
    },

    updateModalStatus() {
      const statusText = document.getElementById('gs-modal-status-text');
      const statusSub = document.getElementById('gs-modal-status-sub');
      const config = window.GREENSHIFT_SUPABASE_CONFIG;

      if (!config || !config.isConfigured()) {
        if (statusText) statusText.innerHTML = '<span class="status-indicator-dot dot-yellow" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#eab308;margin-right:6px;"></span><strong>Local Mode</strong> — Dữ liệu đang lưu an toàn trên máy.';
        if (statusSub) statusSub.textContent = 'Dán URL & Key từ Supabase Dashboard (Settings > API) rồi nhấn "Kiểm Tra Kết Nối".';
      } else {
        const lastSync = localStorage.getItem('gs_last_sync_time') || 'Chưa đồng bộ';
        if (statusText) statusText.innerHTML = '<span class="status-indicator-dot dot-green" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;margin-right:6px;"></span><strong>Đã cấu hình Supabase Cloud</strong>';
        if (statusSub) statusSub.textContent = `Lần đồng bộ gần nhất: ${lastSync}`;
      }
    },

    async testConnectionFromModal() {
      const urlInput = document.getElementById('gs-modal-db-url');
      const keyInput = document.getElementById('gs-modal-db-key');
      const statusText = document.getElementById('gs-modal-status-text');
      const statusSub = document.getElementById('gs-modal-status-sub');

      const url = urlInput ? urlInput.value.trim() : '';
      const key = keyInput ? keyInput.value.trim() : '';

      if (!url || !key) {
        alert('Vui lòng nhập đầy đủ Supabase Project URL và Anon Key.');
        return;
      }

      if (statusText) statusText.innerHTML = '<span class="status-indicator-dot dot-blue" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#0284c7;margin-right:6px;"></span>Đang kiểm tra kết nối tới Supabase...';

      // Tạm lưu để test
      window.GREENSHIFT_SUPABASE_CONFIG.setConfig(url, key);
      window.GreenShiftDB.resetClient();

      const res = await window.GreenShiftDB.testConnection();
      const safeEscape = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
      };

      if (res.connected) {
        if (statusText) statusText.innerHTML = `<span class="status-indicator-dot dot-green" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;margin-right:6px;"></span><strong>Thành công!</strong> ${safeEscape(res.message)}`;
        if (statusSub) statusSub.textContent = 'Đã đối soát thành công bảng facilities. Sẵn sàng đồng bộ.';
        window.GreenShiftDB.updateStatusBadge('connected');
      } else {
        if (statusText) statusText.innerHTML = `<span class="status-indicator-dot dot-red" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#dc2626;margin-right:6px;"></span><strong>Lỗi kết nối:</strong> ${safeEscape(res.error)}`;
        if (statusSub) statusSub.textContent = 'Vui lòng kiểm tra lại URL/Key hoặc chạy file greenshift_supabase.sql trên Supabase.';
        window.GreenShiftDB.updateStatusBadge('error');
      }
    },

    async pullFromCloudFromModal() {
      const urlInput = document.getElementById('gs-modal-db-url');
      const keyInput = document.getElementById('gs-modal-db-key');
      const statusText = document.getElementById('gs-modal-status-text');

      const url = urlInput ? urlInput.value.trim() : '';
      const key = keyInput ? keyInput.value.trim() : '';

      if (url && key) {
        window.GREENSHIFT_SUPABASE_CONFIG.setConfig(url, key);
        window.GreenShiftDB.resetClient();
      }

      if (statusText) statusText.innerHTML = '<span class="status-indicator-dot dot-blue" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#0284c7;margin-right:6px;"></span>Đang kéo dữ liệu từ Supabase Cloud...';
      const pullRes = await window.GreenShiftDB.pullAll();

      if (pullRes.status === 'success') {
        alert('Đã kéo và cập nhật thành công ' + (pullRes.count || 0) + ' bản ghi từ Cloud lúc: ' + pullRes.time);
        this.closeModal();
      } else if (pullRes.status === 'error') {
        alert('Lỗi khi kéo dữ liệu từ Cloud: ' + pullRes.error);
      } else {
        this.closeModal();
      }
    },

    async saveAndSyncFromModal() {
      const urlInput = document.getElementById('gs-modal-db-url');
      const keyInput = document.getElementById('gs-modal-db-key');
      const statusText = document.getElementById('gs-modal-status-text');

      const url = urlInput ? urlInput.value.trim() : '';
      const key = keyInput ? keyInput.value.trim() : '';

      window.GREENSHIFT_SUPABASE_CONFIG.setConfig(url, key);
      window.GreenShiftDB.resetClient();

      if (statusText) statusText.innerHTML = '<span class="status-indicator-dot dot-blue" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#0284c7;margin-right:6px;"></span>Đang đồng bộ hai chiều toàn bộ dữ liệu...';
      const syncRes = await window.GreenShiftDB.syncAll();

      if (syncRes.status === 'success') {
        alert('Đồng bộ CSDL Supabase hai chiều thành công lúc: ' + syncRes.time);
        this.closeModal();
      } else if (syncRes.status === 'error') {
        alert('Lỗi đồng bộ: ' + syncRes.error);
      } else {
        this.closeModal();
      }
    }
  };

  window.GreenShiftDB_UI = GreenShiftDB_UI;

  // Khởi tạo giao diện khi DOM sẵn sàng
  function init() {
    injectCSS();
    createModal();
    // Ẩn hoàn toàn huy hiệu khỏi giao diện, hệ thống Cloud Sync chạy ngầm 100%
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
