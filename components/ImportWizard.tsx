import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, ArrowRight, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { cn } from '../lib/utils';
import type { DataSource, ImportPreview, FieldMapping } from '../types/dataMapping.types';
import { createImportPreview } from '../services/dataMapper';
import { downloadCSVTemplate } from '../services/dataIntegration';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, any>[], mappings: FieldMapping[]) => void;
}

type WizardStep = 'source' | 'upload' | 'mapping' | 'preview' | 'complete';

export function ImportWizard({ isOpen, onClose, onImport }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('source');
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      let parsedData: Record<string, any>[] = [];

      if (file.name.endsWith('.json')) {
        parsedData = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        parsedData = parseCSV(text);
      }

      setRawData(parsedData);

      // Create preview with auto-detection
      const importPreview = createImportPreview(
        selectedSource || {
          id: 'file-upload',
          name: file.name,
          type: 'csv',
        },
        parsedData
      );

      setPreview(importPreview);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Errore nel parsing del file. Verifica il formato.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (text: string): Record<string, any>[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const data: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim();
      });
      data.push(row);
    }

    return data;
  };

  const handleImport = () => {
    if (!preview) return;
    onImport(preview.transformedData, preview.detectedFields);
    setCurrentStep('complete');
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setCurrentStep('source');
    setSelectedSource(null);
    setRawData([]);
    setPreview(null);
    onClose();
  };

  const renderSourceSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-100">Seleziona Sorgente Dati</h3>
      <p className="text-sm text-gray-400">
        Scegli da dove importare i tuoi dati di marketing e vendite
      </p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* CSV/JSON Upload */}
        <button
          onClick={() => {
            setSelectedSource({
              id: 'file',
              name: 'File locale',
              type: 'csv',
            });
            setCurrentStep('upload');
          }}
          className="p-6 bg-gray-800 border-2 border-gray-700 rounded-lg hover:border-cyan-500 transition-colors"
        >
          <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
          <h4 className="font-medium text-gray-100 mb-1">File CSV/JSON</h4>
          <p className="text-xs text-gray-400">Carica file dal tuo computer</p>
        </button>

        {/* Google Sheets */}
        <button
          className="p-6 bg-gray-800 border-2 border-gray-700 rounded-lg hover:border-green-500 transition-colors opacity-50 cursor-not-allowed"
          disabled
        >
          <FileText className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <h4 className="font-medium text-gray-100 mb-1">Google Sheets</h4>
          <p className="text-xs text-gray-400">Prossimamente</p>
        </button>

        {/* Airtable */}
        <button
          className="p-6 bg-gray-800 border-2 border-gray-700 rounded-lg hover:border-orange-500 transition-colors opacity-50 cursor-not-allowed"
          disabled
        >
          <FileText className="w-8 h-8 text-orange-400 mx-auto mb-3" />
          <h4 className="font-medium text-gray-100 mb-1">Airtable</h4>
          <p className="text-xs text-gray-400">Prossimamente</p>
        </button>

        {/* Notion */}
        <button
          className="p-6 bg-gray-800 border-2 border-gray-700 rounded-lg hover:border-purple-500 transition-colors opacity-50 cursor-not-allowed"
          disabled
        >
          <FileText className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <h4 className="font-medium text-gray-100 mb-1">Notion</h4>
          <p className="text-xs text-gray-400">Prossimamente</p>
        </button>
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentStep('source')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Torna indietro
      </button>

      <h3 className="text-lg font-semibold text-gray-100">Carica File</h3>
      <p className="text-sm text-gray-400">
        Supportati: CSV, JSON. Il sistema rileverà automaticamente i campi.
      </p>

      {/* Template Download */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-400 mb-1">
              Prima volta che importi dati?
            </h4>
            <p className="text-xs text-gray-400 mb-3">
              Scarica il template CSV con esempi per capire il formato corretto
            </p>
            <button
              onClick={downloadCSVTemplate}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Scarica Template CSV
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="file-upload"
          className={cn(
            'flex flex-col items-center justify-center w-full h-64 px-4 transition',
            'bg-gray-800 border-2 border-gray-700 border-dashed rounded-lg',
            'cursor-pointer hover:bg-gray-700/50 hover:border-cyan-500'
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="mb-2 text-sm text-gray-300">
              <span className="font-semibold">Clicca per caricare</span> o trascina qui
            </p>
            <p className="text-xs text-gray-400">CSV o JSON (max 10MB)</p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".csv,.json"
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
        </label>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-cyan-400 mt-4">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-400 border-t-transparent" />
          <span className="text-sm">Analisi dati in corso...</span>
        </div>
      )}
    </div>
  );

  const renderPreview = () => {
    if (!preview) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">Anteprima e Mappatura</h3>
        <p className="text-sm text-gray-400">
          Controlla i campi rilevati automaticamente
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-cyan-400">{preview.stats.totalRows}</div>
            <div className="text-xs text-gray-400 mt-1">Righe totali</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{preview.stats.validRows}</div>
            <div className="text-xs text-gray-400 mt-1">Righe valide</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-400">{preview.stats.invalidRows}</div>
            <div className="text-xs text-gray-400 mt-1">Righe con errori</div>
          </div>
        </div>

        {/* Field Mappings */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-200 mb-3">Campi Rilevati</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {preview.detectedFields.map((mapping, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-200">
                      {mapping.sourceField}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Tipo: {mapping.fieldType}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-cyan-400">
                      {mapping.targetField}
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    mapping.confidence > 0.8
                      ? 'bg-green-500/20 text-green-400'
                      : mapping.confidence > 0.5
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {Math.round(mapping.confidence * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Errors */}
        {preview.errors.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Errori Rilevati ({preview.errors.length})
            </h4>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-h-32 overflow-y-auto">
              {preview.errors.slice(0, 5).map((error, index) => (
                <div key={index} className="text-xs text-red-300 mb-1">
                  Riga {error.row + 1}, campo "{error.field}": {error.error}
                </div>
              ))}
              {preview.errors.length > 5 && (
                <div className="text-xs text-red-400 mt-2">
                  ... e altri {preview.errors.length - 5} errori
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setCurrentStep('upload')}
            className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Carica Altro File
          </button>
          <button
            onClick={handleImport}
            disabled={preview.stats.validRows === 0}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Importa {preview.stats.validRows} Righe
          </button>
        </div>
      </div>
    );
  };

  const renderComplete = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-100 mb-2">Import Completato!</h3>
      <p className="text-sm text-gray-400">
        I dati sono stati importati con successo nella dashboard
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-100">Importa Dati</h2>
            <p className="text-sm text-gray-400 mt-1">
              Step {currentStep === 'source' ? '1' : currentStep === 'upload' ? '2' : '3'} di 3
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'source' && renderSourceSelection()}
          {currentStep === 'upload' && renderUpload()}
          {currentStep === 'preview' && renderPreview()}
          {currentStep === 'complete' && renderComplete()}
        </div>
      </div>
    </div>
  );
}
