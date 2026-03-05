import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockPrice, StockPriceSchema } from './schemas/stock-price.schema';
import { Watchlist, WatchlistSchema } from './schemas/watchlist.schema';
import { Signal, SignalSchema } from './schemas/signal.schema';
import { Trade, TradeSchema } from './schemas/trade.schema';
import { MarketDataService } from './services/market-data.service';
import { StrategyService } from './services/strategy.service';
import { TradeService } from './services/trade.service';
import { TradingCron } from './trading.cron';
import { TradingController } from './trading.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockPrice.name, schema: StockPriceSchema },
      { name: Watchlist.name, schema: WatchlistSchema },
      { name: Signal.name, schema: SignalSchema },
      { name: Trade.name, schema: TradeSchema },
    ]),
  ],
  controllers: [TradingController],
  providers: [
    MarketDataService,
    StrategyService,
    TradeService,
    TradingCron,
  ],
  exports: [MarketDataService, StrategyService, TradeService],
})
export class TradingModule {}
