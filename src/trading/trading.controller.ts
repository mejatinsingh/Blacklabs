import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { MarketDataService } from './services/market-data.service';
import { StrategyService } from './services/strategy.service';
import { TradeService } from './services/trade.service';
import { ExecuteTradeDto } from './dto/execute-trade.dto';
import { QuerySignalsDto } from './dto/query-signals.dto';

@Controller('trading')
export class TradingController {
  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly strategyService: StrategyService,
    private readonly tradeService: TradeService,
  ) {}

  // --- Signals ---

  @Get('signals/today')
  getTodaySignals() {
    return this.strategyService.getTodaySignals();
  }

  @Get('signals')
  getSignals(@Query() query: QuerySignalsDto) {
    const date = query.date ? new Date(query.date) : new Date();
    return this.strategyService.getSignals(date);
  }

  // --- Portfolio ---

  @Get('portfolio')
  getOpenPositions() {
    return this.tradeService.getOpenPositions();
  }

  @Get('portfolio/history')
  getClosedTrades() {
    return this.tradeService.getClosedTrades();
  }

  @Get('portfolio/summary')
  getPortfolioSummary() {
    return this.tradeService.getPortfolioSummary();
  }

  // --- Trade Execution ---

  @Post('buy')
  executeBuy(@Body() dto: ExecuteTradeDto) {
    return this.tradeService.executeBuy(dto.symbol, dto.price, undefined, dto.quantity);
  }

  @Post('sell/:tradeId')
  executeSell(@Param('tradeId') tradeId: string) {
    return this.tradeService.executeSell(tradeId);
  }

  // --- Watchlist ---

  @Get('watchlist')
  getWatchlist() {
    return this.marketDataService.getWatchlistSymbols();
  }

  // --- Manual Triggers ---

  @Post('sync-watchlist')
  syncWatchlist() {
    return this.marketDataService.syncWatchlist();
  }

  @Post('fetch-data')
  fetchData(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : undefined;
    return this.marketDataService.fetchBhavcopy(targetDate);
  }

  @Post('run-strategy')
  runStrategy(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : undefined;
    return this.strategyService.generateSignals(targetDate);
  }
}
