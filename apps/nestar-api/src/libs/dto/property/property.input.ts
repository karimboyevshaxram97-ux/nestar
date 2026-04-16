import { Field, InputType, Int } from '@nestjs/graphql';
import {  IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { PropertyLocation, PropertyType } from '../../enums/property.enum';
import { ObjectId } from 'mongoose';

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

  memberId?: ObjectId; // Mulk egasi ID (avtomatik to'ldiriladi)

  @IsOptional()   // Ixtiyoriy
  @Field(() => Date, { nullable: true })
  constructedAt?: Date; // Qurilgan sana
}