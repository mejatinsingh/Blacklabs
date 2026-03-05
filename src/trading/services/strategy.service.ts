import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Signal, SignalDocument, SignalType } from '../schemas/signal.schema';
import { Trade, TradeDocument, TradeStatus } from '../schemas/trade.schema';
import { MarketDataService } from './market-data.service';

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);

  private readonly BUY_DROP_PERCENT = 5; // Buy if dropped >= 5%
  private readonly SELL_GAIN_PERCENT = 10; // Sell if gained >= 10%
  private readonly LOOKBACK_DAYS = 7; // Compare with 7 days ago

  constructor(
    @InjectModel(Signal.name)
    private signalModel: Model<SignalDocument>,
    @InjectModel(Trade.name)
    private tradeModel: Model<TradeDocument>,
    private marketDataService: MarketDataService,
  ) {}

  async generateSignals(date?: Date): Promise<{
    buySignals: number;
    sellSignals: number;
    date: string;
  }> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Clear old signals for this date
    await this.signalModel.deleteMany({
      date: targetDate,
    });

    const symbols = await this.marketDataService.getWatchlistSymbols();
    let buySignals = 0;
    let sellSignals = 0;

    // Generate BUY signals
    for (const symbol of symbols) {
      try {
        const todayPrice = await this.marketDataService.getPrice(symbol, targetDate);
        const pastPrice = await this.marketDataService.getPriceNDaysAgo(
          symbol,
          targetDate,
          this.LOOKBACK_DAYS,
        );

        if (!todayPrice || !pastPrice) continue;

        const percentChange =
          ((todayPrice.close - pastPrice.close) / pastPrice.close) * 100;

        // BUY signal: dropped >= 5%
        if (percentChange <= -this.BUY_DROP_PERCENT) {
          await this.signalModel.create({
            symbol,
            date: targetDate,
            type: SignalType.BUY,
            price: todayPrice.close,
            percentChange: Math.round(percentChange * 100) / 100,
          });
          buySignals++;
        }
      } catch {
        // Skip stocks with missing data
      }
    }

    // Generate SELL signals from open trades
    const openTrades = await this.tradeModel.find({ status: TradeStatus.OPEN });

    for (const trade of openTrades) {
      try {
        const currentPrice = await this.marketDataService.getPrice(
          trade.symbol,
          targetDate,
        );

        if (!currentPrice) continue;

        const gainPercent =
          ((currentPrice.close - trade.buyPrice) / trade.buyPrice) * 100;

        if (gainPercent >= this.SELL_GAIN_PERCENT) {
          await this.signalModel.create({
            symbol: trade.symbol,
            date: targetDate,
            type: SignalType.SELL,
            price: currentPrice.close,
            percentChange: Math.round(gainPercent * 100) / 100,
            tradeId: trade._id,
          });
          sellSignals++;
        }
      } catch {
        // Skip
      }
    }

    this.logger.log(
      `Signals for ${dateStr}: ${buySignals} BUY, ${sellSignals} SELL`,
    );
    return { buySignals, sellSignals, date: dateStr };
  }

  async getSignals(date: Date): Promise<SignalDocument[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return await this.signalModel
      .find({ date: { $gte: start, $lte: end } })
      .sort({ type: 1, percentChange: 1 });
  }

  async getTodaySignals(): Promise<SignalDocument[]> {
    return this.getSignals(new Date());
  }
}
