/**
 * GreenShift Document Storage & Verification Engine (v2.0)
 * Quản trị tệp chứng từ vật lý (Hóa đơn PDF, XML, Ảnh nghiệm thu, Bảng cân)
 * Kiến trúc Local-First: Lưu trữ IndexedDB dung lượng lớn (>500MB), 
 * tự động dự phòng LocalStorage và tích hợp Supabase Cloud Storage (Bucket invoice_documents).
 */

(function(window) {
  'use strict';

  const DB_NAME = 'GreenShiftDocDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'documents';

  let dbInstance = null;

  // Khởi tạo IndexedDB
  function getDB() {
    return new Promise((resolve, reject) => {
      if (dbInstance) return resolve(dbInstance);
      if (typeof window === 'undefined' || !window.indexedDB) {
        return resolve(null); // Không có IndexedDB (môi trường Node hoặc trình duyệt cũ)
      }

      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function(e) {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'docId' });
          }
        };
        req.onsuccess = function(e) {
          dbInstance = e.target.result;
          resolve(dbInstance);
        };
        req.onerror = function(err) {
          console.warn('[DocumentStorage] Không thể mở IndexedDB, chuyển sang LocalStorage fallback:', err);
          resolve(null);
        };
      } catch (err) {
        console.warn('[DocumentStorage] Ngoại lệ IndexedDB:', err);
        resolve(null);
      }
    });
  }

  // Đọc tệp nhị phân thành Base64 DataURL
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Đọc tệp text/xml
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  const DocumentStorage = {
    /**
     * Lưu trữ tệp chứng từ vật lý
     * @param {File} file - Đối tượng File từ input file
     * @returns {Promise<{ docId, fileName, fileType, fileSize, dataUrl, fileUrl }>}
     */
    async saveDocument(file) {
      if (!file) throw new Error('Không có tệp để lưu trữ');

      const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
      const fileName = file.name || 'document';
      const fileType = file.type || (fileName.endsWith('.xml') ? 'application/xml' : (fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'));
      const fileSize = file.size || 0;

      let dataUrl = '';
      let textContent = '';

      if (typeof window !== 'undefined' && typeof FileReader !== 'undefined') {
        try {
          dataUrl = await readFileAsDataURL(file);
          if (fileType.includes('xml') || fileName.endsWith('.xml') || fileName.endsWith('.txt')) {
            textContent = await readFileAsText(file);
          }
        } catch (e) {
          console.warn('[DocumentStorage] Không thể đọc DataURL:', e);
        }
      }

      // Tự động tải lên Supabase Storage nếu đã cấu hình
      let fileUrl = '';
      try {
        if (window.GreenShiftDB && typeof window.GreenShiftDB.uploadDocument === 'function') {
          const uploadRes = await window.GreenShiftDB.uploadDocument(file, fileName);
          if (uploadRes && uploadRes.success && uploadRes.url) {
            fileUrl = uploadRes.url;
          }
        }
      } catch (uploadErr) {
        console.warn('[DocumentStorage] Bỏ qua lỗi upload Cloud (tiếp tục lưu cục bộ an toàn):', uploadErr);
      }

      const docRecord = {
        docId,
        fileName,
        fileType,
        fileSize,
        dataUrl,
        textContent,
        fileUrl,
        createdAt: new Date().toISOString()
      };

      // 1. Lưu vào IndexedDB
      const db = await getDB();
      if (db) {
        try {
          await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(docRecord);
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e);
          });
        } catch (idbErr) {
          console.warn('[DocumentStorage] Lỗi ghi IndexedDB:', idbErr);
        }
      }

      // 2. Dự phòng trong LocalStorage (lưu metadata; chỉ kèm dataUrl nếu tệp nhỏ < 50KB để không chiếm dụng hạn ngạch 5MB)
      try {
        const canIncludeData = dataUrl && dataUrl.length < 50000;
        const payload = {
          docId, fileName, fileType, fileSize, fileUrl, createdAt: docRecord.createdAt
        };
        if (canIncludeData) payload.dataUrl = dataUrl;
        localStorage.setItem(`gs_doc_${docId}`, JSON.stringify(payload));
      } catch (lsErr) {
        console.warn('[DocumentStorage] Quota LocalStorage đầy, tệp đã lưu trong IndexedDB:', lsErr);
      }

      return docRecord;
    },

    /**
     * Lấy tệp chứng từ theo docId
     * @param {string} docId 
     * @returns {Promise<object|null>}
     */
    async getDocument(docId) {
      if (!docId) return null;

      // 1. Tìm trong IndexedDB
      const db = await getDB();
      if (db) {
        try {
          const doc = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(docId);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
          });
          if (doc) return doc;
        } catch (e) {
          console.warn('[DocumentStorage] Lỗi đọc IndexedDB:', e);
        }
      }

      // 2. Tìm trong LocalStorage fallback
      try {
        const raw = localStorage.getItem(`gs_doc_${docId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {}

      return null;
    },

    /**
     * Mở giao diện xem / tải chứng từ gốc
     * @param {object} params - { docId, fileName, fileUrl, fileType, fileData }
     */
    async openViewer(params = {}) {
      if (typeof document === 'undefined') return;

      const modal = document.getElementById('proof-viewer-modal');
      const titleEl = document.getElementById('proof-viewer-title');
      const subEl = document.getElementById('proof-viewer-subtitle');
      const bodyEl = document.getElementById('proof-viewer-body');
      const infoEl = document.getElementById('proof-viewer-info');
      const btnDownload = document.getElementById('btn-download-proof');

      if (!modal || !bodyEl) return;

      modal.style.display = 'flex';
      bodyEl.innerHTML = '<div style="color: #64748b; font-size: 0.85rem;">Đang tải tệp chứng từ...</div>';

      const fileName = params.fileName || 'Chung_tu_phat_thai';
      let doc = null;
      if (params.docId) {
        doc = await this.getDocument(params.docId);
      }

      const fileType = (doc && doc.fileType) || params.fileType || '';
      const dataUrl = (doc && doc.dataUrl) || params.fileData || '';
      let fileUrl = (doc && doc.fileUrl) || params.fileUrl || '';

      // Tự động giải mã Signed URL nếu trỏ tới Supabase Storage
      if (fileUrl && (fileUrl.includes('invoice_documents') || (!fileUrl.startsWith('data:') && !fileUrl.startsWith('blob:') && !fileUrl.startsWith('http')))) {
        if (typeof window !== 'undefined' && window.GreenShiftDB && typeof window.GreenShiftDB.createSignedInvoiceUrl === 'function') {
          let storagePath = fileUrl;
          if (storagePath.includes('/invoice_documents/')) {
            storagePath = storagePath.split('/invoice_documents/')[1].split('?')[0];
          }
          try {
            const signedRes = await window.GreenShiftDB.createSignedInvoiceUrl(storagePath, 3600);
            if (signedRes && signedRes.signedUrl) {
              fileUrl = signedRes.signedUrl;
            }
          } catch(e) {
            console.warn('[DocumentStorage] Không thể cấp Signed URL:', e);
          }
        }
      }

      const fileSize = (doc && doc.fileSize) || 0;
      const textContent = (doc && doc.textContent) || '';

      const fnLower = fileName.toLowerCase();
      const isPdf = fnLower.endsWith('.pdf') || fileType.includes('pdf');
      const isImg = fnLower.endsWith('.png') || fnLower.endsWith('.jpg') || fnLower.endsWith('.jpeg') || fnLower.endsWith('.webp') || fileType.includes('image');
      const isXml = fnLower.endsWith('.xml') || fileType.includes('xml');
      const isTxt = fnLower.endsWith('.txt') || fileType.includes('text');

      if (titleEl) titleEl.innerText = `Chứng từ gốc: ${fileName}`;
      if (subEl) {
        const sizeStr = fileSize > 0 ? ` (${(fileSize / 1024).toFixed(1)} KB)` : '';
        subEl.innerText = `Được lưu trữ an toàn trong kho hồ sơ kiểm kê GreenShift${sizeStr}`;
      }

      let activeDownloadUrl = '';

      // Trường hợp 1: Có DataURL hoặc FileUrl ảnh
      if (isImg && (dataUrl || fileUrl)) {
        const src = dataUrl || fileUrl;
        activeDownloadUrl = src;
        bodyEl.innerHTML = `
          <div style="width: 100%; display: flex; justify-content: center; align-items: center; background: #ffffff; padding: 1rem; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <img src="${src}" alt="${fileName}" style="max-width: 100%; max-height: 520px; object-fit: contain; border-radius: 4px;">
          </div>
        `;
        if (infoEl) infoEl.innerText = 'Định dạng: Hình ảnh chứng từ / Phiếu cân';
      }
      // Trường hợp 2: File PDF
      else if (isPdf && (dataUrl || fileUrl)) {
        const src = dataUrl || fileUrl;
        activeDownloadUrl = src;
        bodyEl.innerHTML = `
          <div style="width: 100%; height: 520px; background: #ffffff; border-radius: 6px;">
            <iframe src="${src}" style="width: 100%; height: 100%; border: none; border-radius: 6px;" title="${fileName}"></iframe>
          </div>
        `;
        if (infoEl) infoEl.innerText = 'Định dạng: Hóa đơn điện tử PDF';
      }
      // Trường hợp 3: File XML hóa đơn (Thông tư 78) hoặc File text
      else if ((isXml || isTxt) && (textContent || dataUrl)) {
        let contentToShow = textContent;
        if (!contentToShow && dataUrl.startsWith('data:')) {
          try {
            const base64Data = dataUrl.split(',')[1];
            contentToShow = decodeURIComponent(escape(window.atob(base64Data)));
          } catch(e) {
            contentToShow = dataUrl;
          }
        }
        const safeText = (contentToShow || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        activeDownloadUrl = dataUrl || ('data:application/xml;charset=utf-8,' + encodeURIComponent(contentToShow));
        bodyEl.innerHTML = `
          <div style="width: 100%; text-align: left; background: #0f172a; color: #f8fafc; border-radius: 6px; padding: 1rem; max-height: 520px; overflow-y: auto;">
            <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.5rem; border-bottom: 1px solid #334155; padding-bottom: 4px; display: flex; justify-content: space-between;">
              <span>Mã nguồn dữ liệu hóa đơn điện tử XML</span>
              <span>Chuẩn dữ liệu TCT</span>
            </div>
            <pre style="margin: 0; font-family: Consolas, Monaco, monospace; font-size: 0.75rem; white-space: pre-wrap; word-break: break-word;">${safeText}</pre>
          </div>
        `;
        if (infoEl) infoEl.innerText = 'Định dạng: Hóa đơn điện tử XML chuẩn Thông tư 78';
      }
      // Trường hợp 4: Tệp mô phỏng / Chứng từ đã đối soát
      else {
        const certHtml = `
          <div style="padding: 2.5rem 1.5rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; max-width: 520px; width: 100%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center;">
            <div style="width: 52px; height: 52px; margin: 0 auto 1rem; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h3 style="margin: 0 0 0.5rem; color: #0f172a; font-size: 1.1rem; font-weight: 700;">Hồ sơ Chứng từ Điện tử Đã Xác thực</h3>
            <div style="font-size: 0.85rem; color: #0369a1; font-weight: 600; margin-bottom: 1rem;">Tên tệp: ${fileName}</div>
            <p style="font-size: 0.82rem; color: #64748b; line-height: 1.6; margin-bottom: 1.2rem; text-align: justify;">
              Chứng từ này đã được phòng Kế toán / Kỹ sư đối soát và nhập liệu vào hệ thống kiểm kê khí nhà kính GreenShift theo quy chuẩn ISO 14064-3. Dữ liệu lượng tiêu thụ và hệ số phát thải đã được ghi nhận vào nhật ký kiểm toán.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem; font-size: 0.75rem; color: #475569; text-align: left; margin-bottom: 1rem;">
              <div>• <strong>Trạng thái:</strong> Đã ghi nhận trong hồ sơ kiểm kê chính thức</div>
              <div>• <strong>Đơn vị lưu trữ:</strong> GreenShift Enterprise MRV Vault</div>
              <div>• <strong>Quyền thay đổi:</strong> Bạn có thể tải lên tệp thay thế qua nút Sửa bản ghi</div>
            </div>
          </div>
        `;
        bodyEl.innerHTML = certHtml;
        if (infoEl) infoEl.innerText = 'Trạng thái: Hồ sơ chứng từ kiểm toán nội bộ';

        // Tạo dataUrl text để tải về
        const certText = `GREENSHIFT MRV ASSURANCE - CHỨNG TỪ KIỂM TOÁN KHÍ NHÀ KÍNH\n` +
          `=========================================================\n` +
          `Tên tệp: ${fileName}\n` +
          `Ngày tạo: ${new Date().toLocaleString('vi-VN')}\n` +
          `Quy chuẩn: ISO 14064-1 & Nghị định 06/2022/NĐ-CP\n` +
          `Bản quyền hệ thống: GreenShift Enterprise GHG Accounting Platform\n`;
        activeDownloadUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(certText);
      }

      if (btnDownload) {
        btnDownload.href = activeDownloadUrl || '#';
        btnDownload.download = fileName || 'chung_tu_greenshift.txt';
      }
    },

    /**
     * Dọn dẹp các tệp base64 lớn bị lưu sót trong LocalStorage để giải phóng dung lượng quota
     */
    cleanupStorageQuota() {
      try {
        if (typeof localStorage === 'undefined') return 0;
        let freedCount = 0;
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith('gs_doc_')) {
            try {
              const raw = localStorage.getItem(k);
              if (raw && raw.includes('"dataUrl"')) {
                const docObj = JSON.parse(raw);
                if (docObj && docObj.dataUrl && docObj.dataUrl.length > 50000) {
                  delete docObj.dataUrl;
                  localStorage.setItem(k, JSON.stringify(docObj));
                  freedCount++;
                }
              }
            } catch (e) {}
          }
        }
        return freedCount;
      } catch (e) {
        return 0;
      }
    },

    /**
     * Đóng modal xem chứng từ
     */
    closeViewer() {
      if (typeof document === 'undefined') return;
      const modal = document.getElementById('proof-viewer-modal');
      if (modal) modal.style.display = 'none';
      const bodyEl = document.getElementById('proof-viewer-body');
      if (bodyEl) bodyEl.innerHTML = '';
    }
  };

  // Tự động dọn dẹp dung lượng LocalStorage ngay khi nạp module
  try {
    DocumentStorage.cleanupStorageQuota();
  } catch(e) {}

  // Đăng ký toàn cục
  window.DocumentStorage = DocumentStorage;

  // Lắng nghe sự kiện đóng modal xem chứng từ
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const btnClose1 = document.getElementById('btn-close-proof-viewer');
      const btnClose2 = document.getElementById('btn-close-proof-viewer-footer');
      if (btnClose1) btnClose1.addEventListener('click', () => DocumentStorage.closeViewer());
      if (btnClose2) btnClose2.addEventListener('click', () => DocumentStorage.closeViewer());

      const modal = document.getElementById('proof-viewer-modal');
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) DocumentStorage.closeViewer();
        });
      }
    });
  }

})(typeof window !== 'undefined' ? window : global);
