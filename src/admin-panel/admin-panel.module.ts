import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from '../profiles/schemas/profile.schema';
import { StockPrice, StockPriceSchema } from '../trading/schemas/stock-price.schema';
import { Trade, TradeSchema } from '../trading/schemas/trade.schema';
import { Signal, SignalSchema } from '../trading/schemas/signal.schema';
import { Watchlist, WatchlistSchema } from '../trading/schemas/watchlist.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: StockPrice.name, schema: StockPriceSchema },
      { name: Trade.name, schema: TradeSchema },
      { name: Signal.name, schema: SignalSchema },
      { name: Watchlist.name, schema: WatchlistSchema },
    ]),
  ],
})
export class AdminPanelModule {
  static async register() {
    const AdminJS = (await import('adminjs')).default;
    const AdminJSMongoose = await import('@adminjs/mongoose');
    const { AdminModule } = await import('@adminjs/nestjs');

    AdminJS.registerAdapter({
      Resource: AdminJSMongoose.Resource,
      Database: AdminJSMongoose.Database,
    });

    return AdminModule.createAdminAsync({
      imports: [
        MongooseModule.forFeature([
          { name: Profile.name, schema: ProfileSchema },
          { name: StockPrice.name, schema: StockPriceSchema },
          { name: Trade.name, schema: TradeSchema },
          { name: Signal.name, schema: SignalSchema },
          { name: Watchlist.name, schema: WatchlistSchema },
        ]),
      ],
      inject: [
        getModelToken(Profile.name),
        getModelToken(StockPrice.name),
        getModelToken(Trade.name),
        getModelToken(Signal.name),
        getModelToken(Watchlist.name),
      ],
      useFactory: (profileModel, stockPriceModel, tradeModel, signalModel, watchlistModel) => ({
        adminJsOptions: {
          rootPath: '/admin',
          resources: [
            {
              resource: profileModel,
              options: {
                navigation: { name: 'User Management', icon: 'User' },
                listProperties: ['firstName', 'lastName', 'email', 'city', 'isActive', 'createdAt'],
                filterProperties: ['firstName', 'email', 'city', 'isActive'],
              },
            },
            {
              resource: watchlistModel,
              options: {
                navigation: { name: 'Trading', icon: 'Activity' },
                listProperties: ['symbol', 'index', 'isActive'],
              },
            },
            {
              resource: stockPriceModel,
              options: {
                navigation: { name: 'Trading', icon: 'Activity' },
                listProperties: ['symbol', 'date', 'open', 'high', 'low', 'close', 'volume'],
                filterProperties: ['symbol', 'date'],
              },
            },
            {
              resource: signalModel,
              options: {
                navigation: { name: 'Trading', icon: 'Activity' },
                listProperties: ['symbol', 'date', 'type', 'price', 'percentChange'],
                filterProperties: ['symbol', 'date', 'type'],
              },
            },
            {
              resource: tradeModel,
              options: {
                navigation: { name: 'Trading', icon: 'Activity' },
                listProperties: ['symbol', 'buyPrice', 'buyDate', 'status', 'sellPrice', 'pnl', 'pnlPercent'],
                filterProperties: ['symbol', 'status'],
              },
            },
          ],
          branding: {
            companyName: 'Blacklabs Admin',
            logo: false,
            softwareBrothers: false,
          },
        },
        auth: {
          authenticate: async (email: string, password: string) => {
            if (email === 'admin@blacklabs.com' && password === 'admin123') {
              return { email: 'admin@blacklabs.com' };
            }
            return null;
          },
          cookieName: 'adminjs',
          cookiePassword: 'supersecret-session-password-change-in-production',
        },
        sessionOptions: {
          resave: false,
          saveUninitialized: false,
          secret: 'supersecret-session-password-change-in-production',
        },
      }),
    });
  }
}
