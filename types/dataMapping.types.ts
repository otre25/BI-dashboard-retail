// Data mapping types for automatic field detection and transformation

export type FieldType =
  | 'date'
  | 'amount'
  | 'store'
  | 'channel'
  | 'status'
  | 'number'
  | 'text'
  | 'unknown';

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  fieldType: FieldType;
  confidence: number; // 0-1 score for auto-detection confidence
  transform?: (value: any) => any;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'airtable' | 'notion' | 'google_sheets' | 'csv' | 'json';
  apiConfig?: {
    apiKey?: string;
    baseId?: string;
    tableId?: string;
    sheetId?: string;
  };
}

export interface ImportPreview {
  source: DataSource;
  rawData: Record<string, any>[];
  detectedFields: FieldMapping[];
  transformedData: Record<string, any>[];
  errors: ImportError[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

export interface ImportError {
  row: number;
  field: string;
  error: string;
  value: any;
}

export interface SchemaDetectionResult {
  fieldName: string;
  detectedType: FieldType;
  confidence: number;
  sampleValues: any[];
  suggestedMapping?: string;
}

// Standard target schema for BI dashboard
export interface StandardDataSchema {
  date: Date;
  store_id: string;
  store_name: string;
  channel: string;
  ad_spend: number;
  revenue: number;
  orders: number;
  conversions: number;
  impressions?: number;
  clicks?: number;
  status?: string;
}

// Field name patterns for auto-detection
export const FIELD_PATTERNS: Record<FieldType, RegExp[]> = {
  date: [
    /^date$/i,
    /^data$/i,
    /^data[_-]?vendita$/i,
    /^data[_-]?ordine$/i,
    /^order[_-]?date$/i,
    /^created[_-]?at$/i,
    /^timestamp$/i,
    /^giorno$/i,
  ],
  amount: [
    /^importo$/i,
    /^amount$/i,
    /^spesa$/i,
    /^fatturato$/i,
    /^revenue$/i,
    /^ad[_-]?spend$/i,
    /^costo$/i,
    /^cost$/i,
    /^prezzo$/i,
    /^price$/i,
    /^valore$/i,
    /^value$/i,
  ],
  store: [
    /^negozio$/i,
    /^store$/i,
    /^punto[_-]?vendita$/i,
    /^location$/i,
    /^sede$/i,
    /^shop$/i,
    /^store[_-]?name$/i,
    /^store[_-]?id$/i,
  ],
  channel: [
    /^canale$/i,
    /^channel$/i,
    /^source$/i,
    /^medium$/i,
    /^campaign$/i,
    /^utm[_-]?source$/i,
    /^utm[_-]?medium$/i,
    /^piattaforma$/i,
    /^platform$/i,
  ],
  status: [
    /^stato$/i,
    /^status$/i,
    /^state$/i,
    /^condition$/i,
  ],
  number: [
    /^num/i,
    /^count$/i,
    /^quantity$/i,
    /^quantita$/i,
    /^orders$/i,
    /^ordini$/i,
    /^conversions$/i,
    /^conversioni$/i,
    /^clicks$/i,
    /^impressions$/i,
    /^views$/i,
  ],
  text: [],
  unknown: [],
};
