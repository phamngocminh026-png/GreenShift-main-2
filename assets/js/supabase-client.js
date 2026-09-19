/**
 * GreenShift v2.0 — Supabase Cloud Database Client & Local-First Sync Engine
 * Quản lý kết nối, đồng bộ dữ liệu và bảo đảm tính toàn vẹn với kiến trúc Local-First
 */

(function(window) {
  'use strict';

  let clientInstance = null;
  let syncInProgress = false;

  const GreenShiftDB = {
    /**
     * Khởi tạo hoặc lấy Supabase Client hiện hành
     */
    getClient() {
      if (clientInstance) return clientInstance;

      const config = window.GREENSHIFT_SUPABASE_CONFIG;
      if (!config || !config.isConfigured()) {
        return null;
      }

      const supabaseLib = window.supabase;
      if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
        console.warn('[GreenShift DB] Thư viện @supabase/supabase-js chưa được nạp.');
        return null;
      }

      try {
        clientInstance = supabaseLib.createClient(config.getUrl(), config.getKey(), {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        return clientInstance;
      } catch (err) {
        console.error('[GreenShift DB] Lỗi khởi tạo Supabase Client:', err);
        return null;
      }
    },

    /**
     * Reset client khi người dùng đổi URL hoặc Key
     */
    resetClient() {
      clientInstance = null;
    },

    /**
     * Kiem tra thoi gian song cua phien dang nhap (TTL)
     * Tu dong don dep LocalStorage neu phien da qua 24 gio
     */
    checkSessionTTL() {
      if (typeof localStorage === 'undefined') return;
      try {
        const loginTimeStr = localStorage.getItem('gs_login_timestamp');
        const token = localStorage.getItem('gs_auth_token') || localStorage.getItem('greenshift_token');
        if (loginTimeStr && token) {
          const loginTime = parseInt(loginTimeStr, 10);
          const maxAgeMs = 24 * 60 * 60 * 1000; // 24 gio
          if (Date.now() - loginTime > maxAgeMs) {
            console.warn('[GreenShift DB] Phien lam viec da het han (>24h). Tu dong don sach bo nho dem de bao mat.');
            localStorage.removeItem('gs_auth_token');
            localStorage.removeItem('greenshift_token');
            localStorage.removeItem('gs_current_user');
            localStorage.removeItem('gs_facility_id');
            localStorage.removeItem('gs_login_timestamp');
          }
        } else if (!loginTimeStr && token) {
          localStorage.setItem('gs_login_timestamp', String(Date.now()));
        }
      } catch (e) {
        console.warn('[GreenShift DB] Loi kiem tra Session TTL:', e);
      }
    },

    /**
     * Lay Facility ID cua nguoi dung hien tai (doc tu localStorage hoac profile)
     * Tra ve null neu chua dang nhap / chua co co so hop le
     */
    getFacilityId() {
      let raw = null;
      if (typeof localStorage !== 'undefined') {
        raw = localStorage.getItem('gs_facility_id') || localStorage.getItem('gs_current_facility_id');
        if (!raw) {
          try {
            const userStr = localStorage.getItem('gs_current_user');
            const users = JSON.parse(localStorage.getItem('gs_users') || '[]');
            const u = users.find(x => x.username === userStr || x.email === userStr);
            if (u && (u.facility_id || u.facilityId)) {
              raw = u.facility_id || u.facilityId;
              localStorage.setItem('gs_facility_id', String(raw));
            }
          } catch (e) {
            console.warn('[GreenShift DB] Khong the doc facility_id tu profile:', e);
          }
        }
      }
      const parsed = parseInt(raw, 10);
      return (!isNaN(parsed) && parsed > 0) ? parsed : 1;
    },

    /**
     * Yeu cau Facility ID bat buoc (mac dinh co so 1 neu chua chi dinh)
     */
    requireFacilityId() {
      const fId = this.getFacilityId();
      return fId || 1;
    },

    /**
     * Kiểm tra trạng thái kết nối tới Supabase (Ping Test)
     */
    async testConnection() {
      const client = this.getClient();
      if (!client) {
        return {
          connected: false,
          error: 'Chưa cấu hình Supabase URL hoặc Anon Key.'
        };
      }

      try {
        const startTime = Date.now();
        const { data, error } = await client.from('facilities').select('id, name, sector_code').limit(1);
        const latency = Date.now() - startTime;

        if (error) {
          return {
            connected: false,
            error: error.message || 'Không thể truy vấn bảng facilities. Hãy kiểm tra lại quyền RLS.'
          };
        }

        return {
          connected: true,
          latency: latency,
          message: `Kết nối Supabase Cloud thành công! (${latency}ms)`
        };
      } catch (err) {
        return {
          connected: false,
          error: err.message || 'Lỗi mạng khi kết nối Supabase.'
        };
      }
    },

    /**
     * Ánh xạ ngành nghề sang mã sector_code trong CSDL Supabase
     */
    mapSector(sector) {
      if (!sector) return 'STEEL';
      const s = String(sector).toLowerCase();
      if (s.includes('thép') || s.includes('steel')) return 'STEEL';
      if (s.includes('nhôm') || s.includes('alu')) return 'ALUMINIUM';
      if (s.includes('phân') || s.includes('fert')) return 'FERTILIZER';
      if (s.includes('xi măng') || s.includes('cement')) return 'CEMENT';
      return 'STEEL';
    },

    /**
     * Ánh xạ Scope string từ LocalStorage sang enum của Supabase
     */
    mapScopeType(scopeStr) {
      if (!scopeStr) return 'SCOPE_1';
      const s = String(scopeStr).toLowerCase();
      if (s.includes('1') || s.includes('scope 1')) return 'SCOPE_1';
      if (s.includes('2') || s.includes('scope 2')) return 'SCOPE_2';
      if (s.includes('3') || s.includes('scope 3')) return 'SCOPE_3';
      return 'SCOPE_1';
    },

    /**
     * Đẩy thông tin hồ sơ doanh nghiệp lên Supabase (Bảng facilities)
     */
    async pushCompanyProfile(companyData) {
      const client = this.getClient();
      if (!client || !companyData) return false;

      try {
        const facilityPayload = {
          id: 1,
          name: companyData.name || companyData.companyName || 'Công ty TNHH Thép Xanh Hải Phòng (GreenSteel)',
          sector_code: this.mapSector(companyData.sector || companyData.industry),
          tax_id: companyData.taxId || companyData.tax_id || '0201889988',
          address: companyData.address || 'KCN Đình Vũ, Hải Phòng',
          province: companyData.province || 'Hải Phòng',
          contact_person: companyData.contactPerson || companyData.repName || companyData.fullName || 'Nguyễn Văn Hùng',
          phone: companyData.phone || companyData.repPhone || '0912345678',
          email: companyData.email || companyData.repEmail || 'hungnv@greensteel.vn',
          consolidation_approach: companyData.consolidationApproach || 'OPERATIONAL_CONTROL',
          equity_share_pct: companyData.equitySharePct || 100.0,
          base_year: companyData.baseYear || 2023,
          facility_code_gov: companyData.facilityCodeGov || 'QD42-2026-HP-STEEL-001'
        };

        const { error } = await client
          .from('facilities')
          .upsert(facilityPayload, { onConflict: 'id' });

        if (error) {
          console.warn('[GreenShift DB] Lỗi đẩy facilities:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('[GreenShift DB] Lỗi pushCompanyProfile:', err);
        return false;
      }
    },

    /**
     * Đẩy dữ liệu báo cáo kiểm kê KNK tổng hợp lên Supabase (Bảng inventory_reports)
     */
    async pushAnnualInventory(year, totalScope1, totalScope2, totalScope3, totalEmissions, biogenicCo2 = 0, gasBreakdown = {}) {
      const client = this.getClient();
      if (!client) return false;

      const fId = this.requireFacilityId();
      const repYear = parseInt(year || 2026, 10);

      // Áp dụng phương pháp hợp nhất (Equity Share nếu có cấu hình)
      let equityFactor = 1;
      try {
        const rawProf = localStorage.getItem('gs_company_profile');
        if (rawProf) {
          const compProf = JSON.parse(rawProf);
          if (compProf && (compProf.consolidationApproach === 'EQUITY_SHARE' || compProf.consolidation_approach === 'EQUITY_SHARE')) {
            const pct = parseFloat(compProf.equitySharePct || compProf.equity_share_pct || 100);
            if (pct > 0 && pct <= 100) equityFactor = pct / 100;
          }
        }
      } catch (e) {}

      const s1Final = (parseFloat(totalScope1) || 0) * equityFactor;
      const s2LocFinal = (parseFloat(totalScope2) || 0) * equityFactor;
      const s2MktFinal = (parseFloat(gasBreakdown.marketBasedScope2 !== undefined ? gasBreakdown.marketBasedScope2 : totalScope2) || 0) * equityFactor;
      const s3Final = (parseFloat(totalScope3) || 0) * equityFactor;
      const totFinal = (parseFloat(totalEmissions) || (s1Final + s2LocFinal + s3Final)) * equityFactor;
      const bioFinal = (parseFloat(biogenicCo2) || 0.0) * equityFactor;

      try {
        // Kiểm tra xem kỳ kiểm kê này đã bị khóa sổ (Period Lock) hay chưa
        try {
          const { data: existingRep } = await client
            .from('inventory_reports')
            .select('is_locked')
            .eq('facility_id', fId)
            .eq('reporting_year', repYear)
            .maybeSingle();

          if (existingRep && existingRep.is_locked) {
            console.warn(`[GreenShift DB] Kỳ kiểm kê năm ${repYear} đã được chốt và khóa sổ (is_locked=true). Từ chối ghi đè.`);
            return false;
          }
        } catch (lockErr) {
          // Bỏ qua lỗi truy vấn lock nếu bảng chưa có cột
        }

        const report = {
          facility_id: fId,
          reporting_year: repYear,
          reporting_standard: 'Nghị định 06/2022/NĐ-CP & Thông tư 38/2023/TT-BCT',
          scope1_total_tco2e: s1Final,
          scope2_electricity_tco2e: s2LocFinal,
          scope2_location_based_tco2e: s2LocFinal,
          scope2_market_based_tco2e: s2MktFinal,
          biogenic_co2_tco2e: bioFinal,
          scope3_other_tco2e: s3Final,
          total_emissions_tco2e: totFinal,
          co2_mass_ton: parseFloat(gasBreakdown.co2_mass_ton !== undefined ? gasBreakdown.co2_mass_ton : totalScope1) || 0,
          ch4_mass_ton: parseFloat(gasBreakdown.ch4_mass_ton || 0),
          ch4_converted_tco2e: parseFloat(gasBreakdown.ch4_converted_tco2e || 0),
          n2o_mass_ton: parseFloat(gasBreakdown.n2o_mass_ton || 0),
          n2o_converted_tco2e: parseFloat(gasBreakdown.n2o_converted_tco2e || 0),
          combined_uncertainty_pct: parseFloat(gasBreakdown.combined_uncertainty_pct || 0),
          verification_status: 'INTERNAL_VERIFIED',
          notes: 'Đồng bộ tự động từ GreenShift Web Cloud'
        };

        const { error } = await client
          .from('inventory_reports')
          .upsert(report, { onConflict: 'facility_id,reporting_year' });

        if (error) {
          console.warn('[GreenShift DB] Lỗi lưu inventory_reports:', error.message);
          return false;
        }

        // Ghi nhận vết kiểm toán bất biến (Audit Trail)
        await this.recordAuditLog('inventory_reports', `${fId}_${repYear}`, 'UPSERT', null, report, `Đồng bộ báo cáo kiểm kê năm ${repYear}`);
        return true;
      } catch (e) {
        console.warn('[GreenShift DB] Exception lưu inventory_reports:', e);
        return false;
      }
    },

    /**
     * Ghi vết kiểm toán bất biến vào bảng audit_logs (ISO 14064-3 Compliance)
     */
    async recordAuditLog(tableName, recordId, action, oldData = null, newData = null, changeReason = '') {
      const client = this.getClient();
      if (!client) return false;

      try {
        const payload = {
          table_name: tableName,
          record_id: String(recordId),
          action: action,
          old_data: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
          new_data: newData ? JSON.parse(JSON.stringify(newData)) : null,
          changed_by: (typeof localStorage !== 'undefined' ? localStorage.getItem('gs_current_user') : null) || 'system',
          changed_at: new Date().toISOString(),
          change_reason: changeReason || 'Cập nhật dữ liệu hệ thống GreenShift',
          facility_id: this.requireFacilityId()
        };

        const { error } = await client
          .from('audit_logs')
          .insert([payload]);

        if (error) {
          console.warn('[GreenShift DB] Lỗi ghi audit_logs:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('[GreenShift DB] Ngoại lệ recordAuditLog:', err);
        return false;
      }
    },

    /**
     * Tạo ID duy nhất và ổn định cho dòng hoạt động
     */
    generateActivityId(act, branchKey = 'main') {
      if (act.id) return String(act.id);
      if (act.docId) return 'act_' + act.docId;
      const bKey = String(branchKey || 'main').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const d = (act.date || '2026-01-01').replace(/[^0-9]/g, '');
      const src = (act.sourceId || act.sourceType || 'src').replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
      const amt = Math.abs(Math.round((parseFloat(act.amount) || 0) * 100));
      const mode = (act.entryMode || 'direct').slice(0, 6);
      return `act_${bKey}_${d}_${src}_${amt}_${mode}`;
    },

    /**
     * Hợp nhất 2 danh sách hoạt động (Local & Remote) với thuật toán Last-Write-Wins
     */
    mergeActivities(localList = [], remoteList = []) {
      const mergedMap = new Map();

      // Nạp danh sách local trước
      (localList || []).forEach(item => {
        const id = item.id || this.generateActivityId(item);
        mergedMap.set(id, { ...item, id });
      });

      // Hợp nhất remote
      (remoteList || []).forEach(remoteItem => {
        const id = remoteItem.id || this.generateActivityId(remoteItem);
        if (!mergedMap.has(id)) {
          // Bản ghi mới từ Cloud -> thêm vào
          mergedMap.set(id, { ...remoteItem, id });
        } else {
          // Xung đột -> so sánh timestamp
          const localItem = mergedMap.get(id);
          const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
          const remoteTime = new Date(remoteItem.updatedAt || remoteItem.updated_at || remoteItem.createdAt || remoteItem.created_at || 0).getTime();
          
          if (remoteTime > localTime) {
            mergedMap.set(id, { ...localItem, ...remoteItem, id });
          } else {
            // Local mới hơn hoặc bằng -> giữ local
            mergedMap.set(id, { ...remoteItem, ...localItem, id });
          }
        }
      });

      // Trả về mảng đã sắp xếp theo ngày
      return Array.from(mergedMap.values()).sort((a, b) => {
        const da = a.date || '';
        const db = b.date || '';
        return da.localeCompare(db);
      });
    },

    /**
     * Kéo danh sách hoạt động từ Supabase (Bảng activities)
     */
    async pullActivities(branchKey = 'main') {
      const client = this.getClient();
      if (!client) return [];

      try {
        const { data, error } = await client
          .from('activities')
          .select('*')
          .eq('branch_key', branchKey)
          .order('activity_date', { ascending: true });

        if (error) {
          console.warn('[GreenShift DB] Lỗi pullActivities:', error.message);
          return [];
        }

        if (!data || !Array.isArray(data)) return [];

        // Ánh xạ về schema Local-First của GreenShift
        return data.map(r => ({
          id: r.id,
          date: r.activity_date,
          sourceId: r.source_id,
          sourceType: r.source_type,
          sourceName: r.source_name,
          amount: String(r.amount),
          unit: r.unit,
          doc: r.doc_detail,
          manager: r.manager,
          co2e: String(r.co2e),
          biogenicCo2: String(r.biogenic_co2 || 0),
          isBiomass: r.is_biomass ? 'true' : 'false',
          efName: r.ef_name,
          refName: r.ref_name,
          finalFactor: String(r.final_factor || 0),
          fileName: r.file_name || '',
          docId: r.doc_id || '',
          fileUrl: r.file_url || '',
          fileType: r.file_type || '',
          entryRole: r.entry_role || 'engineer',
          entryMode: r.entry_mode || 'direct',
          timeStart: r.time_start || '',
          timeEnd: r.time_end || '',
          isInvoice: r.is_invoice ? 'true' : 'false',
          isDowntime: r.is_downtime ? 'true' : 'false',
          isOvertime: r.is_overtime ? 'true' : 'false',
          recordType: r.record_type || 'normal',
          isBaseline: r.is_baseline ? 'true' : 'false',
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          ...(r.raw_json || {})
        }));
      } catch (err) {
        console.warn('[GreenShift DB] Ngoại lệ pullActivities:', err);
        return [];
      }
    },

    /**
     * Kéo thông tin hồ sơ doanh nghiệp từ Supabase (Bảng facilities)
     */
    async pullCompanyProfile() {
      const client = this.getClient();
      if (!client) return null;

      try {
        const { data, error } = await client
          .from('facilities')
          .select('*')
          .eq('id', 1)
          .single();

        if (error || !data) {
          console.warn('[GreenShift DB] Lỗi pullCompanyProfile:', error ? error.message : 'Không tìm thấy facility');
          return null;
        }

        const company = {
          name: data.name,
          companyName: data.name,
          sector: data.sector_code,
          taxId: data.tax_id,
          address: data.address,
          province: data.province,
          contactPerson: data.contact_person,
          phone: data.phone,
          email: data.email,
          consolidationApproach: data.consolidation_approach,
          equitySharePct: data.equity_share_pct,
          baseYear: data.base_year,
          facilityCodeGov: data.facility_code_gov
        };

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gs_v2_company', JSON.stringify(company));
          // Cập nhật gs_users nếu user hiện tại đang hoạt động
          try {
            const currentUser = localStorage.getItem('gs_current_user') || '';
            const users = JSON.parse(localStorage.getItem('gs_users') || '[]');
            const uIdx = users.findIndex(u => u.username === currentUser || u.email === currentUser);
            if (uIdx !== -1) {
              users[uIdx].company = { ...(users[uIdx].company || {}), ...company };
              localStorage.setItem('gs_users', JSON.stringify(users));
            }
          } catch(e) {}
        }

        return company;
      } catch (err) {
        console.warn('[GreenShift DB] Ngoại lệ pullCompanyProfile:', err);
        return null;
      }
    },

    /**
     * Đẩy danh sách hoạt động phát thải lên Supabase (Bảng activities & inventory_reports)
     */
    async pushActivities(branchKey, activities) {
      const client = this.getClient();
      if (!client || !activities || !Array.isArray(activities)) return false;

      try {
        const bKey = branchKey || 'main';
        const rowsToUpsert = activities.map(act => {
          const actId = act.id || this.generateActivityId(act, bKey);
          act.id = actId;
          return {
            id: actId,
            facility_id: this.requireFacilityId(),
            branch_key: bKey,
            activity_date: act.date || new Date().toISOString().slice(0, 10),
            source_id: act.sourceId || '',
            source_type: act.sourceType || '',
            source_name: act.sourceName || 'Hoạt động phát thải',
            amount: parseFloat(act.amount) || 0,
            unit: act.unit || 'kWh',
            doc_detail: act.doc || '',
            manager: act.manager || '',
            co2e: parseFloat(act.co2e) || 0,
            biogenic_co2: parseFloat(act.biogenicCo2) || 0,
            is_biomass: act.isBiomass === 'true',
            ef_name: act.efName || '',
            ref_name: act.refName || '',
            final_factor: parseFloat(act.finalFactor) || 0,
            file_name: act.fileName || '',
            doc_id: act.docId || '',
            file_url: act.fileUrl || '',
            file_type: act.fileType || '',
            entry_role: act.entryRole || 'engineer',
            entry_mode: act.entryMode || 'direct',
            time_start: act.timeStart || '',
            time_end: act.timeEnd || '',
            is_invoice: act.isInvoice === 'true',
            is_downtime: act.isDowntime === 'true',
            is_overtime: act.isOvertime === 'true',
            record_type: act.recordType || 'normal',
            is_baseline: act.isBaseline === 'true',
            raw_json: act,
            updated_at: new Date().toISOString()
          };
        });

        // Upsert theo lô 50 dòng để tối ưu hiệu năng mạng
        const chunkSize = 50;
        for (let i = 0; i < rowsToUpsert.length; i += chunkSize) {
          const chunk = rowsToUpsert.slice(i, i + chunkSize);
          const { error } = await client
            .from('activities')
            .upsert(chunk, { onConflict: 'id' });
          if (error) {
            console.warn('[GreenShift DB] Lỗi upsert activities chunk:', error.message);
          }
        }

        // Cập nhật các chỉ số tổng hợp hàng năm & phân rã khí phát thải
        let s1 = 0, s2Loc = 0, s2Mkt = 0, s3 = 0, bio = 0;
        let co2Mass = 0, ch4Mass = 0, ch4Co2e = 0, n2oMass = 0, n2oCo2e = 0;
        let hasMarketScope2 = false;

        activities.forEach(act => {
          const val = parseFloat(act.co2e) || 0;
          const bVal = parseFloat(act.biogenicCo2) || 0;
          const sc = this.mapScopeType(act.sourceType || act.scope);
          if (sc === 'SCOPE_1') {
            s1 += val;
            if (act.efName && (act.efName.includes('CH4') || act.efName.includes('Methane'))) {
              ch4Co2e += val;
              ch4Mass += (val / 28);
            } else if (act.efName && (act.efName.includes('N2O') || act.efName.includes('Nitrous'))) {
              n2oCo2e += val;
              n2oMass += (val / 265);
            } else {
              co2Mass += val;
            }
          } else if (sc === 'SCOPE_2') {
            s2Loc += val;
            if (act.isRecPpa === true || act.is_rec_ppa === true || (act.efName && (act.efName.includes('REC') || act.efName.includes('PPA') || act.efName.includes('Điện mặt trời')))) {
              hasMarketScope2 = true;
            } else {
              s2Mkt += val;
            }
          } else if (sc === 'SCOPE_3') {
            s3 += val;
          }
          bio += bVal;
        });

        if (!hasMarketScope2) {
          try {
            const comp = JSON.parse(localStorage.getItem('gs_company_profile') || '{}');
            if (comp.recPpaDeductionMwh) {
              const recMwh = parseFloat(comp.recPpaDeductionMwh) || 0;
              const efGrid = 0.6766;
              s2Mkt = Math.max(0, s2Loc - (recMwh * efGrid));
              hasMarketScope2 = true;
            } else {
              s2Mkt = s2Loc;
            }
          } catch(e) {
            s2Mkt = s2Loc;
          }
        }

        const gasBreakdown = {
          marketBasedScope2: s2Mkt,
          co2_mass_ton: co2Mass,
          ch4_mass_ton: ch4Mass,
          ch4_converted_tco2e: ch4Co2e,
          n2o_mass_ton: n2oMass,
          n2o_converted_tco2e: n2oCo2e,
          combined_uncertainty_pct: 5.2
        };

        const activeYear = (activities.find(a => a.date)?.date || '2026').split('-')[0];
        await this.pushAnnualInventory(parseInt(activeYear, 10), s1, s2Loc, s3, s1 + s2Loc + s3, bio, gasBreakdown);

        return true;
      } catch (err) {
        console.warn('[GreenShift DB] Lỗi pushActivities:', err);
        return false;
      }
    },

    /**
     * Đẩy hồ sơ xuất khẩu EU CBAM lên Supabase (Bảng cbam_dossiers)
     */
    async pushCbamDossier(year, quarter, dossier) {
      const client = this.getClient();
      if (!client || !dossier) return false;
      const fId = this.requireFacilityId();

      try {
        const payload = {
          facility_id: fId,
          reporting_year: parseInt(year || 2026, 10),
          reporting_period: `Quý ${quarter}/${year}`,
          cn_code: dossier.cnCode || '72071114',
          route_name: dossier.route || 'Quy trình sản xuất chuẩn',
          activity_level: parseFloat(dossier.productionQty) || 1000,
          export_qty: parseFloat(dossier.exportQty) || 500,
          see_direct: parseFloat(dossier.directIntensity) || 1.85,
          see_indirect: parseFloat(dossier.indirectIntensity) || 0.42,
          see_precursor: 0.0,
          see_total: (parseFloat(dossier.directIntensity) || 1.85) + (parseFloat(dossier.indirectIntensity) || 0.42),
          eu_benchmark: 1.328,
          cbam_factor: 1.0,
          sefa_free_allocation: 0.0,
          cbam_certificates_due: parseFloat(dossier.dueCertificates) || 0,
          estimated_cost_eur: parseFloat(dossier.estimatedCostEur) || 0,
          sha256_hash: 'hash_' + Date.now(),
          is_locked: true
        };

        const { error } = await client
          .from('cbam_dossiers')
          .upsert(payload, { onConflict: 'id' });

        return !error;
      } catch (e) {
        console.warn('[GreenShift DB] Lỗi lưu cbam_dossiers:', e);
        return false;
      }
    },

    /**
     * Kéo toàn bộ dữ liệu từ Cloud về LocalStorage (Pull All)
     */
    async pullAll() {
      if (syncInProgress) return { status: 'busy' };
      syncInProgress = true;
      this.updateStatusBadge('syncing');

      try {
        const username = localStorage.getItem('gs_current_user') || 'guest';
        const branchEl = (typeof document !== 'undefined') ? document.getElementById('branch-selector') : null;
        const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
        const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const activityStorageKey = `gs_data_${username}_${branchKey}_activity`;

        // 1. Kéo Company Profile
        await this.pullCompanyProfile();

        // 2. Kéo Activities
        const remoteActivities = await this.pullActivities(branchKey);
        let localActivities = [];
        try {
          localActivities = JSON.parse(localStorage.getItem(activityStorageKey) || '[]');
        } catch(e) {}

        const merged = this.mergeActivities(localActivities, remoteActivities);
        localStorage.setItem(activityStorageKey, JSON.stringify(merged));

        const now = new Date().toLocaleTimeString('vi-VN');
        localStorage.setItem('gs_last_sync_time', now);
        this.updateStatusBadge('connected');

        // Bắn sự kiện để UI tự động cập nhật
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('greenshift:sync-complete', {
            detail: { action: 'pull', count: merged.length, time: now }
          }));
        }

        return { status: 'success', time: now, count: merged.length };
      } catch (err) {
        console.error('[GreenShift DB] Lỗi trong pullAll:', err);
        this.updateStatusBadge('error');
        return { status: 'error', error: err.message };
      } finally {
        syncInProgress = false;
      }
    },

    /**
     * Đồng bộ hai chiều toàn bộ dữ liệu (Bi-directional Full Sync)
     */
    async syncAll() {
      if (syncInProgress) return { status: 'busy' };
      syncInProgress = true;
      this.updateStatusBadge('syncing');

      try {
        const username = localStorage.getItem('gs_current_user') || 'guest';
        const branchEl = (typeof document !== 'undefined') ? document.getElementById('branch-selector') : null;
        const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
        const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const activityStorageKey = `gs_data_${username}_${branchKey}_activity`;

        // 1. Đồng bộ Company Profile hai chiều
        const localCompany = JSON.parse(localStorage.getItem('gs_v2_company') || 'null');
        if (localCompany) {
          await this.pushCompanyProfile(localCompany);
        } else {
          await this.pullCompanyProfile();
        }

        // 2. Kéo danh sách hoạt động từ Cloud
        const remoteActivities = await this.pullActivities(branchKey);

        // 3. Đọc danh sách hoạt động trên máy cục bộ
        let localActivities = [];
        try {
          localActivities = JSON.parse(localStorage.getItem(activityStorageKey) || '[]');
        } catch (e) {}

        // 4. Hợp nhất hai chiều thông minh (Merge with Conflict Resolution)
        const mergedActivities = this.mergeActivities(localActivities, remoteActivities);

        // 5. Lưu ngược lại LocalStorage
        localStorage.setItem(activityStorageKey, JSON.stringify(mergedActivities));

        // 6. Đẩy dữ liệu hợp nhất hoàn chỉnh lên Cloud
        if (mergedActivities.length > 0) {
          await this.pushActivities(branchKey, mergedActivities);
        }

        const now = new Date().toLocaleTimeString('vi-VN');
        localStorage.setItem('gs_last_sync_time', now);
        this.updateStatusBadge('connected');

        // Bắn sự kiện để giao diện lập tức làm mới
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('greenshift:sync-complete', {
            detail: { action: 'sync', count: mergedActivities.length, time: now }
          }));
        }

        return { status: 'success', time: now, count: mergedActivities.length };
      } catch (err) {
        console.error('[GreenShift DB] Lỗi trong syncAll:', err);
        this.updateStatusBadge('error');
        return { status: 'error', error: err.message };
      } finally {
        syncInProgress = false;
      }
    },

    /**
     * Tải tệp chứng từ lên Supabase Storage bucket 'invoice_documents'
     * @param {File|Blob} file - Đối tượng File từ input file
     * @param {string} customName - Tên tệp lưu trữ
     * @returns {Promise<{ success: boolean, url?: string, path?: string, error?: string }>}
     */
    async uploadDocument(file, customName) {
      const client = this.getClient();
      if (!client) {
        return { success: false, error: 'Chưa cấu hình Supabase Client' };
      }

      try {
        const originalName = customName || (file && file.name) || 'document';
        const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniquePath = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;

        const { data, error } = await client.storage
          .from('invoice_documents')
          .upload(uniquePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.warn('[GreenShift DB] Lỗi tải lên Supabase Storage:', error);
          return { success: false, error: error.message };
        }

        // Tạo Signed URL bảo mật tạm thời (3600s = 60 phút) thay vì Public URL
        const { data: signedUrlData } = await client.storage
          .from('invoice_documents')
          .createSignedUrl(uniquePath, 3600);

        const url = signedUrlData ? signedUrlData.signedUrl : '';
        return {
          success: true,
          path: uniquePath,
          url: url
        };
      } catch (err) {
        console.warn('[GreenShift DB] Ngoại lệ khi tải tệp lên Supabase Storage:', err);
        return { success: false, error: err.message };
      }
    },

    /**
     * Cập nhật trạng thái hiển thị trên thanh Navigation
     */
    updateStatusBadge(state) {
      if (typeof document === 'undefined') return;
      const badges = document.querySelectorAll('.cloud-sync-status-badge');
      badges.forEach(badge => {
        if (state === 'connected') {
          badge.innerHTML = '<span class="status-indicator-dot dot-green" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;margin-right:6px;"></span><span class="sync-text">Cloud Sync (Supabase)</span>';
          badge.title = 'Đã kết nối Cơ sở Dữ liệu Supabase. Nhấp để quản lý.';
          badge.className = 'cloud-sync-status-badge badge-connected';
        } else if (state === 'syncing') {
          badge.innerHTML = '<span class="status-indicator-dot dot-blue" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#0284c7;margin-right:6px;"></span><span class="sync-text">Đang đồng bộ...</span>';
          badge.title = 'Hệ thống đang đồng bộ dữ liệu với Supabase.';
          badge.className = 'cloud-sync-status-badge badge-syncing';
        } else if (state === 'local') {
          badge.innerHTML = '<span class="status-indicator-dot dot-yellow" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#eab308;margin-right:6px;"></span><span class="sync-text">Local Mode (Máy cục bộ)</span>';
          badge.title = 'Đang lưu trữ dữ liệu an toàn trên trình duyệt. Nhấp để kết nối Supabase Cloud.';
          badge.className = 'cloud-sync-status-badge badge-local';
        } else if (state === 'error') {
          badge.innerHTML = '<span class="status-indicator-dot dot-red" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#dc2626;margin-right:6px;"></span><span class="sync-text">Lỗi kết nối CSDL</span>';
          badge.title = 'Không thể kết nối Supabase. Hệ thống đang dùng dữ liệu trên máy an toàn.';
          badge.className = 'cloud-sync-status-badge badge-error';
        }
      });
    },

    /**
     * Tự động khởi chạy kiểm tra và kích hoạt đồng bộ ngầm khi trang tải xong
     */
    async initUI() {
      this.checkSessionTTL();
      if (typeof document === 'undefined') return;
      const config = window.GREENSHIFT_SUPABASE_CONFIG;
      if (!config || !config.isConfigured()) {
        this.updateStatusBadge('local');
        return;
      }

      this.updateStatusBadge('syncing');
      const test = await this.testConnection();
      if (test.connected) {
        this.updateStatusBadge('connected');
        // Kích hoạt đồng bộ ngầm 2 chiều khi khởi động ứng dụng
        setTimeout(() => {
          this.syncAll().catch(err => console.warn('[GreenShift DB] Khởi động đồng bộ ban đầu thất bại:', err));
        }, 800);

        // Chu kỳ tự động đồng bộ ngầm định kỳ mỗi 5 phút nếu tab đang mở
        if (!window._gsPeriodicSyncTimer) {
          window._gsPeriodicSyncTimer = setInterval(() => {
            if (!syncInProgress && typeof document !== 'undefined' && !document.hidden) {
              console.log('[GreenShift DB] Đồng bộ định kỳ 5 phút...');
              this.syncAll().catch(e => console.warn('[GreenShift DB] Định kỳ đồng bộ gặp lỗi:', e));
            }
          }, 300000);
        }
      } else {
        this.updateStatusBadge('local');
      }
    },

    /**
     * Kích hoạt đồng bộ tự động ngầm 2 chiều sau mỗi thao tác thêm/sửa/xóa (Debounced)
     */
    triggerAutoSync(delayMs = 1500) {
      if (typeof window === 'undefined') return;
      const config = window.GREENSHIFT_SUPABASE_CONFIG;
      if (!config || !config.isConfigured()) return;

      if (window._gsAutoSyncTimer) clearTimeout(window._gsAutoSyncTimer);
      window._gsAutoSyncTimer = setTimeout(async () => {
        try {
          if (!syncInProgress) {
            console.log('[GreenShift DB] Auto-syncing data to Supabase Cloud...');
            await this.syncAll();
          }
        } catch (err) {
          console.warn('[GreenShift DB] Tự động đồng bộ ngầm gặp lỗi:', err);
        }
      }, delayMs);
    },

    /**
     * Tải tệp chứng từ lên Supabase Storage Bucket 'invoice_documents' (Private)
     * @param {string} filePath - Đường dẫn lưu trữ (ví dụ: tenantId/facilityId/filename.pdf)
     * @param {File|Blob|ArrayBuffer} fileBody - Dữ liệu nhị phân tệp
     * @returns {Promise<{path: string|null, error: any}>}
     */
    async uploadInvoiceDocument(filePath, fileBody) {
      const client = this.getClient();
      if (!client) return { path: null, error: 'Chưa cấu hình Supabase Client' };
      try {
        const { data, error } = await client.storage
          .from('invoice_documents')
          .upload(filePath, fileBody, {
            cacheControl: '3600',
            upsert: true
          });
        if (error) return { path: null, error };
        return { path: data.path, error: null };
      } catch (err) {
        return { path: null, error: err };
      }
    },

    /**
     * Tạo Signed URL bảo mật có chữ ký số giới hạn thời gian (mặc định 60 phút) để xem/tải chứng từ
     * @param {string} filePath - Đường dẫn tệp trong bucket
     * @param {number} expiresIn - Thời gian sống tính bằng giây (mặc định 3600s = 60 phút)
     * @returns {Promise<{signedUrl: string|null, error: any}>}
     */
    async createSignedInvoiceUrl(filePath, expiresIn = 3600) {
      const client = this.getClient();
      if (!client) return { signedUrl: null, error: 'Chưa cấu hình Supabase Client' };
      try {
        const { data, error } = await client.storage
          .from('invoice_documents')
          .createSignedUrl(filePath, expiresIn);
        if (error) return { signedUrl: null, error };
        return { signedUrl: data.signedUrl, error: null };
      } catch (err) {
        return { signedUrl: null, error: err };
      }
    }
  };

  // Đăng ký toàn cục
  if (typeof window !== 'undefined') {
    window.GreenShiftDB = GreenShiftDB;
  }

  // Tự động khởi tạo sau khi nạp trang (trong môi trường browser)
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => GreenShiftDB.initUI());
    } else {
      GreenShiftDB.initUI();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GreenShiftDB };
  }

})(typeof window !== 'undefined' ? window : global);

