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
    const { fileName, fileBase64 } = req.body || {};

    if (!fileName || !fileBase64) {
      return res.status(400).json({
        success: false,
        message: 'Missing fileName or fileBase64 payload'
      });
    }

    const cleanFileName = String(fileName)
      .replace(/\\/g, '/')
      .split('/')
      .pop()
      .replace(/[^a-zA-Z0-9_\-.]/g, '_')
      .slice(0, 100);

    if (!cleanFileName || !cleanFileName.toLowerCase().endsWith('.xlsx')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file: Only Excel (.xlsx) files are permitted'
      });
    }

    const fileBuffer = Buffer.from(fileBase64, 'base64');
    if (fileBuffer.length > 15 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed limit of 15MB'
      });
    }

    const blob = await put(
      `reports/${cleanFileName}`,
      fileBuffer,
      {
        access: 'private',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        addRandomSuffix: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Report uploaded successfully',
      url: blob.url,
      pathname: blob.pathname
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Upload failed'
    });
  }
}
