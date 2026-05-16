import { Controller, Get, Logger } from '@nestjs/common';                      // NestJS controller va logger
import { BatchService } from './batch.service';                                 // Batch business logic service
import { Cron, Interval, Timeout } from '@nestjs/schedule';                   // Vaqt boshqaruvi dekoratorlari
import { BATCH_ROLLBACK, BATCH_TOP_AGENTS, BATCH_TOP_PROPERTIES } from './lib/config';

@Controller()                                                                   // Bu class HTTP Controller ekanligini bildiradi
export class BatchController {
  private logger: Logger = new Logger('BatchController');                      // Logger yaratadi (BatchController nomi bilan)

  constructor(private readonly batchService: BatchService) {}                  // BatchService ni inject qiladi

  @Timeout(1000)                                                                // Server ishga tushgandan 1000ms (1 sekund) keyin bir marta ishga tushadi
  handleTimeout() {
    this.logger.debug('BATCH SERVER READY!');                                  // Server tayyor ekanligini log qiladi
  }

  //=================================================
 @Cron('00 * * * * *', { name: BATCH_ROLLBACK })                               // Har minutning 0-sekundida ishga tushadi
public async batchRollback() {
  try {
    this.logger['context'] = BATCH_ROLLBACK;                                  // Logger contextini BATCH_ROLLBACK ga o'zgartiradi
    this.logger.debug('EXECUTED!');                                            // Ishga tushganini log qiladi
    await this.batchService.batchRollback();                                   // Rollback logicini ishga tushiradi
  } catch (err) {
    this.logger.error(err);                                                    // Xato bo'lsa error log qiladi
  }
}


//=====================================================
@Cron('20 * * * * *', { name: BATCH_TOP_PROPERTIES })                        // Har minutning 20-sekundida ishga tushadi
public async batchTopProperties() {
  try {
    this.logger['context'] = BATCH_TOP_PROPERTIES;                            // Logger contextini BATCH_TOP_PROPERTIES ga o'zgartiradi
    this.logger.debug('EXECUTED!');                                            // Ishga tushganini log qiladi
    await this.batchService.batchTopProperties();                                 // Top properties logicini ishga tushiradi
  } catch (err) {
    this.logger.error(err);                                                    // Xato bo'lsa error log qiladi
  }
}
//====================================================
@Cron('40 * * * * *', { name: BATCH_TOP_AGENTS })                            // Har minutning 40-sekundida ishga tushadi
public async batchTopAgents() {
  try {
    this.logger['context'] = BATCH_TOP_AGENTS;                                // Logger contextini BATCH_TOP_AGENTS ga o'zgartiradi
    this.logger.debug('EXECUTED!');                                            // Ishga tushganini log qiladi
    await this.batchService.batchTopAgents();                                     // Top agents logicini ishga tushiradi
  } catch (err) {
    this.logger.error(err);                                                    // Xato bo'lsa error log qiladi
  }
}
//================================================
  /*
  @Interval(1000)                                                               // Har 1000ms (1 sekund) da ishga tushadi — hozircha o'chirilgan
  handleInterval() {
    this.logger.debug('INTERVAL TEST');
  }
  */

  @Get()                                                                        // HTTP GET so'rovini qabul qiladi
  getHello(): string {
    return this.batchService.getHello();                                       // BatchService dan salom qaytaradi
  }
}