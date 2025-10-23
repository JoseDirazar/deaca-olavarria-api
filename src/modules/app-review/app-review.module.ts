import { AppReview } from "@models/AppReview.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppReviewService } from "./app-review.service";
import { AppReviewController } from "./app-review.controller";


@Module({
    imports: [TypeOrmModule.forFeature([AppReview])],
    providers: [AppReviewService],
    controllers: [AppReviewController]
})
export class AppReviewModule { }