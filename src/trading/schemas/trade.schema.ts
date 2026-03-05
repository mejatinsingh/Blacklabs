import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TradeDocument = HydratedDocument<Trade>;

export enum TradeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Schema({ timestamps: true })
export class Trade {
  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true })
  buyPrice: number;

  @Prop({ required: true })
  buyDate: Date;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ type: String, enum: TradeStatus, default: TradeStatus.OPEN })
  status: TradeStatus;

  @Prop()
  sellPrice: number;

  @Prop()
  sellDate: Date;

  @Prop()
  pnl: number;

  @Prop()
  pnlPercent: number;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
TradeSchema.index({ status: 1 });
TradeSchema.index({ symbol: 1 });
