import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SignalDocument = HydratedDocument<Signal>;

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
}

@Schema({ timestamps: true })
export class Signal {
  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ type: String, enum: SignalType, required: true })
  type: SignalType;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  percentChange: number;

  @Prop({ type: Types.ObjectId, ref: 'Trade' })
  tradeId: Types.ObjectId;
}

export const SignalSchema = SchemaFactory.createForClass(Signal);
SignalSchema.index({ symbol: 1, date: 1, type: 1 });
