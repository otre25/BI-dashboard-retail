import {
  GoogleSheetsConfig,
  GoogleSheetsResponse,
  DataImportResult
} from '../../types/datasource.types';

export class GoogleSheetsClient {
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
  }

  /**
   * Fetch data from Google Sheet
   */
  async fetchSheetData(range?: string): Promise<GoogleSheetsResponse> {
    const sheetRange = range || this.config.range || this.config.sheetName;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${sheetRange}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If token expired, try to refresh
      if (response.status === 401 && this.config.refreshToken) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          this.config.accessToken = newToken;
          return this.fetchSheetData(range);
        }
      }
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Refresh OAuth2 access token
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (!this.config.refreshToken || !this.config.clientId || !this.config.clientSecret) {
      return null;
    }

    const url = 'https://oauth2.googleapis.com/token';
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
      grant_type: 'refresh_token',
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Get spreadsheet metadata
   */
  async getSpreadsheetMetadata(): Promise<any> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Test connection to Google Sheets
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getSpreadsheetMetadata();
      return true;
    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
      return false;
    }
  }

  /**
   * Import data and normalize it
   */
  async importData(): Promise<DataImportResult> {
    try {
      const response = await this.fetchSheetData();

      // First row is typically headers
      const headers = response.values[0] || [];
      const dataRows = response.values.slice(1);

      return {
        success: true,
        source: 'googlesheets',
        recordsImported: dataRows.length,
        recordsFailed: 0,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        source: 'googlesheets',
        recordsImported: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Convert sheet data to objects using first row as headers
   */
  static parseSheetData(response: GoogleSheetsResponse): Record<string, any>[] {
    if (!response.values || response.values.length === 0) {
      return [];
    }

    const headers = response.values[0];
    const dataRows = response.values.slice(1);

    return dataRows.map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || null;
      });
      return obj;
    });
  }
}
