import { IsOptional, IsDateString } from 'class-validator';

export class QuerySignalsDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
