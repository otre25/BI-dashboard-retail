// Data mapping engine with automatic schema detection

import type {
  FieldType,
  FieldMapping,
  SchemaDetectionResult,
  ImportPreview,
  ImportError,
  DataSource,
  StandardDataSchema,
} from '../types/dataMapping.types';
import { FIELD_PATTERNS } from '../types/dataMapping.types';

/**
 * Detects the field type based on field name and sample values
 */
export function detectFieldType(
  fieldName: string,
  sampleValues: any[]
): SchemaDetectionResult {
  let bestMatch: FieldType = 'unknown';
  let highestConfidence = 0;

  // Check field name against patterns
  for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(fieldName)) {
        const confidence = 0.8; // High confidence for name match
        if (confidence > highestConfidence) {
          bestMatch = fieldType as FieldType;
          highestConfidence = confidence;
        }
      }
    }
  }

  // Analyze sample values to refine detection
  if (sampleValues.length > 0) {
    const valueBasedType = detectTypeFromValues(sampleValues);
    if (valueBasedType && highestConfidence < 0.9) {
      // If we have moderate confidence from name, validate with values
      if (bestMatch === 'unknown') {
        bestMatch = valueBasedType.type;
        highestConfidence = valueBasedType.confidence * 0.6;
      } else if (bestMatch === valueBasedType.type) {
        // Name and value agree - boost confidence
        highestConfidence = Math.min(0.95, highestConfidence + 0.15);
      }
    }
  }

  return {
    fieldName,
    detectedType: bestMatch,
    confidence: highestConfidence,
    sampleValues: sampleValues.slice(0, 3),
    suggestedMapping: getSuggestedMapping(bestMatch),
  };
}

/**
 * Detects field type from actual values
 */
function detectTypeFromValues(values: any[]): { type: FieldType; confidence: number } | null {
  const nonNullValues = values.filter((v) => v != null && v !== '');
  if (nonNullValues.length === 0) return null;

  // Check if values are dates
  const dateCount = nonNullValues.filter((v) => isValidDate(v)).length;
  if (dateCount / nonNullValues.length > 0.7) {
    return { type: 'date', confidence: 0.9 };
  }

  // Check if values are numbers/amounts
  const numberCount = nonNullValues.filter((v) => !isNaN(parseFloat(v))).length;
  if (numberCount / nonNullValues.length > 0.8) {
    // Check if they look like currency amounts
    const hasCurrencySymbols = nonNullValues.some((v) =>
      String(v).match(/[$€£¥]/));
    if (hasCurrencySymbols) {
      return { type: 'amount', confidence: 0.85 };
    }
    return { type: 'number', confidence: 0.75 };
  }

  // Default to text
  return { type: 'text', confidence: 0.5 };
}

/**
 * Checks if a value can be parsed as a valid date
 */
function isValidDate(value: any): boolean {
  if (value instanceof Date) return !isNaN(value.getTime());

  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) return true;

  // Try common Italian date formats: DD/MM/YYYY, DD-MM-YYYY
  const italianDatePattern = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
  const match = String(value).match(italianDatePattern);
  if (match) {
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return !isNaN(date.getTime());
  }

  return false;
}

/**
 * Suggests a target field mapping based on detected type
 */
function getSuggestedMapping(fieldType: FieldType): string | undefined {
  const mappings: Record<FieldType, string> = {
    date: 'date',
    amount: 'ad_spend',
    store: 'store_name',
    channel: 'channel',
    status: 'status',
    number: 'orders',
    text: '',
    unknown: '',
  };
  return mappings[fieldType] || undefined;
}

/**
 * Analyzes raw data and detects schema automatically
 */
export function analyzeDataSchema(rawData: Record<string, any>[]): SchemaDetectionResult[] {
  if (rawData.length === 0) return [];

  const fields = Object.keys(rawData[0]);
  const results: SchemaDetectionResult[] = [];

  for (const field of fields) {
    // Get sample values (up to 10 rows)
    const sampleValues = rawData
      .slice(0, 10)
      .map((row) => row[field])
      .filter((v) => v != null);

    const detection = detectFieldType(field, sampleValues);
    results.push(detection);
  }

  // Sort by confidence (highest first)
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Creates field mappings from schema detection results
 */
export function createFieldMappings(
  detectionResults: SchemaDetectionResult[]
): FieldMapping[] {
  const mappings: FieldMapping[] = [];

  for (const result of detectionResults) {
    if (result.confidence > 0.5 && result.suggestedMapping) {
      mappings.push({
        sourceField: result.fieldName,
        targetField: result.suggestedMapping,
        fieldType: result.detectedType,
        confidence: result.confidence,
        transform: getTransformFunction(result.detectedType),
      });
    }
  }

  return mappings;
}

/**
 * Gets transformation function for a field type
 */
function getTransformFunction(fieldType: FieldType): ((value: any) => any) | undefined {
  const transforms: Record<FieldType, (value: any) => any> = {
    date: parseDate,
    amount: parseAmount,
    store: (v) => String(v).trim(),
    channel: (v) => String(v).trim().toLowerCase(),
    status: (v) => String(v).trim(),
    number: (v) => parseFloat(v) || 0,
    text: (v) => String(v).trim(),
    unknown: (v) => v,
  };
  return transforms[fieldType];
}

/**
 * Parses various date formats
 */
function parseDate(value: any): Date | null {
  if (value instanceof Date) return value;

  // Try standard parsing
  const standardParse = new Date(value);
  if (!isNaN(standardParse.getTime())) return standardParse;

  // Try Italian format: DD/MM/YYYY or DD-MM-YYYY
  const italianDatePattern = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
  const match = String(value).match(italianDatePattern);
  if (match) {
    const [, day, month, year] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  return null;
}

/**
 * Parses amount values, handling currency symbols and formats
 */
function parseAmount(value: any): number {
  if (typeof value === 'number') return value;

  // Remove currency symbols and whitespace
  const cleaned = String(value)
    .replace(/[$€£¥]/g, '')
    .replace(/\s/g, '')
    .replace(',', '.'); // Handle European decimal separator

  return parseFloat(cleaned) || 0;
}

/**
 * Transforms raw data using field mappings
 */
export function transformData(
  rawData: Record<string, any>[],
  mappings: FieldMapping[]
): { transformed: Record<string, any>[]; errors: ImportError[] } {
  const transformed: Record<string, any>[] = [];
  const errors: ImportError[] = [];

  rawData.forEach((row, rowIndex) => {
    const transformedRow: Record<string, any> = {};

    mappings.forEach((mapping) => {
      try {
        const sourceValue = row[mapping.sourceField];
        const transformedValue = mapping.transform
          ? mapping.transform(sourceValue)
          : sourceValue;

        transformedRow[mapping.targetField] = transformedValue;

        // Validate transformed value
        if (transformedValue === null && sourceValue != null) {
          errors.push({
            row: rowIndex,
            field: mapping.sourceField,
            error: `Failed to transform value to ${mapping.fieldType}`,
            value: sourceValue,
          });
        }
      } catch (error) {
        errors.push({
          row: rowIndex,
          field: mapping.sourceField,
          error: error instanceof Error ? error.message : 'Transformation error',
          value: row[mapping.sourceField],
        });
      }
    });

    transformed.push(transformedRow);
  });

  return { transformed, errors };
}

/**
 * Validates transformed data against standard schema
 */
export function validateData(
  data: Record<string, any>[]
): { valid: Record<string, any>[]; invalid: number[] } {
  const valid: Record<string, any>[] = [];
  const invalid: number[] = [];

  data.forEach((row, index) => {
    // Check required fields
    const hasDate = row.date && row.date instanceof Date;
    const hasStore = row.store_name || row.store_id;
    const hasChannel = row.channel;

    if (hasDate && hasStore && hasChannel) {
      valid.push(row);
    } else {
      invalid.push(index);
    }
  });

  return { valid, invalid };
}

/**
 * Creates a complete import preview with auto-detection
 */
export function createImportPreview(
  source: DataSource,
  rawData: Record<string, any>[]
): ImportPreview {
  // Detect schema
  const detectionResults = analyzeDataSchema(rawData);

  // Create mappings
  const detectedFields = createFieldMappings(detectionResults);

  // Transform data
  const { transformed, errors } = transformData(rawData, detectedFields);

  // Validate
  const { valid, invalid } = validateData(transformed);

  return {
    source,
    rawData: rawData.slice(0, 10), // Preview first 10 rows
    detectedFields,
    transformedData: valid.slice(0, 10),
    errors,
    stats: {
      totalRows: rawData.length,
      validRows: valid.length,
      invalidRows: invalid.length,
    },
  };
}

/**
 * Exports data in various formats
 */
export function exportData(
  data: Record<string, any>[],
  format: 'csv' | 'json' | 'excel'
): string | Blob {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  if (format === 'csv') {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  // Excel format would need a library like xlsx
  throw new Error('Excel export not yet implemented');
}
