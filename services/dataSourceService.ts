import { AirtableClient } from './datasources/airtableClient';
import { NotionClient } from './datasources/notionClient';
import { GoogleSheetsClient } from './datasources/googleSheetsClient';
import {
  DataSourceConfig,
  DataSourceType,
  DataImportResult,
  DataSyncStatus,
  AirtableConfig,
  NotionConfig,
  GoogleSheetsConfig,
} from '../types/datasource.types';

export class DataSourceService {
  private dataSources: Map<string, DataSourceConfig> = new Map();

  /**
   * Add or update a data source configuration
   */
  addDataSource(config: DataSourceConfig): void {
    this.dataSources.set(config.id, config);
    this.saveToLocalStorage();
  }

  /**
   * Remove a data source
   */
  removeDataSource(id: string): void {
    this.dataSources.delete(id);
    this.saveToLocalStorage();
  }

  /**
   * Get a specific data source configuration
   */
  getDataSource(id: string): DataSourceConfig | undefined {
    return this.dataSources.get(id);
  }

  /**
   * Get all data sources
   */
  getAllDataSources(): DataSourceConfig[] {
    return Array.from(this.dataSources.values());
  }

  /**
   * Get enabled data sources
   */
  getEnabledDataSources(): DataSourceConfig[] {
    return Array.from(this.dataSources.values()).filter(ds => ds.enabled);
  }

  /**
   * Test connection for a data source
   */
  async testConnection(config: DataSourceConfig): Promise<boolean> {
    try {
      const client = this.createClient(config);
      return await client.testConnection();
    } catch (error) {
      console.error(`Connection test failed for ${config.name}:`, error);
      return false;
    }
  }

  /**
   * Import data from a specific source
   */
  async importFromSource(id: string): Promise<DataImportResult> {
    const config = this.dataSources.get(id);

    if (!config) {
      return {
        success: false,
        source: 'airtable',
        recordsImported: 0,
        recordsFailed: 0,
        errors: ['Data source not found'],
        timestamp: new Date(),
      };
    }

    if (!config.enabled) {
      return {
        success: false,
        source: config.type,
        recordsImported: 0,
        recordsFailed: 0,
        errors: ['Data source is disabled'],
        timestamp: new Date(),
      };
    }

    try {
      const client = this.createClient(config);
      const result = await client.importData();

      // Update last sync time
      config.lastSync = new Date();
      this.dataSources.set(id, config);
      this.saveToLocalStorage();

      return result;
    } catch (error) {
      return {
        success: false,
        source: config.type,
        recordsImported: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Import data from all enabled sources
   */
  async importFromAllSources(): Promise<DataImportResult[]> {
    const enabledSources = this.getEnabledDataSources();
    const results: DataImportResult[] = [];

    for (const source of enabledSources) {
      const result = await this.importFromSource(source.id);
      results.push(result);
    }

    return results;
  }

  /**
   * Get sync status for all data sources
   */
  getSyncStatuses(): DataSyncStatus[] {
    return Array.from(this.dataSources.values()).map(config => {
      const nextSync = this.calculateNextSync(config);

      return {
        sourceId: config.id,
        sourceName: config.name,
        sourceType: config.type,
        lastSync: config.lastSync || null,
        nextSync,
        status: 'idle',
      };
    });
  }

  /**
   * Calculate next sync time based on interval
   */
  private calculateNextSync(config: DataSourceConfig): Date | null {
    if (!config.autoSync || !config.syncInterval || !config.lastSync) {
      return null;
    }

    const nextSyncTime = new Date(config.lastSync);
    nextSyncTime.setMinutes(nextSyncTime.getMinutes() + config.syncInterval);

    return nextSyncTime;
  }

  /**
   * Create appropriate client based on data source type
   */
  private createClient(config: DataSourceConfig): any {
    switch (config.type) {
      case 'airtable':
        return new AirtableClient({
          baseId: config.credentials.baseId || '',
          tableId: config.credentials.tableId || '',
          apiKey: config.credentials.apiKey || '',
        } as AirtableConfig);

      case 'notion':
        return new NotionClient({
          databaseId: config.credentials.databaseId || '',
          accessToken: config.credentials.accessToken || '',
        } as NotionConfig);

      case 'googlesheets':
        return new GoogleSheetsClient({
          spreadsheetId: config.credentials.spreadsheetId || '',
          sheetName: '', // Will be set in config
          accessToken: config.credentials.accessToken || '',
          refreshToken: config.credentials.refreshToken,
          clientId: '', // OAuth client ID
          clientSecret: '', // OAuth client secret
        } as GoogleSheetsConfig);

      default:
        throw new Error(`Unsupported data source type: ${config.type}`);
    }
  }

  /**
   * Save data sources to localStorage
   */
  private saveToLocalStorage(): void {
    const data = Array.from(this.dataSources.entries());
    localStorage.setItem('data-sources', JSON.stringify(data));
  }

  /**
   * Load data sources from localStorage
   */
  loadFromLocalStorage(): void {
    const stored = localStorage.getItem('data-sources');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.dataSources = new Map(data);
      } catch (error) {
        console.error('Failed to load data sources from localStorage:', error);
      }
    }
  }
}

// Export singleton instance
export const dataSourceService = new DataSourceService();
