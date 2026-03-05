import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ExecuteTradeDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;
}
