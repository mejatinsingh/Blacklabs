import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WatchlistDocument = HydratedDocument<Watchlist>;

export enum StockIndex {
  NIFTY500 = 'NIFTY500',
  MIDCAP100 = 'MIDCAP100',
}

@Schema({ timestamps: true })
export class Watchlist {
  @Prop({ required: true, unique: true })
  symbol: string;

  @Prop({ type: String, enum: StockIndex, default: StockIndex.NIFTY500 })
  index: StockIndex;

  @Prop({ default: true })
  isActive: boolean;
}

export const WatchlistSchema = SchemaFactory.createForClass(Watchlist);
