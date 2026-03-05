import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ timestamps: true })
export class Profile {
  @Prop({ required: true, unique: true })
  auth0Id: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  bio: string;

  @Prop()
  avatarUrl: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  city: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
