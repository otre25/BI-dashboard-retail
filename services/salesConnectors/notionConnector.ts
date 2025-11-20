// Notion connector for sales data

import type {
  NotionCredentials,
  RawSalesData,
  UnifiedSalesData,
} from '../../types/salesConnections.types';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

/**
 * Tests Notion connection
 */
export async function testNotionConnection(
  credentials: NotionCredentials
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const url = `${NOTION_API_BASE}/databases/${credentials.databaseId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        'Notion-Version': NOTION_VERSION,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: 'Connessione fallita',
        error: error.message || 'Unknown error',
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: `Connesso a Notion - Database "${data.title?.[0]?.plain_text || 'Untitled'}"`,
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
 * Fetches all pages from Notion database
 */
export async function fetchNotionData(
  credentials: NotionCredentials,
  sourceId: string
): Promise<RawSalesData | null> {
  try {
    const allRecords: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const url = `${NOTION_API_BASE}/databases/${credentials.databaseId}/query`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: 100,
          ...(startCursor && { start_cursor: startCursor }),
        }),
      });

      if (!response.ok) {
        console.error('Notion fetch error:', response.statusText);
        return null;
      }

      const data = await response.json();
      allRecords.push(...(data.results || []));
      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    // Transform Notion pages to flat records
    const flatRecords = allRecords.map((page) => flattenNotionPage(page));

    return {
      sourceId,
      sourceType: 'notion',
      rawRecords: flatRecords,
      fetchedAt: new Date(),
      recordCount: flatRecords.length,
    };
  } catch (error) {
    console.error('Error fetching Notion data:', error);
    return null;
  }
}

/**
 * Flattens Notion page properties to simple key-value pairs
 */
function flattenNotionPage(page: any): Record<string, any> {
  const flattened: Record<string, any> = {
    id: page.id,
    created_time: page.created_time,
    last_edited_time: page.last_edited_time,
  };

  // Extract property values
  for (const [key, prop] of Object.entries(page.properties || {})) {
    flattened[key] = extractNotionPropertyValue(prop);
  }

  return flattened;
}

/**
 * Extracts value from Notion property based on type
 */
function extractNotionPropertyValue(prop: any): any {
  if (!prop) return null;

  switch (prop.type) {
    case 'title':
      return prop.title?.[0]?.plain_text || '';
    case 'rich_text':
      return prop.rich_text?.[0]?.plain_text || '';
    case 'number':
      return prop.number;
    case 'select':
      return prop.select?.name || null;
    case 'multi_select':
      return prop.multi_select?.map((s: any) => s.name).join(', ') || '';
    case 'date':
      return prop.date?.start || null;
    case 'checkbox':
      return prop.checkbox;
    case 'url':
      return prop.url;
    case 'email':
      return prop.email;
    case 'phone_number':
      return prop.phone_number;
    case 'status':
      return prop.status?.name || null;
    case 'people':
      return prop.people?.map((p: any) => p.name).join(', ') || '';
    case 'files':
      return prop.files?.[0]?.name || null;
    case 'formula':
      return extractNotionPropertyValue({ type: prop.formula?.type, ...prop.formula });
    case 'relation':
      return prop.relation?.length || 0;
    case 'rollup':
      return extractNotionPropertyValue({ type: prop.rollup?.type, ...prop.rollup });
    default:
      return null;
  }
}

/**
 * Transforms Notion data to unified format
 */
export function transformNotionToUnified(
  rawData: Record<string, any>[],
  fieldMappings: Record<string, string>,
  companyId: string,
  sourceId: string
): UnifiedSalesData[] {
  return rawData.map((record) => {
    const mapped: any = {
      id: `notion_${sourceId}_${record.id}`,
      companyId,
      sourceType: 'notion',
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
      } else if (targetField === 'paymentStatus' && value) {
        // Normalize status values
        value = normalizePaymentStatus(value);
      }

      mapped[targetField] = value;
    }

    // Set defaults
    mapped.paymentStatus = mapped.paymentStatus || 'completed';
    mapped.quantity = mapped.quantity || 1;
    mapped.channel = mapped.channel || 'notion';

    return mapped as UnifiedSalesData;
  });
}

/**
 * Normalizes payment status values
 */
function normalizePaymentStatus(
  value: string
): 'completed' | 'pending' | 'failed' | 'refunded' {
  const normalized = value.toLowerCase().trim();

  if (normalized.includes('comple') || normalized.includes('success') || normalized === 'paid') {
    return 'completed';
  }
  if (normalized.includes('pend') || normalized.includes('attesa')) {
    return 'pending';
  }
  if (
    normalized.includes('fail') ||
    normalized.includes('error') ||
    normalized.includes('fallito')
  ) {
    return 'failed';
  }
  if (normalized.includes('refund') || normalized.includes('rimbors')) {
    return 'refunded';
  }

  return 'completed'; // Default
}

/**
 * Validates Notion credentials format
 */
export function validateNotionCredentials(credentials: Partial<NotionCredentials>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!credentials.apiKey) {
    errors.push('API Key è richiesto');
  } else if (!credentials.apiKey.startsWith('secret_')) {
    errors.push('API Key non valido (deve iniziare con "secret_")');
  }

  if (!credentials.databaseId) {
    errors.push('Database ID è richiesto');
  } else if (credentials.databaseId.length !== 32) {
    errors.push('Database ID non valido (deve essere 32 caratteri)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
