import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Schema } from 'mongoose';
import { Properties, Property } from '../../libs/dto/property/property';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AgentPropertiesInquiry, AllPropertiesInquiry, PropertiesInquiry, PropertyInput } from '../../libs/dto/property/property.input';
import { MemberService } from '../member/member.service';
import { PropertyStatus } from '../../libs/enums/property.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { PropertyUpdate } from '../../libs/dto/property/property.update';
import moment from 'moment';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

@Injectable()
export class PropertyService {
  constructor(
    @InjectModel('Property') private readonly propertyModel: Model<Property>,
    // MongoDB Property modelini inject qiladi
    private memberService: MemberService,
    // Member statistikasini yangilash uchun
    private viewService: ViewService,
    private likeService: LikeService,

  ) {}

   //==============================================================
  public async createProperty(input: PropertyInput): Promise<Property> {
    try {
      const result = await this.propertyModel.create(input);
      // Yangi mulk yaratadi

      await this.memberService.memberStatsEditor({
        _id: result.memberId,       // Mulk egasining ID si
        targetKey: 'memberProperties', // Yangilanadigan statistika maydoni
        modifier: 1,                // +1 qo'shadi
      });
      // Eganing mulklar sonini 1 ga oshiradi

      return result;
    } catch (err) {
      console.log('Error, Service.model:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
      // Xato bo'lsa exception qaytaradi
    }
  }
 //================================================================
 public async getProperty(memberId: ObjectId, propertyId: ObjectId): Promise<Property> {          // Bitta mulkni ID bo'yicha olish metodi
  const search: T = {
    _id: propertyId,                                                                               // Qidirilayotgan mulk ID si
    propertyStatus: PropertyStatus.ACTIVE,                                                         // Faqat ACTIVE mulkni qaytaradi
  };

  const targetProperty: Property | null = await this.propertyModel.findOne(search).lean().exec(); // MongoDB dan bitta hujjat qidiradi
                                                                                                   // .lean() = toza JS object (mongoose metodlarsiz, tezroq)
                                                                                                   // .exec() = Promise qaytaradi
  if (!targetProperty) throw new InternalServerErrorException(Message.NO_DATA_FOUND);             // Topilmasa 500 xatosi qaytaradi

  if (memberId) {                                                                                  // Agar foydalanuvchi login bo'lgan bo'lsa
    const viewInput = { memberId: memberId, viewRefId: propertyId, viewGroup: ViewGroup.PROPERTY }; // Ko'rish ma'lumotlarini tayyorlaydi
    const newView = await this.viewService.recordView(viewInput);                                  // Ko'rishni qayd etadi (takroran qayd etmaydi)
    if (newView) {                                                                                  // Agar yangi ko'rish bo'lsa (takror emas)
      await this.propertyStatsEditor({ _id: propertyId, targetKey: 'propertyViews', modifier: 1 }); // DBda propertyViews +1
      targetProperty.propertyViews++;                                                              // Lokal objectda ham +1 (DB ga qayta so'rov yubormaslik uchun)
    }
  }

  // meLiked — hozircha yozilmagan (keyinroq qo'shiladi)
  const likeInput = { memberId: memberId, likeRefId: propertyId, likeGroup: LikeGroup.PROPERTY };
   targetProperty.meLiked = await this.likeService.checkLikeExistence(likeInput);

  targetProperty.memberData = await this.memberService.getMember(                                 // Mulk egasining to'liq ma'lumotlarini oladi
    targetProperty.memberId,                                                                        // Eganing ID si (kimning ma'lumoti kerak)
    targetProperty.memberId,                                                                        // ⚠️ Ikkalasi ham memberId — null bo'lganda xato bergan, shu sababli o'zini o'ziga uzatildi
  );
  return targetProperty;                                                                           // To'liq mulk ma'lumotini qaytaradi
}

public async propertyStatsEditor(input: StatisticModifier): Promise<null | Property> {           // Mulk statistikasini o'zgartiruvchi universal metod
  const { _id, targetKey, modifier } = input;                                                     // Input dan kerakli qiymatlarni ajratib oladi
  return await this.propertyModel
    .findByIdAndUpdate(
      _id,                                                                                         // Qaysi hujjatni yangilash
      { $inc: { [targetKey]: modifier } },                                                         // targetKey maydonini modifier ga o'zgartiradi (+1 yoki -1)
      { new: true },                                                                               // Yangilangan hujjatni qaytaradi (eski emas)
    )
    .exec();                                                                                       // Promise qaytaradi
}
//==============================================================================
 
public async updateProperty(memberId: ObjectId, input: PropertyUpdate): Promise<Property> {
    let { propertyStatus, soldAt, deletedAt } = input;
    const search: T = {
        _id: input._id,
        memberId: memberId,
        propertyStatus: PropertyStatus.ACTIVE,
    };

    if (propertyStatus === PropertyStatus.SOLD) soldAt = moment().toDate();
    else if (propertyStatus === PropertyStatus.DELETE) deletedAt = moment().toDate();

    const result = await this.propertyModel
        .findOneAndUpdate(search, input, {
            new: true,
        })
        .exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    if (soldAt || deletedAt) {
        await this.memberService.memberStatsEditor({
            _id: memberId,
            targetKey: 'memberProperties',
            modifier: -1,
        });
    }

    return result;
}
  //=============================================================================
public async getProperties(memberId: ObjectId, input: PropertiesInquiry): Promise<Properties> {
  const match: T = { propertyStatus: PropertyStatus.ACTIVE };
  const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

  this.shapeMatchQuery(match, input);
  console.log('match', match);

  const result = await this.propertyModel
    .aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupAuthMemberLiked(memberId, "$_id"),
            lookupMember,
            { $unwind: '$memberData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ])
    .exec();
  if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

  return result[0];
}
  
 
  private shapeMatchQuery(match: T, input: PropertiesInquiry): void {
  const {
    memberId,
    locationList,
    roomsList,
    bedsList,
    typeList,
    periodsRange,
    pricesRange,
    squaresRange,
    options,
    text,
  } = input.search;

  if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
  if (locationList) match.propertyLocation = { $in: locationList };
  if (roomsList) match.propertyRooms = { $in: roomsList };
  if (bedsList) match.propertyBeds = { $in: bedsList };
  if (typeList) match.propertyType = { $in: typeList };

  if (pricesRange) {
    match.propertyPrice = {
      $gte: pricesRange.start,
      $lte: pricesRange.end,
    };
  }

  if (periodsRange) {
    match.propertyPeriod = {
      $gte: periodsRange.start,
      $lte: periodsRange.end,
    };
  }

  if (squaresRange) {
    match.propertySquare = {
      $gte: squaresRange.start,
      $lte: squaresRange.end,
    };
  }

  if (text) match.propertyTitle = RegExp(text, 'i');

  if (options) {
    match['$or'] = options.map((ele) => ({ [ele]: true }));
  }
}
//======================================================================
 
public async getAgentProperties(memberId: ObjectId, input: AgentPropertiesInquiry): Promise<Properties> {
  const { propertyStatus } = input.search;
  if (propertyStatus === PropertyStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

  const match: T = {
    memberId: memberId,
    propertyStatus: propertyStatus ?? { $ne: PropertyStatus.DELETE },
  };
  const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

  const result = await this.propertyModel
    .aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupMember,
            { $unwind: '$memberData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ])
    .exec();
  if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

  return result[0];
}

//=============================LIKE=========================================
public async likeTargetProperty(memberId: ObjectId, likeRefId: ObjectId): Promise<Property> { // Property ga like bosish metodi
  const target: Property | null = await this.propertyModel
    .findOne({ _id: likeRefId, propertyStatus: PropertyStatus.ACTIVE })        // Faqat ACTIVE propertyni topadi
    .exec();
  if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);  // Topilmasa 500 xatosi

  const input: LikeInput = {                                                   // Like ma'lumotlarini tayyorlaydi
    memberId: memberId,                                                         // Like bosgan userning ID si
    likeRefId: likeRefId,                                                      // Like bosilgan propertyning ID si
    likeGroup: LikeGroup.PROPERTY,                                             // Like turi: PROPERTY (member, article emas)
  };

  const modifier: number = await this.likeService.toggleLike(input);          // +1 yoki -1 qaytaradi (like/unlike)
  const result = await this.propertyStatsEditor({                              // Property statistikasini yangilaydi
    _id: likeRefId,                                                            // Like bosilgan propertyning ID si
    targetKey: 'propertyLikes',                                                // propertyLikes maydonini o'zgartiradi
    modifier: modifier,                                                        // +1 yoki -1
  });

  if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG); // Yangilanmasa 500 xatosi
  return result;                                                               // Yangilangan propertyni qaytaradi
}s


//===========================================================================
public async getAllPropertiesByAdmin(input: AllPropertiesInquiry): Promise<Properties> {
  const { propertyStatus, propertyLocationList } = input.search;
  const match: T = {};
  const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

  if (propertyStatus) match.propertyStatus = propertyStatus;
  if (propertyLocationList) match.propertyLocation = { $in: propertyLocationList };

  const result = await this.propertyModel
    .aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupMember,
            { $unwind: '$memberData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ])
    .exec();
  if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

  return result[0];
}

 //===================================================================
 public async updatePropertyByAdmin(input: PropertyUpdate): Promise<Property> {
  let { propertyStatus, soldAt, deletedAt } = input;
  const search: T = {
    _id: input._id,
    propertyStatus: PropertyStatus.ACTIVE,
  };

  if (propertyStatus === PropertyStatus.SOLD) soldAt = moment().toDate();
  else if (propertyStatus === PropertyStatus.DELETE) deletedAt = moment().toDate();

  const result = await this.propertyModel
    .findOneAndUpdate(search, input, {
      new: true,
    })
    .exec();
  if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

  if (soldAt || deletedAt) {
    await this.memberService.memberStatsEditor({
      _id: result.memberId,
      targetKey: 'memberProperties',
      modifier: -1,
    });
  }

  return result;
}

//==============================================================
public async removePropertyByAdmin(propertyId: ObjectId): Promise<Property> {
  const search: T = { _id: propertyId, propertyStatus: PropertyStatus.DELETE };
  const result = await this.propertyModel.findOneAndDelete(search).exec();
  if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

  return result;
}

}