import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { AiProxyService } from './ai-proxy.service';
import { CurrentUser } from '../auth/public.decorator';
import type { PublicUser } from '../auth/dto/auth.types';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { FeasibilityDto } from './dto/feasibility.dto';

/**
 * Every AI page's browser-facing URL, proxied through NestJS.
 *
 * The paths match what the frontend already calls, so the pages do not change
 * in this commit — only the service that answers them. The auth model changes:
 * every route here runs the standard JWT guard (the global guard applies, no
 * @Public() anywhere) and forwards the authenticated user id to ai-service via
 * the internal service token. FastAPI re-reads the role from the database, so
 * a compromised client cannot present a role it does not hold.
 */
@Controller('api/v1')
export class AiProxyController {
  constructor(private readonly ai: AiProxyService) {}

  // ---------------------------------------------------------------- disease

  @Post('disease/detect')
  @UseInterceptors(FileInterceptor('file'))
  detectDisease(
    @CurrentUser() user: PublicUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('crop_type') cropType: string,
    @Body('language') language: string,
  ) {
    return this.ai.detectDisease(
      user.id,
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      },
      cropType,
      language ?? user.language ?? 'en',
    );
  }

  @Get('disease/history/:farmerId')
  diseaseHistory(@CurrentUser() user: PublicUser, @Param('farmerId') farmerId: string) {
    return this.ai.diseaseHistory(user.id, farmerId);
  }

  // ----------------------------------------------------------------- prices

  @Get('prices/crops')
  priceCrops(@CurrentUser() user: PublicUser) {
    return this.ai.priceCrops(user.id);
  }

  @Get('prices/regions')
  priceRegions(@CurrentUser() user: PublicUser) {
    return this.ai.priceRegions(user.id);
  }

  @Get('prices/forecast')
  priceForecast(
    @CurrentUser() user: PublicUser,
    @Query('crop') crop: string,
    @Query('region') region: string,
    @Query('days') days: string,
  ) {
    return this.ai.priceForecast(user.id, { crop, region, days });
  }

  @Get('prices/historical')
  priceHistorical(
    @CurrentUser() user: PublicUser,
    @Query('crop') crop: string,
    @Query('region') region: string,
    @Query('limit') limit: string,
  ) {
    return this.ai.priceHistorical(user.id, { crop, region, limit });
  }

  // ------------------------------------------------------------------- chat

  @Get('chat/sessions')
  chatSessions(@CurrentUser() user: PublicUser) {
    return this.ai.chatSessions(user.id);
  }

  @Post('chat/sessions')
  chatCreateSession(@CurrentUser() user: PublicUser, @Body('language') language: string) {
    return this.ai.chatCreateSession(user.id, language ?? 'en');
  }

  @Get('chat/messages/:sessionId')
  chatMessages(@CurrentUser() user: PublicUser, @Param('sessionId') sessionId: string) {
    return this.ai.chatMessages(user.id, sessionId);
  }

  @Post('chat/messages')
  chatSendMessage(@CurrentUser() user: PublicUser, @Body() dto: SendChatMessageDto) {
    return this.ai.chatSendMessage(user.id, {
      message: dto.message,
      session_id: dto.session_id ?? null,
      language: dto.language,
    });
  }

  @Delete('chat/sessions/:sessionId')
  chatDeleteSession(
    @CurrentUser() user: PublicUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.ai.chatDeleteSession(user.id, sessionId);
  }

  // ---------------------------------------------------------------- quality

  @Post('quality/grade')
  @UseInterceptors(FileInterceptor('file'))
  qualityGrade(
    @CurrentUser() user: PublicUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('product_name') productName: string,
    @Body('product_category') productCategory: string,
  ) {
    return this.ai.qualityGrade(
      user.id,
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      },
      productName,
      productCategory,
    );
  }

  @Get('quality/reports')
  qualityReports(@CurrentUser() user: PublicUser) {
    return this.ai.qualityReports(user.id);
  }

  @Get('quality/standards')
  qualityStandards(@CurrentUser() user: PublicUser) {
    return this.ai.qualityStandards(user.id);
  }

  // --------------------------------------------------------------- industry

  @Get('industry/products')
  industryProducts(@CurrentUser() user: PublicUser) {
    return this.ai.industryProducts(user.id);
  }

  @Get('industry/reports')
  industryReports(@CurrentUser() user: PublicUser) {
    return this.ai.industryReports(user.id);
  }

  @Post('industry/feasibility')
  industryFeasibility(@CurrentUser() user: PublicUser, @Body() dto: FeasibilityDto) {
    return this.ai.industryFeasibility(user.id, dto);
  }

  // -------------------------------------------------------------- equipment

  @Get('equipment/listings')
  equipmentListings(
    @CurrentUser() user: PublicUser,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.ai.equipmentListings(user.id, query);
  }

  @Get('equipment/categories')
  equipmentCategories(@CurrentUser() user: PublicUser) {
    return this.ai.equipmentCategories(user.id);
  }
}
