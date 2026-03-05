import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StockPriceDocument = HydratedDocument<StockPrice>;

@Schema({ timestamps: true })
export class StockPrice {
  @Prop({ required: true, index: true })
  symbol: string;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ required: true })
  open: number;

  @Prop({ required: true })
  high: number;

  @Prop({ required: true })
  low: number;

  @Prop({ required: true })
  close: number;

  @Prop()
  prevClose: number;

  @Prop({ default: 0 })
  volume: number;
}

export const StockPriceSchema = SchemaFactory.createForClass(StockPrice);
StockPriceSchema.index({ symbol: 1, date: 1 }, { unique: true });
