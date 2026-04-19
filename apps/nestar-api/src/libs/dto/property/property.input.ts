import { Field, InputType, Int } from '@nestjs/graphql';
import {  IsIn, IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { PropertyLocation, PropertyType } from '../../enums/property.enum';
import * as mongoose from 'mongoose';
import { availableOptions, availablePropertySorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class PropertyInput {
  @IsNotEmpty()
  @Field(() => PropertyType)
  propertyType: PropertyType; // Mulk turi

  @IsNotEmpty()
  @Field(() => PropertyLocation)
  propertyLocation: PropertyLocation; // Mulk joylashuvi

  @IsNotEmpty()
  @Length(3, 100)
  @Field(() => String)
  propertyAddress: string; // Mulk manzili (3-100 belgi)

  @IsNotEmpty()
  @Length(3, 100)
  @Field(() => String)
  propertyTitle: string; // Mulk sarlavhasi (3-100 belgi)

  @IsNotEmpty()
  @Field(() => Number)
  propertyPrice: number; // Mulk narxi

  @IsNotEmpty()
  @Field(() => Number)
  propertySquare: number; // Mulk maydoni

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Field(() => Int)
  propertyBeds: number; // Yotoq xonalar soni (min: 1)

  @IsNotEmpty()
  @IsInt()        // Butun son
  @Min(1)         // Min: 1
  @Field(() => Int)
  propertyRooms: number; // Xonalar soni

  @IsNotEmpty()
  @Field(() => [String])  // String massivi
  propertyImages: string[]; // Rasm URL lari

  @IsOptional()   // Ixtiyoriy
  @Length(5, 500) // 5-500 belgi
  @Field(() => String, { nullable: true })
  propertyDesc?: string; // Tavsif

  @IsOptional()   // Ixtiyoriy
  @Field(() => Boolean, { nullable: true })
  propertyBarter?: boolean; // Barter (ha/yo'q)

  @IsOptional()   // Ixtiyoriy
  @Field(() => Boolean, { nullable: true })
  propertyRent?: boolean; // Ijara (ha/yo'q)

  memberId?: mongoose.ObjectId; // Mulk egasi ID (avtomatik to'ldiriladi)

  @IsOptional()   // Ixtiyoriy
  @Field(() => Date, { nullable: true })
  constructedAt?: Date; // Qurilgan sana
}


@InputType()
export class PricesRange {
  @Field(() => Int)
  start: number;

  @Field(() => Int)
  end: number;
}

@InputType()
export class SquaresRange {
  @Field(() => Int)
  start: number;

  @Field(() => Int)
  end: number;
}

@InputType()
export class PeriodsRange {
  @Field(() => Date)
  start: Date;

  @Field(() => Date)
  end: Date;
}


  @InputType()
class PISearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  memberId?: mongoose.ObjectId;

  @IsOptional()
  @Field(() => [PropertyLocation], { nullable: true })
  locationList?: PropertyLocation[];

  @IsOptional()
  @Field(() => [PropertyType], { nullable: true })
  typeList?: PropertyType[];

  @IsOptional()
  @Field(() => [Int], { nullable: true })
  roomsList?: Number[];

  @IsOptional()
  @Field(() => [Int], { nullable: true })
  bedsList?: Number[];

  @IsOptional()
  @IsIn(availableOptions, { each: true })
  @Field(() => [String], { nullable: true })
  options?: string[];

  @IsOptional()
  @Field(() => PricesRange, { nullable: true })
  pricesRange?: PricesRange;

  @IsOptional()
  @Field(() => PeriodsRange, { nullable: true })
  periodsRange?: PeriodsRange;

  @IsOptional()
  @Field(() => SquaresRange, { nullable: true })
  squaresRange?: SquaresRange;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}


  @InputType()
export class PropertiesInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @IsIn(availablePropertySorts)
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsNotEmpty()
  @Field(() => PISearch)
  search: PISearch;
}

