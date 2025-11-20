// Google Sheets connector for sales data

import type {
  GoogleSheetsCredentials,
  RawSalesData,
  UnifiedSalesData,
} from '../../types/salesConnections.types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Tests Google Sheets connection
 */
export async function testGoogleSheetsConnection(
  credentials: GoogleSheetsCredentials
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const token = credentials.oauthToken || credentials.apiKey;
    const range = credentials.range || `${credentials.sheetName}!A1:Z1000`;

    const url = `${SHEETS_API_BASE}/${credentials.spreadsheetId}/values/${encodeURIComponent(
      range
    )}?key=${token}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: 'Connessione fallita',
        error: error.error?.message || 'Unknown error',
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: `Connesso a Google Sheets - ${data.values?.length || 0} righe trovate`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Errore di connessione',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetches data from Google Sheets
 */
export async function fetchGoogleSheetsData(
  credentials: GoogleSheetsCredentials,
  sourceId: string
): Promise<RawSalesData | null> {
  try {
    const token = credentials.oauthToken || credentials.apiKey;
    const range = credentials.range || `${credentials.sheetName}!A1:Z10000`;

    const url = `${SHEETS_API_BASE}/${credentials.spreadsheetId}/values/${encodeURIComponent(
      range
    )}?key=${token}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Google Sheets fetch error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const values = data.values || [];

    if (values.length === 0) {
      return {
        sourceId,
        sourceType: 'google_sheets',
        rawRecords: [],
        fetchedAt: new Date(),
        recordCount: 0,
      };
    }

    // First row is headers
    const headers = values[0];
    const records = values.slice(1).map((row: any[]) => {
      const record: Record<string, any> = {};
      headers.forEach((header: string, index: number) => {
        record[header] = row[index] || null;
      });
      return record;
    });

    return {
      sourceId,
      sourceType: 'google_sheets',
      rawRecords: records,
      fetchedAt: new Date(),
      recordCount: records.length,
    };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return null;
  }
}

/**
 * Transforms Google Sheets data to unified format
 */
export function transformGoogleSheetsToUnified(
  rawData: Record<string, any>[],
  fieldMappings: Record<string, string>,
  companyId: string,
  sourceId: string
): UnifiedSalesData[] {
  return rawData
    .filter((record) => {
      // Skip empty rows
      return Object.values(record).some((v) => v != null && v !== '');
    })
    .map((record, index) => {
      const mapped: any = {
        id: `sheets_${sourceId}_${index}`,
        companyId,
        sourceType: 'google_sheets',
        sourceId,
        rawData: record,
        syncedAt: new Date(),
      };

      // Apply field mappings
      for (const [sourceField, targetField] of Object.entries(fieldMappings)) {
        let value = record[sourceField];

        // Transform based on target field
        if (targetField === 'date' && value) {
          value = parseGoogleSheetsDate(value);
        } else if (
          ['revenue', 'cost', 'profit', 'discount', 'tax', 'quantity'].includes(targetField)
        ) {
          value = parseGoogleSheetsNumber(value);
        }

        mapped[targetField] = value;
      }

      // Set defaults
      mapped.paymentStatus = mapped.paymentStatus || 'completed';
      mapped.quantity = mapped.quantity || 1;
      mapped.channel = mapped.channel || 'google_sheets';

      return mapped as UnifiedSalesData;
    });
}

/**
 * Parses Google Sheets date formats
 */
function parseGoogleSheetsDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  // Try ISO format
  const isoDate = new Date(value);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // Try Italian format DD/MM/YYYY
  const italianMatch = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (italianMatch) {
    const [, day, month, year] = italianMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Try Google Sheets serial number (days since 1899-12-30)
  const num = parseFloat(value);
  if (!isNaN(num) && num > 0) {
    const baseDate = new Date(1899, 11, 30);
    baseDate.setDate(baseDate.getDate() + num);
    return baseDate;
  }

  return null;
}

/**
 * Parses Google Sheets number formats
 */
function parseGoogleSheetsNumber(value: any): number {
  if (typeof value === 'number') return value;

  // Remove currency symbols and thousands separators
  const cleaned = String(value)
    .replace(/[€$£¥\s]/g, '')
    .replace(/\./g, '') // Remove thousands separator (Italian)
    .replace(',', '.'); // Replace decimal separator

  return parseFloat(cleaned) || 0;
}

/**
 * Validates Google Sheets credentials format
 */
export function validateGoogleSheetsCredentials(
  credentials: Partial<GoogleSheetsCredentials>
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!credentials.apiKey && !credentials.oauthToken) {
    errors.push('API Key o OAuth Token è richiesto');
  }

  if (!credentials.spreadsheetId) {
    errors.push('Spreadsheet ID è richiesto');
  } else if (credentials.spreadsheetId.length < 20) {
    errors.push('Spreadsheet ID non sembra valido');
  }

  if (!credentials.sheetName) {
    errors.push('Nome Foglio è richiesto');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
