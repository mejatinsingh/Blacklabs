import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { parse } from 'csv-parse/sync';
import { createUnzip } from 'zlib';
import { StockPrice, StockPriceDocument } from '../schemas/stock-price.schema';
import { Watchlist, WatchlistDocument, StockIndex } from '../schemas/watchlist.schema';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  private readonly USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  constructor(
    @InjectModel(StockPrice.name)
    private stockPriceModel: Model<StockPriceDocument>,
    @InjectModel(Watchlist.name)
    private watchlistModel: Model<WatchlistDocument>,
  ) {}

  async fetchBhavcopy(date?: Date): Promise<{ inserted: number; date: string }> {
    const targetDate = date || new Date();
    const dateStr = this.formatDate(targetDate);

    // Try new format first, then fallback
    let csvData: string | null = null;

    try {
      csvData = await this.downloadNewFormat(targetDate);
    } catch {
      this.logger.warn(`New format failed for ${dateStr}, trying legacy format...`);
    }

    if (!csvData) {
      try {
        csvData = await this.downloadLegacyFormat(targetDate);
      } catch {
        this.logger.warn(`Legacy format also failed for ${dateStr}`);
      }
    }

    if (!csvData) {
      this.logger.error(`No Bhavcopy data available for ${dateStr}. Possibly a holiday/weekend.`);
      return { inserted: 0, date: dateStr };
    }

    const records = this.parseBhavcopyCSV(csvData);
    let inserted = 0;

    for (const record of records) {
      try {
        await this.stockPriceModel.findOneAndUpdate(
          { symbol: record.symbol, date: record.date },
          record,
          { upsert: true, new: true },
        );
        inserted++;
      } catch {
        // Duplicate or error, skip
      }
    }

    this.logger.log(`Fetched Bhavcopy for ${dateStr}: ${inserted} stocks upserted`);
    return { inserted, date: dateStr };
  }

  async syncWatchlist(): Promise<{ synced: number }> {
    const url =
      'https://www.niftyindices.com/IndexConstituent/ind_nifty500list.csv';

    const response = await fetch(url, {
      headers: { 'User-Agent': this.USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Nifty 500 list: ${response.status}`);
    }

    const csvText = await response.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    let synced = 0;
    for (const record of records) {
      const symbol = record['Symbol'] || record['symbol'] || record['SYMBOL'];
      if (!symbol) continue;

      await this.watchlistModel.findOneAndUpdate(
        { symbol: symbol.trim() },
        {
          symbol: symbol.trim(),
          index: StockIndex.NIFTY500,
          isActive: true,
        },
        { upsert: true },
      );
      synced++;
    }

    this.logger.log(`Synced watchlist: ${synced} stocks`);
    return { synced };
  }

  async getWatchlistSymbols(): Promise<string[]> {
    const stocks = await this.watchlistModel.find({ isActive: true });
    return stocks.map((s) => s.symbol);
  }

  async getPrice(symbol: string, date: Date): Promise<StockPriceDocument | null> {
    return await this.stockPriceModel.findOne({
      symbol,
      date: { $lte: date },
    }).sort({ date: -1 });
  }

  async getPriceNDaysAgo(
    symbol: string,
    date: Date,
    days: number,
  ): Promise<StockPriceDocument | null> {
    const targetDate = new Date(date);
    targetDate.setDate(targetDate.getDate() - days);

    // Find the nearest trading day on or before the target date
    return await this.stockPriceModel.findOne({
      symbol,
      date: { $lte: targetDate },
    }).sort({ date: -1 });
  }

  private async downloadNewFormat(date: Date): Promise<string> {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}${m}${d}`;

    const url = `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_${dateStr}_F_0000.csv.zip`;
    return await this.downloadAndUnzip(url);
  }

  private async downloadLegacyFormat(date: Date): Promise<string> {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const y = date.getFullYear();
    const m = months[date.getMonth()];
    const d = String(date.getDate()).padStart(2, '0');

    const url = `https://archive.nseindia.com/content/historical/EQUITIES/${y}/${m}/cm${d}${m}${y}bhav.csv.zip`;
    return await this.downloadAndUnzip(url);
  }

  private async downloadAndUnzip(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: { 'User-Agent': this.USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Try to decompress as zip
    // NSE files are zip archives containing a single CSV
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    const csvEntry = entries.find((e) => e.entryName.endsWith('.csv'));
    if (!csvEntry) {
      throw new Error('No CSV file found in zip archive');
    }

    return csvEntry.getData().toString('utf-8');
  }

  private parseBhavcopyCSV(csvData: string): Array<{
    symbol: string;
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    prevClose: number;
    volume: number;
  }> {
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const results: Array<{
      symbol: string;
      date: Date;
      open: number;
      high: number;
      low: number;
      close: number;
      prevClose: number;
      volume: number;
    }> = [];

    for (const row of records) {
      // Filter for EQ series only (regular equity)
      const series = row['SERIES'] || row['SctySrs'] || row[' SERIES'] || '';
      if (series.trim() !== 'EQ') continue;

      const symbol = (row['SYMBOL'] || row['TckrSymb'] || '').trim();
      const dateStr = row['TIMESTAMP'] || row['TradDt'] || row['DATE1'] || '';
      const open = parseFloat(row['OPEN'] || row['OpnPric'] || '0');
      const high = parseFloat(row['HIGH'] || row['HghPric'] || '0');
      const low = parseFloat(row['LOW'] || row['LwPric'] || '0');
      const close = parseFloat(row['CLOSE'] || row['ClsPric'] || '0');
      const prevClose = parseFloat(row['PREVCLOSE'] || row['PrvsClsgPric'] || '0');
      const volume = parseInt(row['TOTTRDQTY'] || row['TtlTradgVol'] || '0', 10);

      if (!symbol || !close) continue;

      let parsedDate: Date;
      if (dateStr) {
        parsedDate = new Date(dateStr);
      } else {
        parsedDate = new Date();
      }
      // Normalize to midnight
      parsedDate.setHours(0, 0, 0, 0);

      results.push({
        symbol,
        date: parsedDate,
        open,
        high,
        low,
        close,
        prevClose,
        volume,
      });
    }

    return results;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
