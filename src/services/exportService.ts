import api from './api';

export type ExportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ExportFormat = 'csv' | 'excel';

export const exportService = {
  // Export Stock Summary Report
  exportStockSummary: async (period: ExportPeriod, format: ExportFormat = 'csv') => {
    try {
      console.log(`📥 Exporting Stock Summary (${period}, ${format})`);
      const response = await api.get(`/api/export/stock-summary`, {
        params: { period, format },
        responseType: 'blob'
      });

      console.log('�... Response received:', response.status, response.headers);
      console.log('📊 Blob size:', response.data.size, 'bytes');
      
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      // response.data is already a Blob when responseType: 'blob' is set
      // Don't wrap it again, use it directly
      const fileName = `stock-summary-${period}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      triggerDownload(response.data, fileName);
      console.log(`�... Stock Summary exported as ${format}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error exporting stock summary:', error);
      if (error.response?.data) {
        console.error('Error response:', error.response.data);
      }
      throw new Error(error.response?.data?.error || error.message || 'Export failed');
    }
  },

  // Export Item Stock Report
  exportItemStock: async (period: ExportPeriod, format: ExportFormat = 'csv', filters?: any) => {
    try {
      console.log(`📥 Exporting Item Stock (${period}, ${format})`);
      const params = { period, format, ...filters };
      const response = await api.get(`/api/export/item-stock`, {
        params,
        responseType: 'blob'
      });

      console.log('�... Response received:', response.status, response.headers);
      const fileName = `item-stock-${period}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      triggerDownload(response.data, fileName);
      console.log(`�... Item Stock exported as ${format}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error exporting item stock:', error);
      if (error.response?.data) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  // Export Warehouse Report
  exportWarehouse: async (period: ExportPeriod, format: ExportFormat = 'csv') => {
    try {
      console.log(`📥 Exporting Warehouse Report (${period}, ${format})`);
      const response = await api.get(`/api/export/warehouse`, {
        params: { period, format },
        responseType: 'blob'
      });

      console.log('�... Response received:', response.status, response.headers);
      const fileName = `warehouse-report-${period}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      triggerDownload(response.data, fileName);
      console.log(`�... Warehouse Report exported as ${format}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error exporting warehouse report:', error);
      if (error.response?.data) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  // Export Aging Analysis Report
  exportAgingAnalysis: async (period: ExportPeriod, format: ExportFormat = 'csv') => {
    try {
      console.log(`📥 Exporting Aging Analysis (${period}, ${format})`);
      const response = await api.get(`/api/export/aging-analysis`, {
        params: { period, format },
        responseType: 'blob'
      });

      const fileName = `aging-analysis-${period}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      triggerDownload(response.data, fileName);
      return true;
    } catch (error: any) {
      console.error('❌ Error exporting aging analysis:', error);
      throw error;
    }
  },

  // Export Expiry Analysis Report
  exportExpiryAnalysis: async (period: ExportPeriod, format: ExportFormat = 'csv') => {
    try {
      console.log(`📥 Exporting Expiry Analysis (${period}, ${format})`);
      const response = await api.get(`/api/export/expiry-analysis`, {
        params: { period, format },
        responseType: 'blob'
      });

      const fileName = `expiry-analysis-${period}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      triggerDownload(response.data, fileName);
      return true;
    } catch (error: any) {
      console.error('❌ Error exporting expiry analysis:', error);
      throw error;
    }
  },

  // Export Audit Report
  exportAudit: async (period: ExportPeriod, format: ExportFormat = 'csv') => {
    try {
      console.log(`📥 Exporting Audit Report (${period}, ${format})`);
      const response = await api.get(`/api/export/audit`, {
        params: { period, format },
        responseType: 'blob'
      });

      const fileName = `audit-report-${period}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      triggerDownload(response.data, fileName);
      return true;
    } catch (error: any) {
      console.error('❌ Error exporting audit report:', error);
      throw error;
    }
  },

  // Export GST Report
  exportGst: async (period: ExportPeriod, format: ExportFormat = 'csv') => {
    try {
      console.log(`📥 Exporting GST Report (${period}, ${format})`);
      const response = await api.get(`/api/export/gst`, {
        params: { period, format },
        responseType: 'blob'
      });

      const fileName = `gst-report-${period}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      triggerDownload(response.data, fileName);
      return true;
    } catch (error: any) {
      console.error('❌ Error exporting GST report:', error);
      throw error;
    }
  },

  // Export Movement Analysis Report
  exportMovementAnalysis: async (period: ExportPeriod, format: ExportFormat = 'csv') => {
    try {
      console.log(`📥 Exporting Movement Analysis (${period}, ${format})`);
      const response = await api.get(`/api/export/movement-analysis`, {
        params: { period, format },
        responseType: 'blob'
      });

      const fileName = `movement-analysis-${period}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      triggerDownload(response.data, fileName);
      return true;
    } catch (error: any) {
      console.error('❌ Error exporting movement analysis:', error);
      throw error;
    }
  },

  // Export Valuation Report
  exportValuation: async (period: ExportPeriod, format: ExportFormat = 'csv') => {
    try {
      console.log(`📥 Exporting Valuation Report (${period}, ${format})`);
      const response = await api.get(`/api/export/valuation`, {
        params: { period, format },
        responseType: 'blob'
      });

      const fileName = `valuation-report-${period}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      triggerDownload(response.data, fileName);
      return true;
    } catch (error: any) {
      console.error('❌ Error exporting valuation report:', error);
      throw error;
    }
  }
};

// Helper function to trigger download
const triggerDownload = (blob: Blob, fileName: string) => {
  try {
    // Check if blob is valid
    if (!blob || blob.size === 0) {
      throw new Error('Blob is empty or invalid');
    }
    
    console.log('📝 Blob info:', { size: blob.size, type: blob.type });
    
    const url = window.URL.createObjectURL(blob);
    console.log('📝 Created object URL:', url);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    console.log('📝 Link added to DOM, clicking...');
    
    // Trigger click
    link.click();
    console.log('�... Click triggered');
    
    // Use longer cleanup timeout and dispatch click event
    setTimeout(() => {
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
        console.log('�... Cleanup complete');
      } catch (e) {
        console.error('❌ Cleanup error:', e);
      }
    }, 500);
  } catch (error) {
    console.error('❌ Error triggering download:', error);
    alert('Download failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    throw error;
  }
};

// Test function - call from browser console: window.testExport()
(window as any).testExport = async () => {
  console.log('🧪 Testing export API...');
  try {
    const response = await api.get('/api/export/stock-summary', {
      params: { period: 'monthly', format: 'csv' },
      responseType: 'blob'
    });
    console.log('�... API Response status:', response.status);
    console.log('📊 Blob size:', response.data.size);
    console.log('🎯 Blob type:', response.data.type);
    console.log('�... Full blob data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
};
