// Data Source Integration Types

export type DataSourceType = 'airtable' | 'notion' | 'googlesheets' | 'excel';

export interface DataSourceConfig {
  id: string;
  type: DataSourceType;
  name: string;
  enabled: boolean;
  credentials: {
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    spreadsheetId?: string;
    databaseId?: string;
    baseId?: string;
    tableId?: string;
  };
  mappings: DataMapping[];
  lastSync?: Date;
  syncInterval?: number; // in minutes
  autoSync?: boolean;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transform?: 'number' | 'date' | 'currency' | 'percentage' | 'text';
  required?: boolean;
}

export interface AirtableConfig {
  baseId: string;
  tableId: string;
  apiKey: string;
  view?: string;
}

export interface NotionConfig {
  databaseId: string;
  accessToken: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  range?: string;
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

// Airtable Response Types
export interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
}

export interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

// Notion Response Types
export interface NotionPage {
  id: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
}

export interface NotionDatabaseResponse {
  results: NotionPage[];
  next_cursor?: string;
  has_more: boolean;
}

// Google Sheets Response Types
export interface GoogleSheetsResponse {
  range: string;
  majorDimension: string;
  values: string[][];
}

// Unified Data Import Result
export interface DataImportResult {
  success: boolean;
  source: DataSourceType;
  recordsImported: number;
  recordsFailed: number;
  errors?: string[];
  timestamp: Date;
}

// Data Sync Status
export interface DataSyncStatus {
  sourceId: string;
  sourceName: string;
  sourceType: DataSourceType;
  lastSync: Date | null;
  nextSync: Date | null;
  status: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage?: string;
  recordsProcessed?: number;
}
