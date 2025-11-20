// Airtable connector for sales data

import type {
  AirtableCredentials,
  RawSalesData,
  UnifiedSalesData,
  SalesSchemaDetection,
} from '../../types/salesConnections.types';

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

/**
 * Tests Airtable connection
 */
export async function testAirtableConnection(
  credentials: AirtableCredentials
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const url = `${AIRTABLE_API_BASE}/${credentials.baseId}/${credentials.tableId}?maxRecords=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
      },
    });

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
      message: `Connesso a Airtable - ${data.records?.length || 0} record trovati`,
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
 * Fetches all records from Airtable
 */
export async function fetchAirtableData(
  credentials: AirtableCredentials,
  sourceId: string
): Promise<RawSalesData | null> {
  try {
    const allRecords: any[] = [];
    let offset: string | undefined;

    // Airtable paginates at 100 records per page
    do {
      const params = new URLSearchParams({
        maxRecords: '100',
        ...(credentials.viewId && { view: credentials.viewId }),
        ...(offset && { offset }),
      });

      const url = `${AIRTABLE_API_BASE}/${credentials.baseId}/${credentials.tableId}?${params}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
        },
      });

      if (!response.ok) {
        console.error('Airtable fetch error:', response.statusText);
        return null;
      }

      const data = await response.json();
      allRecords.push(...(data.records || []));
      offset = data.offset;
    } while (offset);

    // Transform Airtable records to flat structure
    const flatRecords = allRecords.map((record) => ({
      id: record.id,
      createdTime: record.createdTime,
      ...record.fields,
    }));

    return {
      sourceId,
      sourceType: 'airtable',
      rawRecords: flatRecords,
      fetchedAt: new Date(),
      recordCount: flatRecords.length,
    };
  } catch (error) {
    console.error('Error fetching Airtable data:', error);
    return null;
  }
}

/**
 * Auto-detects schema from Airtable data
 */
export function detectAirtableSchema(
  rawData: Record<string, any>[]
): SalesSchemaDetection {
  if (rawData.length === 0) {
    return {
      sourceType: 'airtable',
      detectedFields: [],
      requiredFieldsCovered: false,
      suggestedMappings: [],
      warnings: ['Nessun dato disponibile per rilevamento schema'],
    };
  }

  const fields = Object.keys(rawData[0]);
  const detectedFields = fields.map((fieldName) => {
    const sampleValues = rawData.slice(0, 5).map((r) => r[fieldName]);
    const dataType = inferDataType(sampleValues);

    return {
      fieldName,
      mappedTo: null,
      confidence: 0,
      sampleValues,
      dataType,
    };
  });

  return {
    sourceType: 'airtable',
    detectedFields,
    requiredFieldsCovered: false,
    suggestedMappings: [],
    warnings: [],
  };
}

function inferDataType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
  const nonNull = values.filter((v) => v != null);
  if (nonNull.length === 0) return 'string';

  if (nonNull.every((v) => typeof v === 'boolean')) return 'boolean';
  if (nonNull.every((v) => typeof v === 'number' || !isNaN(parseFloat(v)))) return 'number';
  if (nonNull.every((v) => !isNaN(Date.parse(v)))) return 'date';
  return 'string';
}

/**
 * Transforms Airtable data to unified format
 */
export function transformAirtableToUnified(
  rawData: Record<string, any>[],
  fieldMappings: Record<string, string>,
  companyId: string,
  sourceId: string
): UnifiedSalesData[] {
  return rawData.map((record) => {
    const mapped: any = {
      id: `airtable_${sourceId}_${record.id}`,
      companyId,
      sourceType: 'airtable',
      sourceId,
      rawData: record,
      syncedAt: new Date(),
    };

    // Apply field mappings
    for (const [sourceField, targetField] of Object.entries(fieldMappings)) {
      let value = record[sourceField];

      // Transform based on target field
      if (targetField === 'date' && value) {
        value = new Date(value);
      } else if (
        ['revenue', 'cost', 'profit', 'discount', 'tax', 'quantity'].includes(targetField)
      ) {
        value = parseFloat(value) || 0;
      }

      mapped[targetField] = value;
    }

    // Set defaults for required fields
    mapped.paymentStatus = mapped.paymentStatus || 'completed';
    mapped.quantity = mapped.quantity || 1;
    mapped.channel = mapped.channel || 'airtable';

    return mapped as UnifiedSalesData;
  });
}

/**
 * Validates Airtable credentials format
 */
export function validateAirtableCredentials(credentials: Partial<AirtableCredentials>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!credentials.apiKey) {
    errors.push('API Key è richiesto');
  } else if (!credentials.apiKey.startsWith('pat') && !credentials.apiKey.startsWith('key')) {
    errors.push('API Key non sembra valido (deve iniziare con "pat" o "key")');
  }

  if (!credentials.baseId) {
    errors.push('Base ID è richiesto');
  } else if (!credentials.baseId.startsWith('app')) {
    errors.push('Base ID non valido (deve iniziare con "app")');
  }

  if (!credentials.tableId) {
    errors.push('Table ID/Name è richiesto');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
