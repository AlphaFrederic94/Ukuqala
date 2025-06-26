import { supabase } from './supabaseClient';
import { format } from 'date-fns';

interface ExportOptions {
  startDate: string;
  endDate: string;
  includeTypes: ('exercise' | 'nutrition' | 'sleep' | 'medical')[];
  format: 'csv' | 'json' | 'pdf';
}

export const healthExportService = {
  async exportHealthData(userId: string, options: ExportOptions) {
    const data: Record<string, any> = {};

    // Fetch data based on included types
    if (options.includeTypes.includes('exercise')) {
      const { data: exerciseData } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', options.startDate)
        .lte('created_at', options.endDate);
      data.exercise = exerciseData;
    }

    if (options.includeTypes.includes('nutrition')) {
      const { data: nutritionData } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', options.startDate)
        .lte('created_at', options.endDate);
      data.nutrition = nutritionData;
    }

    if (options.includeTypes.includes('sleep')) {
      const { data: sleepData } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', options.startDate)
        .lte('date', options.endDate);
      data.sleep = sleepData;
    }

    if (options.includeTypes.includes('medical')) {
      const { data: medicalData } = await supabase
        .from('medical_records')
        .select('*')
        .eq('user_id', userId);
      data.medical = medicalData;
    }

    return this.formatExport(data, options.format);
  },

  private formatExport(data: Record<string, any>, format: string) {
    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'pdf':
        return this.generatePDF(data);
      default:
        throw new Error('Unsupported export format');
    }
  },

  private convertToCSV(data: Record<string, any>) {
    // Implementation for CSV conversion
    const csvData: string[] = [];
    
    Object.entries(data).forEach(([category, records]) => {
      if (Array.isArray(records)) {
        records.forEach((record: any) => {
          const row = Object.values(record).join(',');
          csvData.push(row);
        });
      }
    });

    return csvData.join('\n');
  },

  private generatePDF(data: Record<string, any>) {
    // Implementation for PDF generation
    // You might want to use a library like pdfmake or jspdf here
    throw new Error('PDF generation not implemented');
  }
};