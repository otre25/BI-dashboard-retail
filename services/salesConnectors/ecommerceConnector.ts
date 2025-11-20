// E-commerce connector (Shopify, WooCommerce)

import type {
  EcommerceCredentials,
  RawSalesData,
  UnifiedSalesData,
} from '../../types/salesConnections.types';

/**
 * Tests Shopify connection
 */
export async function testShopifyConnection(
  credentials: EcommerceCredentials
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const url = `https://${credentials.storeUrl}/admin/api/2024-01/shop.json`;

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': credentials.accessToken!,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: 'Connessione fallita',
        error: error.errors || 'Unknown error',
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: `Connesso a Shopify - ${data.shop?.name}`,
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
 * Fetches orders from Shopify
 */
export async function fetchShopifyOrders(
  credentials: EcommerceCredentials,
  sourceId: string,
  daysBack: number = 30
): Promise<RawSalesData | null> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const url = `https://${credentials.storeUrl}/admin/api/2024-01/orders.json?status=any&created_at_min=${since.toISOString()}&limit=250`;

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': credentials.accessToken!,
      },
    });

    if (!response.ok) {
      console.error('Shopify fetch error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const orders = data.orders || [];

    // Flatten line items into individual sales records
    const flatRecords = orders.flatMap((order: any) => {
      return (order.line_items || []).map((item: any) => ({
        order_id: order.id.toString(),
        order_number: order.name,
        created_at: order.created_at,
        customer_id: order.customer?.id?.toString(),
        customer_name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
        customer_email: order.customer?.email,
        product_id: item.product_id?.toString(),
        product_name: item.name,
        variant_name: item.variant_title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: parseFloat(item.price) * item.quantity,
        discount: order.total_discounts ? parseFloat(order.total_discounts) : 0,
        tax: order.total_tax ? parseFloat(order.total_tax) : 0,
        shipping: order.total_shipping_price_set?.shop_money?.amount || 0,
        payment_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        currency: order.currency,
        source: order.source_name,
        tags: order.tags,
        notes: order.note,
      }));
    });

    return {
      sourceId,
      sourceType: 'shopify',
      rawRecords: flatRecords,
      fetchedAt: new Date(),
      recordCount: flatRecords.length,
    };
  } catch (error) {
    console.error('Error fetching Shopify data:', error);
    return null;
  }
}

/**
 * Tests WooCommerce connection
 */
export async function testWooCommerceConnection(
  credentials: EcommerceCredentials
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const auth = btoa(`${credentials.apiKey}:${credentials.apiSecret}`);
    const url = `${credentials.storeUrl}/wp-json/wc/v3/system_status`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Connessione fallita',
        error: 'Verifica URL e credenziali',
      };
    }

    return {
      success: true,
      message: 'Connesso a WooCommerce',
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
 * Fetches orders from WooCommerce
 */
export async function fetchWooCommerceOrders(
  credentials: EcommerceCredentials,
  sourceId: string,
  daysBack: number = 30
): Promise<RawSalesData | null> {
  try {
    const auth = btoa(`${credentials.apiKey}:${credentials.apiSecret}`);
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const url = `${credentials.storeUrl}/wp-json/wc/v3/orders?after=${since.toISOString()}&per_page=100`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      console.error('WooCommerce fetch error:', response.statusText);
      return null;
    }

    const orders = await response.json();

    // Flatten line items
    const flatRecords = orders.flatMap((order: any) => {
      return (order.line_items || []).map((item: any) => ({
        order_id: order.id.toString(),
        order_number: order.number,
        created_at: order.date_created,
        customer_id: order.customer_id?.toString(),
        customer_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
        customer_email: order.billing?.email,
        product_id: item.product_id?.toString(),
        product_name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: parseFloat(item.total),
        discount: order.discount_total ? parseFloat(order.discount_total) : 0,
        tax: order.total_tax ? parseFloat(order.total_tax) : 0,
        shipping: order.shipping_total ? parseFloat(order.shipping_total) : 0,
        payment_method: order.payment_method_title,
        payment_status: order.status,
        currency: order.currency,
        notes: order.customer_note,
      }));
    });

    return {
      sourceId,
      sourceType: 'woocommerce',
      rawRecords: flatRecords,
      fetchedAt: new Date(),
      recordCount: flatRecords.length,
    };
  } catch (error) {
    console.error('Error fetching WooCommerce data:', error);
    return null;
  }
}

/**
 * Transforms e-commerce data to unified format
 */
export function transformEcommerceToUnified(
  rawData: Record<string, any>[],
  companyId: string,
  sourceId: string,
  sourceType: 'shopify' | 'woocommerce'
): UnifiedSalesData[] {
  return rawData.map((record, index) => ({
    id: `${sourceType}_${sourceId}_${record.order_id}_${index}`,
    companyId,
    sourceType,
    sourceId,

    date: new Date(record.created_at),
    orderId: record.order_number || record.order_id,
    storeName: 'E-commerce', // Could be enhanced with multi-store support

    customerId: record.customer_id,
    customerName: record.customer_name,
    customerEmail: record.customer_email,

    productId: record.product_id,
    productName: record.product_name,
    quantity: record.quantity || 1,

    revenue: record.total || record.price * record.quantity,
    discount: record.discount || 0,
    tax: record.tax || 0,
    shippingCost: record.shipping || 0,

    paymentMethod: record.payment_method,
    paymentStatus: normalizeEcommerceStatus(record.payment_status || record.fulfillment_status),
    channel: 'online',

    notes: record.notes,
    tags: Array.isArray(record.tags) ? record.tags : record.tags?.split(','),

    rawData: record,
    syncedAt: new Date(),
  }));
}

/**
 * Normalizes e-commerce payment status
 */
function normalizeEcommerceStatus(
  status: string
): 'completed' | 'pending' | 'failed' | 'refunded' {
  const normalized = status.toLowerCase();

  if (
    normalized.includes('paid') ||
    normalized.includes('complete') ||
    normalized.includes('fulfilled')
  ) {
    return 'completed';
  }
  if (normalized.includes('pending') || normalized.includes('processing')) {
    return 'pending';
  }
  if (normalized.includes('failed') || normalized.includes('cancel')) {
    return 'failed';
  }
  if (normalized.includes('refund')) {
    return 'refunded';
  }

  return 'completed';
}

/**
 * Validates e-commerce credentials
 */
export function validateEcommerceCredentials(
  credentials: Partial<EcommerceCredentials>,
  type: 'shopify' | 'woocommerce'
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!credentials.storeUrl) {
    errors.push('URL Store è richiesto');
  } else if (type === 'shopify' && !credentials.storeUrl.includes('.myshopify.com')) {
    errors.push('URL Shopify deve contenere ".myshopify.com"');
  }

  if (type === 'shopify') {
    if (!credentials.accessToken) {
      errors.push('Access Token è richiesto per Shopify');
    }
  } else {
    if (!credentials.apiKey) {
      errors.push('Consumer Key è richiesto per WooCommerce');
    }
    if (!credentials.apiSecret) {
      errors.push('Consumer Secret è richiesto per WooCommerce');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
