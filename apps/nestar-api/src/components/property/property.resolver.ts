import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import * as mongoose from 'mongoose';
import { PropertyService } from './property.service';
import { AgentPropertiesInquiry, AllPropertiesInquiry, OrdinaryInquiry, PropertiesInquiry, PropertyInput } from '../../libs/dto/property/property.input';
import { Properties, Property } from '../../libs/dto/property/property';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { PropertyUpdate } from '../../libs/dto/property/property.update';
import { AuthGuard } from '../auth/guards/auth.guard';

@Resolver()
export class PropertyResolver {
  constructor(private readonly propertyService: PropertyService) {}
   //============================================================================ 
  @Roles(MemberType.AGENT) // Faqat AGENT roli uchun
  @UseGuards(RolesGuard)   // Rol tekshiruvi
  @Mutation(() => Property) // GraphQL mutation, Property qaytaradi
  public async createProperty(
    @Args('input') input: PropertyInput, // GraphQL dan kiritilgan ma'lumot
    @AuthMember('_id') memberId: mongoose.ObjectId, // Token dan olingan foydalanuvchi ID
  ): Promise<Property > {
    console.log('Mutation: createProperty');
    input.memberId = memberId; // Mulkka egasining ID sini qo'shadi
    return await this.propertyService.createProperty(input); // Servicega uzatadi
  }

  //============================================================================

@UseGuards(WithoutGuard)                        // Guard: login bo'lmagan user ham kira oladi
@Query((returns) => Property)                   // GraphQL Query - Property tipini qaytaradi
public async getProperty(
  @Args('propertyId') input: string,            // GraphQL dan propertyId argumentini oladi (string)
  @AuthMember('_id') memberId: mongoose.ObjectId, // Token bo'lsa memberId oladi, bo'lmasa undefined
): Promise<Property> {                          // Har doim Property qaytaradi (async)

  console.log('Query: getProperty');            // Debug uchun log

  const propertyId = shapeIntoMongoObjectId(input); // String → MongoDB ObjectId ga o'giradi

  return await this.propertyService.getProperty(memberId, propertyId); // Service ga uzatadi
}

  //=================================================================
 @Roles(MemberType.AGENT)                        // Faqat AGENT role ga ruxsat
 @UseGuards(RolesGuard)                          // Role tekshiruvchi Guard ishlatiladi
 @Mutation(() => Property)                       // GraphQL Mutation - Property qaytaradi
 public async updateProperty(
  @Args('input') input: PropertyUpdate,         // GraphQL dan yangilash ma'lumotlari
  @AuthMember('_id') memberId: mongoose.ObjectId, // Tokendan Agent ning _id si olinadi
): Promise<Property> {

  console.log('Mutation: updateProperty');      // Debug uchun log

  input._id = shapeIntoMongoObjectId(input._id); // input._id → MongoDB ObjectId ga o'giradi

  return await this.propertyService.updateProperty(memberId, input); // Service ga uzatadi
}
//==================================================================
@UseGuards(WithoutGuard)                          // Login bo'lmagan ham kira oladi
@Query(() => Properties)                          // GraphQL Query, ro'yxat qaytaradi
public async getProperties(
  @Args('input') input: PropertiesInquiry,        // Filter, sort, pagination
  @AuthMember('_id') memberId: mongoose.ObjectId, // Login bo'lsa ObjectId, bo'lmasa undefined
): Promise<Properties> {                          // { list: Property[], metaCounter: [{total}] }
  console.log('Query: getProperties');            // Debug log
  return await this.propertyService.getProperties(memberId, input); // Service ga uzatadi
}

//==============================================================
@UseGuards(AuthGuard)                                                           // Faqat login bo'lgan user kira oladi
@Query((returns) => Properties)                                                 // GraphQL Query, Properties ro'yxati qaytaradi
public async getFavorites(
  @Args('input') input: OrdinaryInquiry,                                        // Faqat page va limit (oddiy pagination)
  @AuthMember('_id') memberId: mongoose.ObjectId,                                        // Tokendan foydalanuvchi ID si
): Promise<Properties> {
  console.log('Query: getProperties');                                          // ⚠️ Log noto'g'ri — 'getFavorites' bo'lishi kerak edi
  return await this.propertyService.getFavorites(memberId, input);              // Service ga uzatadi
}
  //===========================================================
@UseGuards(AuthGuard)                                             // AuthGuard qo‘llanmoqda, faqat autentifikatsiyadan o‘tgan foydalanuvchilar kiradi
@Query((returns) => Properties)                                   // GraphQL query: Properties obyektini qaytaradi
public async getVisited(
  @Args('input') input: OrdinaryInquiry,                           // GraphQL argument: inquiry DTO
  @AuthMember('_id') memberId: mongoose.ObjectId,                  // AuthMember dekoratori orqali foydalanuvchi ID olinadi
): Promise<Properties> {
  console.log('Query: getVisited'); // Konsolga log chiqaradi
  return await this.propertyService.getVisited(memberId, input);   // PropertyService orqali tashrif buyurilgan propertylarni olish jarayonini bajaradi
}



//===============================================================
@Roles(MemberType.AGENT)
@UseGuards(RolesGuard)                            // Faqat AGENT kira oladi
@Query(() => Properties)                          // GraphQL Query, ro'yxat qaytaradi
public async getAgentProperties(
  @Args('input') input: AgentPropertiesInquiry,   // Agent uchun maxsus filter/sort/pagination
  @AuthMember('_id') memberId: mongoose.ObjectId, // Tokendan Agent ning _id si
): Promise<Properties> {
  console.log('Query: getAgentProperties');       // Debug log
  return await this.propertyService.getAgentProperties(memberId, input); // Faqat o'z propertylarini ko'radi
}

//============================LIKE ============================
@UseGuards(AuthGuard)                                                           // Faqat login bo'lgan user kira oladi
@Mutation(() => Property)                                                       // GraphQL Mutation, Property qaytaradi
public async likeTargetProperty(
  @Args('propertyId') input: string,                                              // Like bosiladigan property ID si (string)
  @AuthMember('_id') memberId: mongoose.ObjectId,                                        // Tokendan like bosgan user ning ID si
): Promise<Property> {
  console.log('Mutation: likeTargetProperty');                                 // Debug log
  const likeRefId = shapeIntoMongoObjectId(input);                             // String → MongoDB ObjectId ga o'giradi
  return await this.propertyService.likeTargetProperty(memberId, likeRefId);   // Service ga uzatadi
}


// ====ADMIN=====================================================

@Roles(MemberType.ADMIN)
@UseGuards(RolesGuard)                            // Faqat ADMIN kira oladi
@Query((returns) => Properties)                   // GraphQL Query, ro'yxat qaytaradi
public async getAllPropertiesByAdmin(
  @Args('input') input: AllPropertiesInquiry,     // Admin uchun keng filter (barcha statuslar)
  @AuthMember('_id') memberId: mongoose.ObjectId, // Admin _id si (logda ishlatilishi mumkin)
): Promise<Properties> {
  console.log('Query: getAllPropertiesByAdmin');   // Debug log
  return await this.propertyService.getAllPropertiesByAdmin(input); // memberId ishlatilmaydi!
}
//===============================================================

@Roles(MemberType.ADMIN)
@UseGuards(RolesGuard)                            // Faqat ADMIN kira oladi
@Mutation((returns) => Property)                  // GraphQL Mutation, Property qaytaradi
public async updatePropertyByAdmin(
  @Args('input') input: PropertyUpdate,           // Yangilash ma'lumotlari
): Promise<Property> {                            // ⚠️ memberId yo'q - Admin hamma nimani o'zgartira oladi
  console.log('Mutation: updatePropertyByAdmin'); // Debug log
  input._id = shapeIntoMongoObjectId(input._id);  // String → MongoDB ObjectId
  return await this.propertyService.updatePropertyByAdmin(input);
}
//===============================================================
@Roles(MemberType.ADMIN)
@UseGuards(RolesGuard)                             // Faqat ADMIN kira oladi
@Mutation((returns) => Property)                   // GraphQL Mutation, o'chirilgan Property qaytaradi
public async removePropertyByAdmin(
  @Args('propertyId') input: string,               // O'chiriladigan property ID (string)
): Promise<Property> {                             // ⚠️ memberId yo'q - Admin istalgan propertyni o'chira oladi
  console.log('Mutation: removePropertyByAdmin');  // Debug log
  const propertyId = shapeIntoMongoObjectId(input);// String → MongoDB ObjectId
  return await this.propertyService.removePropertyByAdmin(propertyId);
}
}