import api from './api';
import { Vendor, VendorItemMap, VendorPerformanceReview } from '@/types';

const unwrap = <T,>(response: any): T[] => response?.data?.data ?? response?.data?.vendors ?? response?.data ?? [];

const toFrontendVendor = (vendor: any): Vendor => ({
  id: vendor.id || vendor._id,
  name: vendor.name || vendor.vendorName || '',
  code: vendor.code || vendor.vendorCode || `V-${String(vendor.id || vendor._id || '').slice(-6).toUpperCase()}`,
  contactPerson: vendor.contactPerson || '',
  email: vendor.email || '',
  phone: vendor.phone || '',
  address: vendor.address || '',
  taxId: vendor.taxId || vendor.gstin || '',
  paymentTerms: vendor.paymentTerms || '',
  status: vendor.status || (vendor.isActive === false ? 'Inactive' : 'Active'),
  rating: typeof vendor.rating === 'number' ? vendor.rating : (typeof vendor.vendorRating === 'number' ? vendor.vendorRating : 0),
  category: vendor.category || vendor.productsSupplied || '',
});

const toBackendVendor = (vendor: Partial<Vendor>) => ({
  vendorName: vendor.name,
  contactPerson: vendor.contactPerson,
  email: vendor.email,
  phone: vendor.phone,
  address: vendor.address,
  gstin: vendor.taxId,
  paymentTerms: vendor.paymentTerms,
  productsSupplied: vendor.category,
  isActive: vendor.status !== 'Inactive' && vendor.status !== 'Blacklisted',
});

const toFrontendPriceEntry = (entry: any): VendorItemMap => ({
  id: entry.id || entry._id,
  vendorId: String(entry.vendorId?._id || entry.vendorId || ''),
  vendorName: entry.vendor || entry.vendorName || '',
  itemId: String(entry.itemId?._id || entry.itemId || ''),
  itemName: entry.item || entry.itemName || '',
  sku: entry.sku || '',
  vendorSku: entry.vendorSku || '',
  price: Number(entry.price || 0),
  currency: entry.currency || 'USD',
  leadTimeDays: Number(entry.leadDays ?? entry.leadTimeDays ?? 0),
  lastUpdated: (entry.lastUpdated || entry.updatedAt || new Date().toISOString()).toString().slice(0, 10),
});

const toFrontendReview = (record: any): VendorPerformanceReview[] => {
  const reviews = Array.isArray(record.reviews) ? record.reviews : [];
  return reviews.map((review: any) => ({
    id: review.id || `${record._id || record.id}-${review.quarter || 'review'}`,
    vendorId: String(record.vendorId || record.id || record._id || ''),
    vendorName: record.vendorName || '',
    date: (review.date || record.updatedAt || new Date().toISOString()).toString().slice(0, 10),
    period: review.quarter || 'Current',
    score: Number(review.score || 0),
    metrics: {
      onTimeDelivery: Number(review.delivery || record.onTimeRate || 0),
      qualityAcceptance: Number(review.quality || 0),
      pricingCompetitiveness: Math.max(1, Math.min(5, Math.round((Number(review.pricing || 0) / 20) || 0) || 1)),
      responsiveScore: Math.max(1, Math.min(5, Math.round((Number(review.score || 0) / 20) || 0) || 1)),
    },
    notes: review.comment || '',
  }));
};

export const vendorService = {
  // --- Vendors ---
  getVendors: async (): Promise<Vendor[]> => {
    const response = await api.get('/purchase/vendors');
    const vendors = response.data.vendors ?? response.data.data ?? [];
    return vendors.map(toFrontendVendor);
  },

  createVendor: async (data: Omit<Vendor, 'id' | 'rating'>): Promise<Vendor> => {
    const response = await api.post('/purchase/vendors', toBackendVendor(data));
    return toFrontendVendor(response.data.vendor ?? response.data.data ?? response.data);
  },

  updateVendor: async (id: string, updates: Partial<Vendor>): Promise<void> => {
    await api.put(`/purchase/vendors/${id}`, toBackendVendor(updates));
  },

  deleteVendor: async (id: string): Promise<void> => {
    await api.delete(`/purchase/vendors/${id}`);
  },

  // --- Price List & Item Mapping ---
  getVendorItemMaps: async (): Promise<VendorItemMap[]> => {
    const response = await api.get('/api/vendor-management/price-entries');
    return unwrap<any>(response).map(toFrontendPriceEntry);
  },

  saveVendorItemMap: async (data: Omit<VendorItemMap, 'id' | 'lastUpdated'>): Promise<VendorItemMap> => {
    const payload = {
      item: data.itemName,
      itemId: data.itemId,
      sku: data.sku,
      vendorId: data.vendorId,
      vendor: data.vendorName,
      price: data.price,
      currency: data.currency,
      leadDays: data.leadTimeDays,
      vendorSku: data.vendorSku || '',
      category: '',
    };

    const response = data.id
      ? await api.put(`/api/vendor-management/price-entry/${data.id}`, payload)
      : await api.post('/api/vendor-management/price-entry', payload);

    return toFrontendPriceEntry(response.data.data ?? response.data);
  },

  deleteVendorItemMap: async (id: string): Promise<void> => {
    await api.delete(`/api/vendor-management/price-entry/${id}`);
  },

  // --- Performance Reviews ---
  getReviews: async (): Promise<VendorPerformanceReview[]> => {
    const response = await api.get('/api/vendor-management/performance');
    const records = unwrap<any>(response);
    return records.flatMap(toFrontendReview).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addReview: async (data: Omit<VendorPerformanceReview, 'id' | 'date'>): Promise<VendorPerformanceReview> => {
    const payload = {
      quarter: data.period,
      score: data.score,
      delivery: data.metrics.onTimeDelivery,
      quality: data.metrics.qualityAcceptance,
      pricing: data.metrics.pricingCompetitiveness * 20,
      comment: data.notes,
    };

    const response = await api.post(`/api/vendor-management/performance/${data.vendorId}/review`, payload);
    const record = response.data.data ?? response.data;
    const reviews = toFrontendReview(record);
    return reviews[reviews.length - 1] ?? {
      ...data,
      id: `${data.vendorId}-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
  }
};
