import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Property } from '../../libs/dto/property/property';
import { Message } from '../../libs/enums/common.enum';
import { PropertyInput } from '../../libs/dto/property/property.input';
import { MemberService } from '../member/member.service';
import { PropertyStatus } from '../../libs/enums/property.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { StatisticModifier, T } from '../../libs/types/common';

@Injectable()
export class PropertyService {
  viewService: any;
  constructor(
    @InjectModel('Property') private readonly propertyModel: Model<Property>,
    // MongoDB Property modelini inject qiladi
    private memberService: MemberService,
    // Member statistikasini yangilash uchun
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
 public async getProperty(memberId: ObjectId, propertyId: ObjectId): Promise<Property> {
  const search: T = {
    _id: propertyId,
    propertyStatus: PropertyStatus.ACTIVE,
  };

  const targetProperty: Property | null = await this.propertyModel.findOne(search).lean().exec();
  if (!targetProperty) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

  if (memberId) {
    const viewInput = { memberId: memberId, viewRefId: propertyId, viewGroup: ViewGroup.PROPERTY };
    const newView = await this.viewService.recordView(viewInput);
    if (newView) {
      await this.propertyStatsEditor({ _id: propertyId, targetKey: 'propertyViews', modifier: 1 });
      targetProperty.propertyViews++;
    }
  }

  // meLiked

 targetProperty.memberData = await this.memberService.getMember(targetProperty.memberId, targetProperty.memberId); // null bulganda error berdi.
  return targetProperty;
}

public async propertyStatsEditor(input: StatisticModifier): Promise< null | Property> {
  const { _id, targetKey, modifier } = input;
  return await this.propertyModel
    .findByIdAndUpdate(
      _id,
      { $inc: { [targetKey]: modifier } },
      { new: true },
    )
    .exec();
}

 

}