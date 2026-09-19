import { put } from '@vercel/blob';
import crypto from 'crypto';

// Sliding-window rate limiting map for serverless instances
const SURVEY_SUBMISSIONS = new Map();
const MAX_SURVEY_ATTEMPTS = 30;
const SURVEY_WINDOW_MS = 15 * 60 * 1000; // 15 phut

function isRateLimited(ip) {
  const now = Date.now();
  const history = SURVEY_SUBMISSIONS.get(ip) || [];
  const recent = history.filter(t => now - t < SURVEY_WINDOW_MS);
  SURVEY_SUBMISSIONS.set(ip, recent);
  return recent.length >= MAX_SURVEY_ATTEMPTS;
}

function recordSubmission(ip) {
  const now = Date.now();
  const history = SURVEY_SUBMISSIONS.get(ip) || [];
  history.push(now);
  SURVEY_SUBMISSIONS.set(ip, history);
  
  // Tu dong don dep bo nho khi danh sach vuot qua 1000 IP
  if (SURVEY_SUBMISSIONS.size > 1000) {
    for (const [key, timestamps] of SURVEY_SUBMISSIONS.entries()) {
      const active = timestamps.filter(t => now - t < SURVEY_WINDOW_MS);
      if (active.length === 0) {
        SURVEY_SUBMISSIONS.delete(key);
      } else {
        SURVEY_SUBMISSIONS.set(key, active);
      }
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({success:false,message:'Method not allowed'});

  // 1. Trich xuat IP va kiem tra Rate Limit chong spam
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ||
                   req.headers['x-real-ip'] ||
                   req.socket?.remoteAddress ||
                   '127.0.0.1';

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      message: 'Quá nhiều lượt gửi khảo sát từ địa chỉ IP của bạn. Vui lòng thử lại sau 15 phút.'
    });
  }

  // 2. Kiem soat kich thuoc payload chong DoS (gioi han 200KB)
  const bodyStr = JSON.stringify(req.body || {});
  if (bodyStr.length > 200000) {
    return res.status(413).json({
      success: false,
      message: 'Kích thước dữ liệu khảo sát vượt quá giới hạn cho phép (tối đa 200KB).'
    });
  }

  try {
    const { token, supplier } = req.body || {};
    if (!supplier || !supplier.companyName) {
      return res.status(400).json({success:false,message:'Thiếu thông tin nhà cung cấp'});
    }
    
    let isNew = false;
    let safe;
    if (!token || String(token).trim() === 'public-survey' || String(token).trim() === 'new') {
      safe = crypto.randomUUID().replace(/-/g, '');
      isNew = true;
    } else {
      safe = String(token).trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
      if (safe.length < 16) {
        // Token ngắn hoặc entropy thấp (như test-token-123) -> sinh token UUID an toàn mới
        safe = crypto.randomUUID().replace(/-/g, '');
        isNew = true;
      }
    }

    const payload = {
      ...supplier,
      token: safe,
      submittedAt: new Date().toISOString()
    };

    const blob = await put(`supplier-surveys/${safe}.json`, JSON.stringify(payload, null, 2), {
      access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true
    });

    // Ghi nhan luot gui thanh cong cho IP
    recordSubmission(clientIp);

    return res.status(200).json({
      success: true,
      message: 'Đã lưu bản ghi khảo sát nhà cung cấp vào cơ sở dữ liệu.',
      token: safe,
      url: blob.url
    });
  } catch(e) {
    console.error('Save supplier error:', e);
    return res.status(500).json({success:false,message:e.message || 'Không thể lưu khảo sát'});
  }
}
