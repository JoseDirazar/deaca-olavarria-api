import { Module, Global } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { DataService } from "./preload-script.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "@modules/iam/user/user.service";
import { CategoryService } from "@modules/category/category.service";
import { Image } from "@models/Image.entity";
import { User } from "@models/User.entity";
import { Category } from "@models/Category.entity";
import { Subcategory } from "@models/Subcategory.entity";

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Image, User, Category, Subcategory])],
    providers: [UploadService, DataService, UserService, CategoryService],
    exports: [UploadService],
})
export class UploadModule { }