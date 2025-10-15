import { Subcategory } from "@models/Subcategory.entity";

export class CreateCategoryDto {
    name: string;
    icon?: string;
    subcategories?: Partial<Subcategory>[];
}
