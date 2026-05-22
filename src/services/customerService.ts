import api from "./api";
import { authService } from "./authService";

export type CustomerType = "Retail" | "Wholesale" | "Distributor" | "Corporate";
export type CustomerStatus = "Active" | "Inactive";

export interface CustomerRecord {
  id: string;
  name: string;
  code: string;
  mobile: string;
  email: string;
  gst: string;
  type: CustomerType;
  creditLimit: number;
  outstanding: number;
  status: CustomerStatus;
  city: string;
  state: string;
  pan?: string;
  billing?: string;
  shipping?: string;
  pincode?: string;
  paymentTerms?: string;
  salesPerson?: string;
  warehouse?: string;
  createdAt?: string;
}

export interface CustomerInput {
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  gst?: string;
  pan?: string;
  billing?: string;
  shipping?: string;
  city?: string;
  state?: string;
  pincode?: string;
  type?: string;
  creditLimit?: string | number;
  paymentTerms?: string;
  salesPerson?: string;
  warehouse?: string;
}

const getOrganisationId = () => authService.getOrganisationId() || "";

const toFrontendCustomer = (customer: any): CustomerRecord => ({
  id: String(customer.id || customer._id || ""),
  name: customer.customerName || customer.name || "",
  code: customer.customerCode || customer.code || "",
  mobile: customer.phone || customer.mobile || "",
  email: customer.email || "",
  gst: customer.gstin || customer.gst || "",
  type: customer.customerType || customer.type || "Retail",
  creditLimit: Number(customer.creditLimit || 0),
  outstanding: Number(customer.outstanding || 0),
  status: customer.isActive === false || customer.status === "Inactive" ? "Inactive" : "Active",
  city: customer.city || "",
  state: customer.state || "",
  pan: customer.pan || "",
  billing: customer.billingAddress || customer.billing || "",
  shipping: customer.shippingAddress || customer.shipping || "",
  pincode: customer.pincode || "",
  paymentTerms: customer.paymentTerms || "",
  salesPerson: customer.salesPerson || "",
  warehouse: customer.warehouse || "",
  createdAt: customer.createdAt,
});

const toBackendCustomer = (customer: CustomerInput) => ({
  organisationId: getOrganisationId(),
  customerName: customer.name,
  customerCode: customer.code?.trim() || undefined,
  phone: customer.phone,
  email: customer.email,
  gstin: customer.gst,
  pan: customer.pan,
  billingAddress: customer.billing,
  shippingAddress: customer.shipping,
  city: customer.city,
  state: customer.state,
  pincode: customer.pincode,
  customerType: customer.type || "Retail",
  creditLimit: Number(customer.creditLimit || 0),
  paymentTerms: customer.paymentTerms,
  salesPerson: customer.salesPerson,
  warehouse: customer.warehouse,
  isActive: true,
});

export const customerService = {
  getCustomers: async (): Promise<CustomerRecord[]> => {
    const organisationId = getOrganisationId();
    if (!organisationId) return [];

    const response = await api.get("/api/customers", {
      params: { organisationId, limit: 500 },
    });
    const customers = response.data.customers ?? response.data.data ?? response.data ?? [];
    return customers.map(toFrontendCustomer);
  },

  createCustomer: async (customer: CustomerInput): Promise<CustomerRecord> => {
    const organisationId = getOrganisationId();
    if (!organisationId) {
      throw new Error("organisationId is required to create a customer");
    }

    const response = await api.post("/api/customers", toBackendCustomer(customer));
    return toFrontendCustomer(response.data.customer ?? response.data.data ?? response.data);
  },

  deleteCustomer: async (id: string): Promise<void> => {
    const organisationId = getOrganisationId();
    await api.delete(`/api/customers/${id}`, { params: { organisationId } });
  },
};
