import { Category } from "@models/Category.entity";
import { Subcategory } from "@models/Subcategory.entity";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class EstablishmentDto {
    @IsString()
    @IsNotEmpty()
    name: string;


    @IsString()
    @IsNotEmpty()
    address: string;


    @IsString()
    @IsNotEmpty()
    phone: string;


    @IsString()
    @IsNotEmpty()
    email: string;


    @IsString()
    @IsNotEmpty()
    website: string;


    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    instagram: string;


    @IsString()
    @IsNotEmpty()
    facebook: string;


    @IsString()
    @IsNotEmpty()
    latitude: string;


    @IsString()
    @IsNotEmpty()
    longitude: string;

    @IsNotEmpty()
    @IsArray()
    categories: Category[];

    @IsNotEmpty()
    @IsArray()
    subcategories: Subcategory[];
}   