import { put } from '@vercel/blob';

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  // Fail-closed API security check: GREENSHIFT_API_SECRET must be configured
  const expectedSecret = process.env.GREENSHIFT_API_SECRET;
  if (!expectedSecret) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi cấu hình hệ thống: Biến môi trường GREENSHIFT_API_SECRET chưa được thiết lập trên máy chủ'
    });
  }

  const authHeader = req.headers.authorization || req.headers['x-api-key'];
  if (!authHeader || (authHeader !== `Bearer ${expectedSecret}` && authHeader !== expectedSecret)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Thiếu hoặc sai thông tin xác thực (Bearer API Secret)'
    });
  }

  try {
    const { fileName, fileBase64 } = req.body || {};

    if (!fileName || typeof fileName !== 'string' || !fileBase64 || typeof fileBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid file information'
      });
    }

    // Limit payload size to prevent storage DoS (max ~15MB decoded)
    if (fileBase64.length > 20 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: 'File payload exceeds maximum allowed size (15MB)'
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

    const safeFileName = cleanBaseName.endsWith('.xlsx') ? cleanBaseName : `${cleanBaseName}.xlsx`;

    if (!safeFileName || safeFileName === '.xlsx') {
      return res.status(400).json({
        success: false,
        message: 'Invalid fileName provided'
      });
    }

    const fileBuffer = Buffer.from(fileBase64, 'base64');

    const blob = await put(
      `reports/${safeFileName}`,
      fileBuffer,
      {
        access: 'private',
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        addRandomSuffix: false,
        allowOverwrite: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Excel uploaded successfully',
      pathname: blob.pathname,
      url: blob.url
    });

  } catch (error) {
    console.error('Upload error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload report'
    });
  }
}