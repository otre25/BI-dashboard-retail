import {
  AirtableConfig,
  AirtableResponse,
  DataImportResult
} from '../../types/datasource.types';

export class AirtableClient {
  private config: AirtableConfig;

  constructor(config: AirtableConfig) {
    this.config = config;
  }

  /**
   * Fetch records from Airtable base/table
   */
  async fetchRecords(maxRecords: number = 100): Promise<AirtableResponse> {
    const url = new URL(
      `https://api.airtable.com/v0/${this.config.baseId}/${this.config.tableId}`
    );

    const params: Record<string, string> = {
      maxRecords: maxRecords.toString(),
    };

    if (this.config.view) {
      params.view = this.config.view;
    }

    Object.keys(params).forEach(key =>
      url.searchParams.append(key, params[key])
    );

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch all records with pagination
   */
  async fetchAllRecords(): Promise<AirtableResponse> {
    let allRecords: any[] = [];
    let offset: string | undefined;

    do {
      const url = new URL(
        `https://api.airtable.com/v0/${this.config.baseId}/${this.config.tableId}`
      );

      if (offset) {
        url.searchParams.append('offset', offset);
      }

      if (this.config.view) {
        url.searchParams.append('view', this.config.view);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.statusText}`);
      }

      const data: AirtableResponse = await response.json();
      allRecords = [...allRecords, ...data.records];
      offset = data.offset;

    } while (offset);

    return {
      records: allRecords,
    };
  }

  /**
   * Test connection to Airtable
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.fetchRecords(1);
      return true;
    } catch (error) {
      console.error('Airtable connection test failed:', error);
      return false;
    }
  }

  /**
   * Import data and normalize it
   */
  async importData(): Promise<DataImportResult> {
    try {
      const response = await this.fetchAllRecords();

      return {
        success: true,
        source: 'airtable',
        recordsImported: response.records.length,
        recordsFailed: 0,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        source: 'airtable',
        recordsImported: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date(),
      };
    }
  }
}
