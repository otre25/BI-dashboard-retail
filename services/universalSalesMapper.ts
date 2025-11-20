// Universal sales data mapper with intelligent field recognition

import type {
  RawSalesData,
  UnifiedSalesData,
  SalesFieldMapping,
  SalesSchemaDetection,
  SalesDataValidation,
  SalesSourceType,
} from '../types/salesConnections.types';
import { SALES_FIELD_PATTERNS } from '../types/salesConnections.types';

/**
 * Intelligently detects schema from any sales data source
 */
export function detectSalesSchema(rawData: RawSalesData): SalesSchemaDetection {
  if (rawData.rawRecords.length === 0) {
    return {
      sourceType: rawData.sourceType,
      detectedFields: [],
      requiredFieldsCovered: false,
      suggestedMappings: [],
      warnings: ['Nessun dato disponibile'],
    };
  }

  const sample = rawData.rawRecords[0];
  const fields = Object.keys(sample);
  const detectedFields: SalesSchemaDetection['detectedFields'] = [];
  const suggestedMappings: SalesFieldMapping[] = [];

  // Analyze each field
  for (const fieldName of fields) {
    const sampleValues = rawData.rawRecords.slice(0, 10).map((r) => r[fieldName]);
    const dataType = inferDataType(sampleValues);

    // Try to match field to standard schema
    const match = matchFieldToSchema(fieldName, sampleValues, dataType);

    detectedFields.push({
      fieldName,
      mappedTo: match.mappedTo,
      confidence: match.confidence,
      sampleValues: sampleValues.slice(0, 3),
      dataType,
    });

    if (match.confidence > 0.5 && match.mappedTo) {
      suggestedMappings.push({
        sourceField: fieldName,
        targetField: match.mappedTo as any,
        transform: getTransformFunction(match.mappedTo as any, dataType),
        required: isRequiredField(match.mappedTo as any),
        confidence: match.confidence,
      });
    }
  }

  // Sort by confidence
  suggestedMappings.sort((a, b) => b.confidence - a.confidence);

  // Check if required fields are covered
  const mappedFields = new Set(suggestedMappings.map((m) => m.targetField));
  const requiredFields: (keyof UnifiedSalesData)[] = ['date', 'revenue', 'storeName'];
  const requiredFieldsCovered = requiredFields.every((f) => mappedFields.has(f));

  // Generate warnings
  const warnings: string[] = [];
  if (!mappedFields.has('date')) {
    warnings.push('Campo "data" non rilevato - richiesto');
  }
  if (!mappedFields.has('revenue')) {
    warnings.push('Campo "fatturato/importo" non rilevato - richiesto');
  }
  if (!mappedFields.has('storeName')) {
    warnings.push('Campo "negozio" non rilevato - richiesto');
  }

  return {
    sourceType: rawData.sourceType,
    detectedFields,
    requiredFieldsCovered,
    suggestedMappings,
    warnings,
  };
}

/**
 * Matches a field name to standard schema
 */
function matchFieldToSchema(
  fieldName: string,
  sampleValues: any[],
  dataType: string
): { mappedTo: keyof UnifiedSalesData | null; confidence: number } {
  let bestMatch: keyof UnifiedSalesData | null = null;
  let highestConfidence = 0;

  // Try pattern matching
  for (const [targetField, patterns] of Object.entries(SALES_FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(fieldName)) {
        const confidence = 0.9; // High confidence for name match
        if (confidence > highestConfidence) {
          bestMatch = targetField as keyof UnifiedSalesData;
          highestConfidence = confidence;
        }
      }
    }
  }

  // Boost confidence based on data type match
  if (bestMatch) {
    const expectedType = getExpectedDataType(bestMatch);
    if (expectedType === dataType) {
      highestConfidence = Math.min(0.95, highestConfidence + 0.05);
    }
  }

  // Try value-based detection if no name match
  if (!bestMatch || highestConfidence < 0.7) {
    const valueMatch = matchByValues(sampleValues, dataType);
    if (valueMatch && valueMatch.confidence > highestConfidence) {
      bestMatch = valueMatch.field;
      highestConfidence = valueMatch.confidence;
    }
  }

  return { mappedTo: bestMatch, confidence: highestConfidence };
}

/**
 * Attempts to match field by analyzing values
 */
function matchByValues(
  values: any[],
  dataType: string
): { field: keyof UnifiedSalesData; confidence: number } | null {
  const nonNull = values.filter((v) => v != null && v !== '');
  if (nonNull.length === 0) return null;

  // Check if values are dates
  if (dataType === 'date') {
    return { field: 'date', confidence: 0.8 };
  }

  // Check if values are currency amounts (numbers with 2 decimals, > 0)
  if (dataType === 'number') {
    const numbers = nonNull.map((v) => parseFloat(v)).filter((n) => !isNaN(n));
    const avgValue = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;

    // Typical order values: 10-10000 EUR
    if (avgValue >= 10 && avgValue <= 50000) {
      return { field: 'revenue', confidence: 0.7 };
    }

    // Small quantities: 1-100
    if (avgValue >= 1 && avgValue <= 100 && numbers.every((n) => Number.isInteger(n))) {
      return { field: 'quantity', confidence: 0.7 };
    }
  }

  return null;
}

/**
 * Infers data type from sample values
 */
function inferDataType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
  const nonNull = values.filter((v) => v != null && v !== '');
  if (nonNull.length === 0) return 'string';

  if (nonNull.every((v) => typeof v === 'boolean')) return 'boolean';

  const dateCount = nonNull.filter((v) => !isNaN(Date.parse(v))).length;
  if (dateCount / nonNull.length > 0.7) return 'date';

  const numberCount = nonNull.filter((v) => !isNaN(parseFloat(v))).length;
  if (numberCount / nonNull.length > 0.8) return 'number';

  return 'string';
}

/**
 * Gets expected data type for a field
 */
function getExpectedDataType(field: keyof UnifiedSalesData): string {
  const numberFields = ['revenue', 'cost', 'profit', 'discount', 'tax', 'shippingCost', 'quantity'];
  const dateFields = ['date', 'syncedAt'];
  const booleanFields: string[] = [];

  if (numberFields.includes(field)) return 'number';
  if (dateFields.includes(field)) return 'date';
  if (booleanFields.includes(field)) return 'boolean';
  return 'string';
}

/**
 * Gets transformation function for a field
 */
function getTransformFunction(
  targetField: keyof UnifiedSalesData,
  dataType: string
): ((value: any) => any) | undefined {
  if (targetField === 'date') {
    return (v) => (v ? new Date(v) : new Date());
  }

  if (['revenue', 'cost', 'profit', 'discount', 'tax', 'shippingCost', 'quantity'].includes(targetField)) {
    return (v) => {
      if (typeof v === 'number') return v;
      const cleaned = String(v).replace(/[€$£¥\s]/g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    };
  }

  if (targetField === 'paymentStatus') {
    return (v) => {
      const normalized = String(v).toLowerCase();
      if (normalized.includes('compl') || normalized.includes('paid')) return 'completed';
      if (normalized.includes('pend')) return 'pending';
      if (normalized.includes('fail')) return 'failed';
      if (normalized.includes('refund')) return 'refunded';
      return 'completed';
    };
  }

  return undefined;
}

/**
 * Checks if a field is required
 */
function isRequiredField(field: keyof UnifiedSalesData): boolean {
  const required: (keyof UnifiedSalesData)[] = ['date', 'revenue', 'storeName'];
  return required.includes(field);
}

/**
 * Transforms raw sales data to unified format using mappings
 */
export function transformToUnifiedFormat(
  rawData: RawSalesData,
  mappings: SalesFieldMapping[],
  companyId: string
): UnifiedSalesData[] {
  return rawData.rawRecords.map((record, index) => {
    const unified: any = {
      id: `${rawData.sourceType}_${rawData.sourceId}_${index}_${Date.now()}`,
      companyId,
      sourceType: rawData.sourceType,
      sourceId: rawData.sourceId,
      rawData: record,
      syncedAt: new Date(),
    };

    // Apply mappings
    for (const mapping of mappings) {
      const sourceValue = record[mapping.sourceField];
      const transformedValue = mapping.transform
        ? mapping.transform(sourceValue)
        : sourceValue;

      unified[mapping.targetField] = transformedValue;
    }

    // Set intelligent defaults
    unified.orderId = unified.orderId || `AUTO_${index}`;
    unified.quantity = unified.quantity || 1;
    unified.paymentStatus = unified.paymentStatus || 'completed';
    unified.channel = unified.channel || rawData.sourceType;

    // Calculate derived fields
    if (unified.revenue && unified.discount) {
      unified.revenue = unified.revenue - unified.discount;
    }

    if (unified.revenue && unified.cost) {
      unified.profit = unified.revenue - unified.cost;
    }

    return unified as UnifiedSalesData;
  });
}

/**
 * Validates sales data
 */
export function validateSalesData(data: UnifiedSalesData[]): SalesDataValidation {
  const errors: SalesDataValidation['errors'] = [];
  const warnings: SalesDataValidation['warnings'] = [];

  data.forEach((record, index) => {
    // Check required fields
    if (!record.date || isNaN(record.date.getTime())) {
      errors.push({
        row: index,
        field: 'date',
        error: 'Data mancante o non valida',
        value: record.date,
      });
    }

    if (!record.revenue || record.revenue <= 0) {
      errors.push({
        row: index,
        field: 'revenue',
        error: 'Fatturato mancante o non valido',
        value: record.revenue,
      });
    }

    if (!record.storeName) {
      errors.push({
        row: index,
        field: 'storeName',
        error: 'Nome negozio mancante',
        value: record.storeName,
      });
    }

    // Warnings for suspicious values
    if (record.revenue > 100000) {
      warnings.push({
        row: index,
        field: 'revenue',
        warning: 'Fatturato molto alto - verifica dato',
        value: record.revenue,
      });
    }

    if (record.quantity && record.quantity > 1000) {
      warnings.push({
        row: index,
        field: 'quantity',
        warning: 'Quantità molto alta - verifica dato',
        value: record.quantity,
      });
    }

    if (record.date > new Date()) {
      warnings.push({
        row: index,
        field: 'date',
        warning: 'Data futura rilevata',
        value: record.date,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generates field mapping suggestions with explanations
 */
export function generateMappingSuggestions(
  detection: SalesSchemaDetection
): { mapping: SalesFieldMapping; explanation: string }[] {
  return detection.suggestedMappings.map((mapping) => {
    let explanation = '';

    if (mapping.confidence > 0.9) {
      explanation = `Rilevamento automatico con alta confidenza (${Math.round(mapping.confidence * 100)}%)`;
    } else if (mapping.confidence > 0.7) {
      explanation = `Probabile corrispondenza (${Math.round(mapping.confidence * 100)}%)`;
    } else {
      explanation = `Corrispondenza suggerita (${Math.round(mapping.confidence * 100)}%) - verifica manualmente`;
    }

    return { mapping, explanation };
  });
}
