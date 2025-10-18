import { Module, Global } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { DataService } from "./preload-script.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Image } from "@models/Image.entity";
import { User } from "@models/User.entity";
import { Category } from "@models/Category.entity";
import { Subcategory } from "@models/Subcategory.entity";
import { Establishment } from "@models/Establishment.entity";

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Image, User, Category, Subcategory, Establishment])],
    providers: [UploadService, DataService],
    exports: [UploadService],
})
export class UploadModule { }