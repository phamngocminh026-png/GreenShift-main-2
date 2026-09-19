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
    const { company } = req.body || {};

    if (!company || !company.name || typeof company.name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Company information is missing or invalid'
      });
    }

    // Use tax code as primary unique identifier to avoid name collisions across tenants
    const taxId = (company.taxId || company.tax_id || company.tax || '')
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9_\-]/g, '');

    let fileName;
    if (taxId) {
      fileName = `companies/tax_${taxId}.json`;
    } else {
      const sanitizedName = company.name
        .trim()
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        .slice(0, 100);
      fileName = `companies/${sanitizedName}.json`;
    }

    const blob = await put(
      fileName,
      JSON.stringify(company, null, 2),
      {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Company information saved successfully',
      url: blob.url
    });

  } catch (error) {
    console.error('Save company error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save company information'
    });
  }
}