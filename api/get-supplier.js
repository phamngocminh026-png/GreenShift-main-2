import { get } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const rawToken = req.query.token || req.url.split('/').pop().split('?')[0];
    const safe = String(rawToken || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);

    if (!safe) {
      return res.status(400).json({ error: 'Token không hợp lệ' });
    }

    try {
      const blob = await get(`supplier-surveys/${safe}.json`, { access: 'private' });
      if (!blob) {
        return res.status(404).json({ error: 'Không tìm thấy dữ liệu khảo sát' });
      }
      const text = await new Response(blob.stream).text();
      const data = JSON.parse(text);
      return res.status(200).json({ success: true, supplier: data });
    } catch (err) {
      return res.status(404).json({ error: 'Không tìm thấy dữ liệu khảo sát' });
    }
  } catch (error) {
    console.error('Get supplier error:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi đọc khảo sát' });
  }
}
