import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trade, TradeDocument, TradeStatus } from '../schemas/trade.schema';
import { MarketDataService } from './market-data.service';

@Injectable()
export class TradeService {
  constructor(
    @InjectModel(Trade.name)
    private tradeModel: Model<TradeDocument>,
    private marketDataService: MarketDataService,
  ) {}

  async executeBuy(
    symbol: string,
    price: number,
    date?: Date,
    quantity?: number,
  ): Promise<TradeDocument> {
    const buyDate = date || new Date();
    buyDate.setHours(0, 0, 0, 0);

    return await this.tradeModel.create({
      symbol: symbol.toUpperCase(),
      buyPrice: price,
      buyDate,
      quantity: quantity || 1,
      status: TradeStatus.OPEN,
    });
  }

  async executeSell(tradeId: string): Promise<TradeDocument> {
    const trade = await this.tradeModel.findById(tradeId);
    if (!trade) {
      throw new NotFoundException(`Trade ${tradeId} not found`);
    }
    if (trade.status === TradeStatus.CLOSED) {
      throw new NotFoundException(`Trade ${tradeId} is already closed`);
    }

    // Get current/latest price
    const latestPrice = await this.marketDataService.getPrice(
      trade.symbol,
      new Date(),
    );

    const sellPrice = latestPrice ? latestPrice.close : trade.buyPrice;
    const sellDate = new Date();
    sellDate.setHours(0, 0, 0, 0);

    const pnl = (sellPrice - trade.buyPrice) * trade.quantity;
    const pnlPercent =
      ((sellPrice - trade.buyPrice) / trade.buyPrice) * 100;

    trade.sellPrice = sellPrice;
    trade.sellDate = sellDate;
    trade.pnl = Math.round(pnl * 100) / 100;
    trade.pnlPercent = Math.round(pnlPercent * 100) / 100;
    trade.status = TradeStatus.CLOSED;

    return await trade.save();
  }

  async getOpenPositions(): Promise<TradeDocument[]> {
    return await this.tradeModel
      .find({ status: TradeStatus.OPEN })
      .sort({ buyDate: -1 });
  }

  async getClosedTrades(): Promise<TradeDocument[]> {
    return await this.tradeModel
      .find({ status: TradeStatus.CLOSED })
      .sort({ sellDate: -1 });
  }

  async getPortfolioSummary() {
    const openTrades = await this.tradeModel.find({
      status: TradeStatus.OPEN,
    });
    const closedTrades = await this.tradeModel.find({
      status: TradeStatus.CLOSED,
    });

    const totalInvested = openTrades.reduce(
      (sum, t) => sum + t.buyPrice * t.quantity,
      0,
    );

    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0).length;
    const winRate =
      closedTrades.length > 0
        ? Math.round((winningTrades / closedTrades.length) * 100)
        : 0;

    return {
      openPositions: openTrades.length,
      closedTrades: closedTrades.length,
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      winningTrades,
      losingTrades: closedTrades.length - winningTrades,
      winRate,
    };
  }
}
