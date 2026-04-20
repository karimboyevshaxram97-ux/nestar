import { ObjectId } from 'bson';                                                // MongoDB ObjectId klassi (bson kutubxonasidan)

export const availableAgentSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews', 'memberRank']; // Agent uchun ruxsat etilgan sort maydonlari
export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];              // Member uchun ruxsat etilgan sort maydonlari
export const availableOptions = ['propertyBarter', 'propertyRent'];                                        // Property qo'shimcha opsiyalari
export const availablePropertySorts = [                                                                    // Property uchun ruxsat etilgan sort maydonlari
  'createdAt',                                                                 // Yaratilgan vaqt bo'yicha
  'updatedAt',                                                                 // Yangilangan vaqt bo'yicha
  'propertyLikes',                                                             // Like soni bo'yicha
  'propertyViews',                                                             // Ko'rishlar soni bo'yicha
  'propertyRank',                                                              // Reyting bo'yicha
  'propertyPrice',                                                             // Narx bo'yicha
];
export const availableBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];      // BoardArticle uchun ruxsat etilgan sort maydonlari
export const availableCommentSorts = ['createdAt', 'updatedAt'];                                           // Comment uchun ruxsat etilgan sort maydonlari

/** IMAGE CONFIGURATION **/
import { v4 as uuidv4 } from 'uuid';                                          // Noyob ID generatsiya qilish uchun
import * as path from 'path';                                                  // Fayl yo'li bilan ishlash uchun

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];        // Ruxsat etilgan rasm formatlari
export const getSerialForImage = (filename: string) => {                       // Rasm uchun noyob fayl nomi yaratadi
  const ext = path.parse(filename).ext;                                        // Faylning kengaytmasini oladi (.png, .jpg ...)
  return uuidv4() + ext;                                                       // uuid + kengaytma → noyob fayl nomi (masalan: a1b2c3d4.jpg)
};

export const shapeIntoMongoObjectId = (target: any) => {                       // String → MongoDB ObjectId ga o'giruvchi funksiya
  return typeof target === 'string' ? new ObjectId(target) : target;          // String bo'lsa → ObjectId ga o'giradi, aks holda o'zini qaytaradi
};

export const lookupMember = {                                                  // MongoDB $lookup pipeline — member ma'lumotlarini biriktiradi
  $lookup: {                                                                   // SQL dagi JOIN ga o'xshash
    from: 'members',                                                           // 'members' collectionidan qidiradi
    localField: 'memberId',                                                    // Joriy collectiondagi kalit maydon
    foreignField: '_id',                                                       // members collectionidagi mos maydon
    as: 'memberData',                                                          // Natija 'memberData' nomi bilan qo'shiladi (array)
  },
};