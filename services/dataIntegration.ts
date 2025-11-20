// Data integration service for importing and managing external data sources

import type { FieldMapping, StandardDataSchema } from '../types/dataMapping.types';
import { supabase } from '../lib/supabase';

/**
 * Stores imported data in Supabase
 */
export async function storeImportedData(
  data: Record<string, any>[],
  mappings: FieldMapping[],
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Transform data to match our standard schema
    const transformedData = data.map((row) => ({
      ...row,
      user_id: userId,
      company_id: companyId,
      imported_at: new Date().toISOString(),
      source: 'manual_import',
    }));

    // Store in Supabase
    const { error } = await supabase
      .from('imported_data')
      .insert(transformedData);

    if (error) {
      console.error('Error storing imported data:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in storeImportedData:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetches imported data from Supabase
 */
export async function fetchImportedData(
  companyId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<StandardDataSchema[]> {
  try {
    let query = supabase
      .from('imported_data')
      .select('*')
      .eq('company_id', companyId);

    if (dateFrom) {
      query = query.gte('date', dateFrom.toISOString());
    }

    if (dateTo) {
      query = query.lte('date', dateTo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching imported data:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchImportedData:', error);
    return [];
  }
}

/**
 * Merges imported data with existing dashboard data
 */
export function mergeDataSources(
  existingData: any[],
  importedData: StandardDataSchema[]
): any[] {
  // Create a map for quick lookup
  const dataMap = new Map<string, any>();

  // Add existing data
  existingData.forEach((item) => {
    const key = `${item.date}_${item.store_name}_${item.channel}`;
    dataMap.set(key, item);
  });

  // Merge imported data (overwrites if key exists)
  importedData.forEach((item) => {
    const key = `${item.date}_${item.store_name}_${item.channel}`;
    const existing = dataMap.get(key);

    if (existing) {
      // Merge and sum numeric values
      dataMap.set(key, {
        ...existing,
        ad_spend: (existing.ad_spend || 0) + (item.ad_spend || 0),
        revenue: (existing.revenue || 0) + (item.revenue || 0),
        orders: (existing.orders || 0) + (item.orders || 0),
        conversions: (existing.conversions || 0) + (item.conversions || 0),
        impressions: (existing.impressions || 0) + (item.impressions || 0),
        clicks: (existing.clicks || 0) + (item.clicks || 0),
      });
    } else {
      // Add new entry
      dataMap.set(key, item);
    }
  });

  return Array.from(dataMap.values());
}

/**
 * Validates imported data against business rules
 */
export function validateBusinessRules(
  data: Record<string, any>[]
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  data.forEach((row, index) => {
    // Check for negative values
    if (row.ad_spend < 0) {
      warnings.push(`Riga ${index + 1}: Spesa pubblicitaria negativa`);
    }
    if (row.revenue < 0) {
      warnings.push(`Riga ${index + 1}: Fatturato negativo`);
    }

    // Check for unrealistic ROAS
    if (row.ad_spend > 0 && row.revenue > 0) {
      const roas = row.revenue / row.ad_spend;
      if (roas > 50) {
        warnings.push(
          `Riga ${index + 1}: ROAS molto alto (${roas.toFixed(2)}x) - verifica i dati`
        );
      }
    }

    // Check for future dates
    if (row.date && new Date(row.date) > new Date()) {
      warnings.push(`Riga ${index + 1}: Data futura rilevata`);
    }

    // Check for missing critical fields
    if (!row.store_name && !row.store_id) {
      warnings.push(`Riga ${index + 1}: Negozio mancante`);
    }
    if (!row.channel) {
      warnings.push(`Riga ${index + 1}: Canale mancante`);
    }
  });

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Creates a sample CSV template for download
 */
export function generateCSVTemplate(): string {
  const headers = [
    'data',
    'negozio',
    'canale',
    'spesa_pubblicitaria',
    'fatturato',
    'ordini',
    'conversioni',
    'impressions',
    'clicks',
    'stato',
  ];

  const sampleRows = [
    [
      '2024-01-15',
      'Milano Centro',
      'google',
      '1500.00',
      '8500.00',
      '45',
      '38',
      '125000',
      '3200',
      'attivo',
    ],
    [
      '2024-01-15',
      'Roma EUR',
      'facebook',
      '1200.00',
      '6800.00',
      '32',
      '28',
      '98000',
      '2800',
      'attivo',
    ],
    [
      '2024-01-16',
      'Milano Centro',
      'google',
      '1600.00',
      '9200.00',
      '48',
      '42',
      '132000',
      '3400',
      'attivo',
    ],
  ];

  const csv = [headers.join(','), ...sampleRows.map((row) => row.join(','))].join('\n');

  return csv;
}

/**
 * Downloads CSV template
 */
export function downloadCSVTemplate(): void {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'template_importazione_dati.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Connects to external APIs
 */
export async function connectToExternalSource(
  sourceType: 'airtable' | 'notion' | 'google_sheets',
  config: {
    apiKey?: string;
    baseId?: string;
    tableId?: string;
    sheetId?: string;
  }
): Promise<{ success: boolean; data?: Record<string, any>[]; error?: string }> {
  try {
    switch (sourceType) {
      case 'airtable':
        return await connectToAirtable(config);
      case 'notion':
        return await connectToNotion(config);
      case 'google_sheets':
        return await connectToGoogleSheets(config);
      default:
        return { success: false, error: 'Unsupported source type' };
    }
  } catch (error) {
    console.error('Error connecting to external source:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function connectToAirtable(config: {
  apiKey?: string;
  baseId?: string;
  tableId?: string;
}): Promise<{ success: boolean; data?: Record<string, any>[]; error?: string }> {
  // Placeholder for Airtable integration
  // Would use Airtable API: https://api.airtable.com/v0/{baseId}/{tableId}
  return {
    success: false,
    error: 'Airtable integration not yet implemented',
  };
}

async function connectToNotion(config: {
  apiKey?: string;
  baseId?: string;
}): Promise<{ success: boolean; data?: Record<string, any>[]; error?: string }> {
  // Placeholder for Notion integration
  // Would use Notion API: https://api.notion.com/v1/databases/{database_id}/query
  return {
    success: false,
    error: 'Notion integration not yet implemented',
  };
}

async function connectToGoogleSheets(config: {
  apiKey?: string;
  sheetId?: string;
}): Promise<{ success: boolean; data?: Record<string, any>[]; error?: string }> {
  // Placeholder for Google Sheets integration
  // Would use Google Sheets API
  return {
    success: false,
    error: 'Google Sheets integration not yet implemented',
  };
}
