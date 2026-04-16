import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import * as mongoose from 'mongoose';
import { PropertyService } from './property.service';
import { PropertyInput } from '../../libs/dto/property/property.input';
import { Property } from '../../libs/dto/property/property';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';

@Resolver()
export class PropertyResolver {
  constructor(private readonly propertyService: PropertyService) {}

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
}