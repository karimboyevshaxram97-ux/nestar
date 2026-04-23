import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { PropertyLocation, PropertyStatus, PropertyType } from '../../enums/property.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';



@ObjectType()
export class Property {
  @Field(() => String)
  _id: mongoose.ObjectId; // Mongodb unikal identifikatori

  @Field(() => PropertyType)
  propertyType: PropertyType; // Ko'chmas mulk turi (uy, kvartira va h.k)

  @Field(() => PropertyStatus)
  propertyStatus: PropertyStatus; // Mulk holati (sotuvda, ijarada va h.k)

  @Field(() => PropertyLocation)
  propertyLocation: PropertyLocation; // Mulk joylashuvi (shahar, tuman)

  @Field(() => String)
  propertyAddress: string; // Mulkning aniq manzili

  @Field(() => String)
  propertyTitle: string; // Mulk nomi/sarlavhasi

  @Field(() => Number)
  propertyPrice: number; // Mulk narxi

  @Field(() => Number)
  propertySquare: number; // Mulk maydoni (m² da)

  @Field(() => Int)
  propertyBeds: number; // Yotoq xonalar soni

  @Field(() => Int)
  propertyRooms: number; // Umumiy xonalar soni

  @Field(() => Int)
  propertyViews: number; // Ko'rishlar soni

  @Field(() => Int)
  propertyLikes: number; // Yoqtirishlar soni

  @Field(() => Int)
  propertyComments: number; // Izohlar soni

  @Field(() => Int)
  propertyRank: number; // Mulk reytingi

  @Field(() => [String])
  propertyImages: string[]; // Mulk rasmlari ro'yxati

  @Field(() => String, { nullable: true })
  propertyDesc?: string; // Mulk tavsifi (ixtiyoriy)

  @Field(() => Boolean)
  propertyBarter: boolean; // Barter imkoniyati (ha/yo'q)

  @Field(() => Boolean)
  propertyRent: boolean; // Ijara imkoniyati (ha/yo'q)

  @Field(() => String)
  memberId: mongoose.ObjectId; // Mulk egasining ID si

  @Field(() => Date, { nullable: true })
  soldAt?: Date; // Sotilgan vaqti (ixtiyoriy)

  @Field(() => Date, { nullable: true })
  deletedAt?: Date; // O'chirilgan vaqti (ixtiyoriy)

  @Field(() => Date, { nullable: true })
  constructedAt?: Date; // Qurilgan vaqti (ixtiyoriy)

  @Field(() => Date)
  createdAt: Date; // Yaratilgan vaqti

  @Field(() => Date)
  updatedAt: Date; // Yangilangan vaqti

 
  /** from aggregation */
  @Field(() => Member, { nullable: true })
  memberData?: Member;

  @Field(() => [MeLiked], { nullable: true })   // GraphQL da MeLiked array, ixtiyoriy (null bo'lishi mumkin)
meLiked?: MeLiked[];                           // Like bosilganmi tekshirish uchun — login user uchun to'ldiriladi
}                        

@ObjectType()              
export class Properties {
  @Field(() => [Property])
  list: Property[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter: TotalCounter[];
}           


