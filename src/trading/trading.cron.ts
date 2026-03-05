import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MarketDataService } from './services/market-data.service';
import { StrategyService } from './services/strategy.service';

@Injectable()
export class TradingCron {
  private readonly logger = new Logger(TradingCron.name);

  constructor(
    private marketDataService: MarketDataService,
    private strategyService: StrategyService,
  ) {}

  // Run at 4:00 PM IST (10:30 UTC) Monday to Friday
  @Cron('0 30 10 * * 1-5')
  async handleDailyTradingJob() {
    this.logger.log('=== Daily Trading Cron Started ===');

    try {
      // Step 1: Fetch today's Bhavcopy
      const fetchResult = await this.marketDataService.fetchBhavcopy();
      this.logger.log(`Bhavcopy: ${fetchResult.inserted} stocks fetched for ${fetchResult.date}`);

      if (fetchResult.inserted === 0) {
        this.logger.warn('No data fetched. Possibly a market holiday. Skipping strategy.');
        return;
      }

      // Step 2: Run strategy and generate signals
      const signals = await this.strategyService.generateSignals();
      this.logger.log(
        `Signals: ${signals.buySignals} BUY, ${signals.sellSignals} SELL`,
      );

      this.logger.log('=== Daily Trading Cron Completed ===');
    } catch (error) {
      this.logger.error('Trading cron failed:', error);
    }
  }
}
