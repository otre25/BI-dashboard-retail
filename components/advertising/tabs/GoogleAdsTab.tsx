import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { DataTable, type ColumnDef } from '../../ui/DataTable';
import { type GoogleData, type GoogleCampaign, type GoogleKeyword } from '../../../hooks/useAdvertisingData';

interface GoogleAdsTabProps {
  data: GoogleData;
  isLoading: boolean;
}

const campaignColumns: ColumnDef<GoogleCampaign>[] = [
    { accessorKey: 'name', header: 'Campagna', cell: info => <span className="font-medium">{info.getValue<string>()}</span> },
    { accessorKey: 'type', header: 'Tipo' },
    { accessorKey: 'status', header: 'Stato', cell: info => <div className={`px-2 py-0.5 rounded-full text-xs inline-block ${info.getValue<string>() === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>{info.getValue<string>()}</div> },
    { accessorKey: 'spend', header: 'Spesa', cell: info => `€${info.getValue<number>().toLocaleString()}` },
    { accessorKey: 'quality_score', header: 'Quality Score', cell: info => info.getValue<number>() ? `${info.getValue<number>()}/10` : 'N/A' },
    { accessorKey: 'impression_share', header: 'Imp. Share', cell: info => info.getValue<number>() ? `${info.getValue<number>().toFixed(1)}%` : 'N/A' },
    { accessorKey: 'conversions', header: 'Conversioni', cell: info => info.getValue<number>().toLocaleString() },
    { accessorKey: 'cost_per_conversion', header: 'Costo/Conv.', cell: info => `€${info.getValue<number>().toFixed(2)}` },
    { accessorKey: 'roas', header: 'ROAS', cell: info => `${info.getValue<number>().toFixed(2)}x` },
];

const keywordColumns: ColumnDef<GoogleKeyword>[] = [
    { accessorKey: 'keyword', header: 'Keyword', cell: info => <span className="font-medium">{info.getValue<string>()}</span> },
    { accessorKey: 'match_type', header: 'Match Type' },
    { accessorKey: 'impressions', header: 'Impressions', cell: info => info.getValue<number>().toLocaleString() },
    { accessorKey: 'clicks', header: 'Clicks', cell: info => info.getValue<number>().toLocaleString() },
    { accessorKey: 'ctr', header: 'CTR', cell: info => `${info.getValue<number>().toFixed(2)}%` },
    { accessorKey: 'avg_cpc', header: 'Avg. CPC', cell: info => `€${info.getValue<number>().toFixed(2)}` },
    { accessorKey: 'conversions', header: 'Conversions', cell: info => info.getValue<number>().toLocaleString() },
    { accessorKey: 'cost_per_conversion', header: 'Cost/Conv.', cell: info => `€${info.getValue<number>().toFixed(2)}` },
];


export function GoogleAdsTab({ data, isLoading }: GoogleAdsTabProps) {
    if (isLoading) return <div>Loading Google Ads data...</div>;

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader><CardTitle className="text-sm">Quality Score Medio</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{data.kpis.avgQualityScore.toFixed(1)}/10</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-sm">Impression Share</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{data.kpis.impressionShare.toFixed(1)}%</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-sm">Search Lost IS (Budget)</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{data.kpis.searchLostISBudget.toFixed(1)}%</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-sm">Search Lost IS (Rank)</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{data.kpis.searchLostISRank.toFixed(1)}%</p></CardContent>
            </Card>
        </div>
      <Card>
        <CardHeader><CardTitle>Performance Campagne Google</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={campaignColumns} data={data.campaigns} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Top 20 Keywords (Search)</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={keywordColumns} data={data.keywords} />
        </CardContent>
      </Card>
    </div>
  );
}