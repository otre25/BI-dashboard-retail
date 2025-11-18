import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { CanaleEnum } from '../types';

export function useUrlState() {
  const {
    dateRange,
    selectedStoreIds,
    selectedChannel,
    chartOrder,
    expandedCharts,
    setDateRange,
    setSelectedStoreIds,
    setSelectedChannel,
    setChartOrder,
    toggleChartExpanded,
  } = useDashboardStore();

  // Load state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Parse date range
    const fromParam = params.get('from');
    const toParam = params.get('to');
    if (fromParam && toParam) {
      try {
        const from = new Date(fromParam);
        const to = new Date(toParam);
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
          setDateRange(from, to);
        }
      } catch (e) {
        console.error('Error parsing date from URL', e);
      }
    }

    // Parse selected stores
    const storesParam = params.get('stores');
    if (storesParam) {
      if (storesParam === 'all') {
        setSelectedStoreIds('all');
      } else {
        try {
          const storeIds = JSON.parse(storesParam);
          if (Array.isArray(storeIds)) {
            setSelectedStoreIds(storeIds);
          }
        } catch (e) {
          console.error('Error parsing stores from URL', e);
        }
      }
    }

    // Parse selected channel
    const channelParam = params.get('channel');
    if (channelParam) {
      if (channelParam === 'all' || Object.values(CanaleEnum).includes(channelParam as CanaleEnum)) {
        setSelectedChannel(channelParam as 'all' | CanaleEnum);
      }
    }

    // Parse chart order
    const chartOrderParam = params.get('chartOrder');
    if (chartOrderParam) {
      try {
        const order = JSON.parse(chartOrderParam);
        if (Array.isArray(order)) {
          setChartOrder(order);
        }
      } catch (e) {
        console.error('Error parsing chart order from URL', e);
      }
    }

    // Parse expanded charts
    const expandedParam = params.get('expanded');
    if (expandedParam) {
      try {
        const expanded = JSON.parse(expandedParam);
        if (Array.isArray(expanded)) {
          // Clear existing and set new expanded charts
          const currentExpanded = Array.from(expandedCharts);
          currentExpanded.forEach(id => toggleChartExpanded(id));
          expanded.forEach((id: string) => {
            if (!expandedCharts.has(id)) {
              toggleChartExpanded(id);
            }
          });
        }
      } catch (e) {
        console.error('Error parsing expanded charts from URL', e);
      }
    }
  }, []); // Only run on mount

  // Generate shareable URL
  const generateShareUrl = (): string => {
    const params = new URLSearchParams();

    // Add date range
    params.set('from', dateRange.from.toISOString());
    params.set('to', dateRange.to.toISOString());

    // Add selected stores
    if (selectedStoreIds === 'all') {
      params.set('stores', 'all');
    } else {
      params.set('stores', JSON.stringify(selectedStoreIds));
    }

    // Add selected channel
    params.set('channel', selectedChannel);

    // Add chart order
    params.set('chartOrder', JSON.stringify(chartOrder));

    // Add expanded charts
    if (expandedCharts.size > 0) {
      params.set('expanded', JSON.stringify(Array.from(expandedCharts)));
    }

    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?${params.toString()}`;
  };

  return { generateShareUrl };
}
