import {
  NotionConfig,
  NotionDatabaseResponse,
  DataImportResult
} from '../../types/datasource.types';

export class NotionClient {
  private config: NotionConfig;
  private readonly apiVersion = '2022-06-28';

  constructor(config: NotionConfig) {
    this.config = config;
  }

  /**
   * Query Notion database
   */
  async queryDatabase(
    pageSize: number = 100,
    startCursor?: string
  ): Promise<NotionDatabaseResponse> {
    const url = `https://api.notion.com/v1/databases/${this.config.databaseId}/query`;

    const body: any = {
      page_size: pageSize,
    };

    if (startCursor) {
      body.start_cursor = startCursor;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Notion-Version': this.apiVersion,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch all database entries with pagination
   */
  async fetchAllEntries(): Promise<NotionDatabaseResponse> {
    let allResults: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const response = await this.queryDatabase(100, startCursor);
      allResults = [...allResults, ...response.results];
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return {
      results: allResults,
      has_more: false,
    };
  }

  /**
   * Test connection to Notion
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.queryDatabase(1);
      return true;
    } catch (error) {
      console.error('Notion connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database metadata
   */
  async getDatabaseMetadata(): Promise<any> {
    const url = `https://api.notion.com/v1/databases/${this.config.databaseId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Notion-Version': this.apiVersion,
      },
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Import data and normalize it
   */
  async importData(): Promise<DataImportResult> {
    try {
      const response = await this.fetchAllEntries();

      return {
        success: true,
        source: 'notion',
        recordsImported: response.results.length,
        recordsFailed: 0,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        source: 'notion',
        recordsImported: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Parse Notion property value based on type
   */
  static parseProperty(property: any): any {
    if (!property) return null;

    switch (property.type) {
      case 'title':
        return property.title.map((t: any) => t.plain_text).join('');
      case 'rich_text':
        return property.rich_text.map((t: any) => t.plain_text).join('');
      case 'number':
        return property.number;
      case 'select':
        return property.select?.name || null;
      case 'multi_select':
        return property.multi_select.map((s: any) => s.name);
      case 'date':
        return property.date?.start || null;
      case 'checkbox':
        return property.checkbox;
      case 'url':
        return property.url;
      case 'email':
        return property.email;
      case 'phone_number':
        return property.phone_number;
      default:
        return null;
    }
  }
}
