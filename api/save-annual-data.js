import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  // Fail-closed API security check
  const authHeader = req.headers.authorization || req.headers['x-api-key'];
  const expectedSecret = process.env.GREENSHIFT_API_SECRET;
  if (!expectedSecret) {
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: GREENSHIFT_API_SECRET is not configured'
    });
  }
  if (authHeader !== `Bearer ${expectedSecret}` && authHeader !== expectedSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid authentication credentials'
    });
  }

  try {
    const {
      fileName,
      data
    } = req.body || {};

    if (!fileName || typeof fileName !== 'string' || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid fileName or data'
      });
    }

    // Sanitize fileName to prevent path traversal and enforce safe characters
    const cleanBaseName = fileName
      .trim()
      .replace(/\\/g, '/')
      .split('/')
      .pop()
      .replace(/[^a-zA-Z0-9_\-.]/g, '_')
      .slice(0, 100);

    const safeFileName = cleanBaseName.endsWith('.json') ? cleanBaseName : `${cleanBaseName}.json`;

    if (!safeFileName || safeFileName === '.json') {
      return res.status(400).json({
        success: false,
        message: 'Invalid fileName provided'
      });
    }

    const jsonData = JSON.stringify(data, null, 2);

    const blob = await put(
      `annual-data/${safeFileName}`,
      jsonData,
      {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'application/json',
        allowOverwrite: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Dữ liệu đã được lưu lên Vercel Blob',
      url: blob.url
    });

  } catch (error) {
    console.error('Save annual data error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Không thể lưu dữ liệu'
    });
  }
}