// Universal sales data connector types

export type SalesSourceType =
  | 'airtable'
  | 'google_sheets'
  | 'notion'
  | 'teamsystem'
  | 'zucchetti'
  | 'shopify'
  | 'woocommerce'
  | 'sap'
  | 'danea'
  | 'csv_auto'
  | 'custom_api';

export interface SalesSourceCredentials {
  id: string;
  sourceType: SalesSourceType;
  companyId: string;
  name: string; // User-friendly name
  credentials: AirtableCredentials | GoogleSheetsCredentials | NotionCredentials | EcommerceCredentials | CustomAPICredentials;
  isActive: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  syncInterval: number; // minutes
  autoSync: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Airtable
export interface AirtableCredentials {
  apiKey: string;
  baseId: string;
  tableId: string;
  viewId?: string; // Optional filtered view
}

// Google Sheets
export interface GoogleSheetsCredentials {
  apiKey?: string;
  oauthToken?: string;
  spreadsheetId: string;
  sheetName: string;
  range?: string; // e.g., "A1:Z1000"
}

// Notion
export interface NotionCredentials {
  apiKey: string;
  databaseId: string;
}

// E-commerce (Shopify, WooCommerce)
export interface EcommerceCredentials {
  storeUrl: string;
  apiKey: string;
  apiSecret?: string;
  accessToken?: string;
}

// Custom API
export interface CustomAPICredentials {
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  authType: 'none' | 'bearer' | 'basic' | 'api_key';
  authValue?: string;
}

// Raw sales data from any source
export interface RawSalesData {
  sourceId: string;
  sourceType: SalesSourceType;
  rawRecords: Record<string, any>[];
  fetchedAt: Date;
  recordCount: number;
}

// Unified sales data format
export interface UnifiedSalesData {
  id: string;
  companyId: string;
  sourceType: SalesSourceType;
  sourceId: string;

  // Core fields
  date: Date;
  orderId: string;
  storeId?: string;
  storeName: string;

  // Customer info (optional)
  customerId?: string;
  customerName?: string;
  customerEmail?: string;

  // Product info (optional)
  productId?: string;
  productName?: string;
  productCategory?: string;
  quantity: number;

  // Financial
  revenue: number; // Total sale amount
  cost?: number; // Product cost (if available)
  profit?: number; // Revenue - Cost
  discount?: number;
  tax?: number;
  shippingCost?: number;

  // Transaction details
  paymentMethod?: string;
  paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded';
  channel: string; // 'online' | 'in-store' | 'marketplace' | etc.

  // Marketing attribution (if available)
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;

  // Metadata
  notes?: string;
  tags?: string[];
  rawData: Record<string, any>; // Original record
  syncedAt: Date;
}

// Field mapping configuration
export interface SalesFieldMapping {
  sourceField: string;
  targetField: keyof UnifiedSalesData;
  transform?: (value: any) => any;
  required: boolean;
  confidence: number; // 0-1 for auto-detection
}

// Auto-detection result
export interface SalesSchemaDetection {
  sourceType: SalesSourceType;
  detectedFields: {
    fieldName: string;
    mappedTo: keyof UnifiedSalesData | null;
    confidence: number;
    sampleValues: any[];
    dataType: 'string' | 'number' | 'date' | 'boolean';
  }[];
  requiredFieldsCovered: boolean;
  suggestedMappings: SalesFieldMapping[];
  warnings: string[];
}

// Sync status for sales sources
export interface SalesSyncStatus {
  id: string;
  sourceType: SalesSourceType;
  sourceName: string;
  companyId: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync: Date | null;
  nextSync: Date | null;
  recordsSynced: number;
  error?: string;
  progress?: number;
}

// Common field patterns for auto-detection
export const SALES_FIELD_PATTERNS: Record<keyof Partial<UnifiedSalesData>, RegExp[]> = {
  date: [
    /^date$/i,
    /^data$/i,
    /^data[_-]?(ordine|vendita|acquisto)$/i,
    /^order[_-]?date$/i,
    /^sale[_-]?date$/i,
    /^created[_-]?at$/i,
    /^timestamp$/i,
  ],
  orderId: [
    /^order[_-]?id$/i,
    /^ordine$/i,
    /^id[_-]?ordine$/i,
    /^numero[_-]?ordine$/i,
    /^order[_-]?number$/i,
    /^transaction[_-]?id$/i,
  ],
  storeName: [
    /^store$/i,
    /^negozio$/i,
    /^punto[_-]?vendita$/i,
    /^location$/i,
    /^shop$/i,
    /^store[_-]?name$/i,
  ],
  revenue: [
    /^revenue$/i,
    /^fatturato$/i,
    /^importo$/i,
    /^total$/i,
    /^amount$/i,
    /^prezzo$/i,
    /^price$/i,
    /^subtotal$/i,
    /^grand[_-]?total$/i,
  ],
  quantity: [
    /^quantity$/i,
    /^quantit[àa]$/i,
    /^qty$/i,
    /^qta$/i,
    /^pezzi$/i,
    /^items$/i,
  ],
  productName: [
    /^product$/i,
    /^prodotto$/i,
    /^item$/i,
    /^articolo$/i,
    /^product[_-]?name$/i,
    /^nome[_-]?prodotto$/i,
  ],
  customerName: [
    /^customer$/i,
    /^cliente$/i,
    /^name$/i,
    /^nome$/i,
    /^customer[_-]?name$/i,
    /^nome[_-]?cliente$/i,
  ],
  channel: [
    /^channel$/i,
    /^canale$/i,
    /^source$/i,
    /^origine$/i,
    /^sales[_-]?channel$/i,
  ],
  paymentMethod: [
    /^payment$/i,
    /^pagamento$/i,
    /^metodo[_-]?pagamento$/i,
    /^payment[_-]?method$/i,
  ],
  paymentStatus: [
    /^status$/i,
    /^stato$/i,
    /^payment[_-]?status$/i,
    /^stato[_-]?pagamento$/i,
    /^order[_-]?status$/i,
  ],
};

// Validation rules
export interface SalesDataValidation {
  valid: boolean;
  errors: {
    row: number;
    field: string;
    error: string;
    value: any;
  }[];
  warnings: {
    row: number;
    field: string;
    warning: string;
    value: any;
  }[];
}
