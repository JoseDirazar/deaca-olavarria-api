import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from '@models/Image.entity';
import { CreateCategoryDto } from '@modules/category/dto/create-category.dto';
import { User } from '@models/User.entity';
import { Establishment } from '@models/Establishment.entity';
import { Category } from '@models/Category.entity';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);
  constructor(
    @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Establishment)
    private readonly establishmentRepository: Repository<Establishment>,
  ) {}

  async loadDataByDefault(): Promise<void> {
    const defaultUsers = [
      {
        email: 'jfdirazar@gmail.com',
        password: 'Qwer@1234',
      },
    ];

    for (const user of defaultUsers) {
      this.logger.debug(`creating default user ${user.email} if it does not exist`);
      const userExists = await this.userRepository.findOneBy({ email: user.email });

      if (!userExists) {
        await this.userRepository.save({ email: user.email, password: user.password });
      }
    }

    const defaultCategories: CreateCategoryDto[] = [
      {
        name: 'Alimentos y Bebidas',
        icon: 'alimentos-y-bebidas.svg',
        subcategories: [
          { name: 'Bebidas' },
          { name: 'Celiaquia | Diabetes | Hipertensión' },
          { name: 'Comidas caseras | Viandas' },
          { name: 'Conservas | Embutidaos | Quesos' },
          { name: 'Desayunos' },
          { name: 'Diabéticos | Productos secos' },
          { name: 'Dulces' },
          { name: 'Ensaladas' },
          { name: 'Granjas' },
          { name: 'Hamburguesas' },
          { name: 'Leches | Kefir | Yogurt' },
          { name: 'Miel' },
          { name: 'Milanesas' },
          { name: 'Pastas | Panes | Pizzas | Tartas' },
          { name: 'Productos rurales' },
          { name: 'Sushi' },
          { name: 'Tés | Cafés' },
          { name: 'Vegetarismo | Veganismo' },
        ],
      },
      {
        name: 'Arte',
        icon: 'arte-icon.svg',
        subcategories: [
          { name: 'artes plásticas y visuales' },
          { name: 'bandas/músicos' },
          { name: 'canto/coros' },
          { name: 'casas de música' },
          { name: 'danza' },
          { name: 'escritura/libros/narración' },
          { name: 'fotografía' },
          { name: 'producción artística' },
          { name: 'tatuaje' },
          { name: 'teatro' },
        ],
      },
      {
        name: 'Artesanias y diseños',
        icon: 'artesanias-y-diseños.svg',
        subcategories: [
          { name: 'agendas/encuadernación' },
          { name: 'cerámica' },
          { name: 'cestería' },
          { name: 'insumos' },
          { name: 'joyería' },
          { name: 'manualidades' },
          { name: 'marroquinería' },
          { name: 'mates' },
          { name: 'mimbre' },
          { name: 'mosaiquismo' },
          { name: 'orfebrería' },
          { name: 'origami' },
          { name: 'paja vizcachera' },
          { name: 'papel maché' },
          { name: 'pintura' },
          { name: 'polifan' },
          { name: 'productos de diseño' },
          { name: 'productos regionales' },
          { name: 'sahumerios' },
          { name: 'sublimaciones' },
          { name: 'velas' },
          { name: 'vitrofusión' },
          { name: 'yute' },
        ],
      },

      {
        name: 'Costuras y Tejidos',
        icon: 'costuras-y-tejidos.svg',
        subcategories: [
          { name: 'almohadones/fundas/cortinas' },
          { name: 'alquiler de vestidos/trajes' },
          { name: 'alta costura' },
          { name: 'arreglos/modista' },
          { name: 'bordados' },
          { name: 'compostura de calzado' },
          { name: 'economía circular/ferias' },
          { name: 'insumos/hilados/lanas/mercería' },
          { name: 'lencería' },
          { name: 'macramé' },
          { name: 'prendas y accesorios' },
          { name: 'reparación de máquinas de coser' },
          { name: 'tapicería' },
          { name: 'tejidos' },
          { name: 'telar' },
          { name: 'uniformes para empresa' },
        ],
      },
      {
        name: 'Cuidado Personal',
        icon: 'cuidado-personal.svg',
        subcategories: [
          { name: 'cosmetología' },
          { name: 'espacios' },
          { name: 'manicuria/pedicuria' },
          { name: 'productos' },
        ],
      },
      {
        name: 'Cuidados a domicilio',
        icon: 'cuidados-a-domicilio.svg',
        subcategories: [
          { name: 'botón antipánico' },
          { name: 'emergencias médicas' },
          { name: 'enfermería' },
          { name: 'higiene personal' },
          { name: 'laboratorio' },
          { name: 'manicuria' },
          { name: 'masajes' },
          { name: 'pedicuria' },
          { name: 'peluquería' },
          { name: 'podología' },
          { name: 'trámites' },
          { name: 'traslados' },
        ],
      },
      {
        name: 'Fiestas y eventos',
        icon: 'fiestas-y-eventos.svg',
        subcategories: [
          { name: 'alquiler de insumos' },
          { name: 'ambientación' },
          { name: 'animación' },
          { name: 'catering' },
          { name: 'dj' },
          { name: 'ferias artesanales' },
          { name: 'food truck' },
          { name: 'fotografía' },
          { name: 'globos personalizados' },
          { name: 'iluminación' },
          { name: 'quintas' },
          { name: 'salones' },
          { name: 'seguridad' },
          { name: 'videos' },
          { name: 'wedding planner' },
        ],
      },
      {
        name: 'Hogar',
        icon: 'hogar.svg',
        subcategories: [
          { name: 'afilador' },
          { name: 'alambrador' },
          { name: 'alarmas/cámaras/monitoreo' },
          { name: 'albañil' },
          { name: 'atmosférico' },
          { name: 'baños químicos' },
          { name: 'burletes' },
          { name: 'calefacción/refrigeración' },
          { name: 'carpinterías' },
          { name: 'casillas' },
          { name: 'cerrajero' },
          { name: 'cestos de residuos' },
          { name: 'containers/palas/sampi' },
          { name: 'deshollinador' },
          { name: 'desinfección/control de plagas' },
          { name: 'destapa cañerías/conductos' },
          { name: 'durlero' },
          { name: 'ecoconstrucción' },
          { name: 'electricistas' },
          { name: 'electrodomésticos' },
          { name: 'energía y medio ambiente' },
          { name: 'filtros de agua' },
          { name: 'gasistas/plomeros' },
          { name: 'gestión de residuos' },
          { name: 'herrerías' },
          { name: 'impermeabilización' },
          { name: 'insumos' },
          { name: 'jardineria/poda' },
          { name: 'limpieza de alfombras/tapizados' },
          { name: 'limpieza final de obra' },
          { name: 'mantenimiento en general' },
          { name: 'mesas/bancos cemento' },
          { name: 'perforaciones' },
          { name: 'piletas' },
          { name: 'pintor' },
          { name: 'riego' },
          { name: 'techista' },
          { name: 'transporte y logística' },
          { name: 'vidrieria' },
          { name: 'yesero' },
          { name: 'zingueria' },
        ],
      },
      {
        name: 'Jardin y Plantas',
        icon: 'jardin-y-plantas.svg',
        subcategories: [
          { name: 'compostaje' },
          { name: 'florerías' },
          { name: 'gestión de residuos' },
          { name: 'jardineria/poda' },
          { name: 'paisajismo' },
          { name: 'permacultura' },
          { name: 'plantas/vivero' },
        ],
      },
      {
        name: 'Marketing e Informatica',
        icon: 'marketing-e-informatica.svg',
        subcategories: [
          { name: 'community manager' },
          { name: 'desarrollador' },
          { name: 'diseñador gráfico' },
          { name: 'marketing' },
          { name: 'servicio técnico' },
        ],
      },
      {
        name: 'Mascotas',
        icon: 'mascotas.svg',
        subcategories: [
          { name: 'cafés pet friendly' },
          { name: 'castraciones' },
          { name: 'guarderías' },
          { name: 'hospedajes pet friendly' },
          { name: 'insumos' },
          { name: 'obra social de mascotas' },
          { name: 'paseos' },
          { name: 'refugios' },
          { name: 'urgencias' },
          { name: 'vacunaciones' },
        ],
      },
      {
        name: 'Mundo Infantil',
        icon: 'mundo-infantil.svg',
        subcategories: [
          { name: 'accesorios' },
          { name: 'actividad física' },
          { name: 'animacion de fiestas' },
          { name: 'bolsa de juguetes' },
          { name: 'disfraces' },
          { name: 'espacios de festejos' },
          { name: 'guarderías' },
          { name: 'idiomas' },
          { name: 'inflables' },
          { name: 'juguetes' },
          { name: 'masaje thai' },
          { name: 'matronatación' },
          { name: 'muebles' },
          { name: 'narraciones' },
          { name: 'talleres' },
          { name: 'titiriteros' },
          { name: 'uniformes' },
        ],
      },
      {
        name: 'Salud',
        icon: 'salud.svg',
        subcategories: [
          { name: 'cosmiatria' },
          { name: 'farmacias' },
          { name: 'fisiatría' },
          { name: 'gerontología' },
          { name: 'nginecología' },
          { name: 'homeopatía' },
          { name: 'kinesiología' },
          { name: 'medicina funcional' },
          { name: 'nutricionistas' },
          { name: 'osteopatía' },
          { name: 'quiropraxia' },
          { name: 'suplementos' },
        ],
      },
      {
        name: 'Terapias y Alternativas',
        icon: 'terapias-y-alternativas.svg',
        subcategories: [
          { name: 'acupuntura' },
          { name: 'astrología' },
          { name: 'biodanza' },
          { name: 'biodescodificación' },
          { name: 'constelaciones' },
          { name: 'equinoterapia' },
          { name: 'fitoterapia' },
          { name: 'flores de Bach' },
          { name: 'fonoestética' },
          { name: 'masoterapia' },
          { name: 'péndulo hebreo' },
          { name: 'reiki' },
          { name: 'spa' },
          { name: 'tarot' },
          { name: 'terapia celular' },
        ],
      },
      {
        name: 'Vida Activa',
        icon: 'vida-activa.svg',
        subcategories: [
          { name: 'aquagim' },
          { name: 'calistenia' },
          { name: 'escalada' },
          { name: 'eutonía' },
          { name: 'gimnasios' },
          { name: 'insumos' },
          { name: 'kayac/canotaje/remo' },
          { name: 'pesca' },
          { name: 'pilates' },
          { name: 'recreación' },
          { name: 'reparación bicis' },
          { name: 'running' },
          { name: 'salto' },
          { name: 'taichi' },
          { name: 'travesías/ciclismo' },
          { name: 'trekking' },
          { name: 'yoga' },
        ],
      },
      {
        name: 'Clases',
        icon: 'clases.svg',
      },
      {
        name: 'Vida Nocturna',
      },
      {
        name: '24Hs',
      },
      {
        name: 'Domingos',
      },
    ];

    const defaultEstablishments = [
      {
        name: 'Brandi',
        address: 'Calle 123',
        description:
          'Brandi es una empresa de tecnología que ofrece soluciones innovadoras para mejorar la experiencia de los usuarios.',
        avatar: 'Screenshot from 2025-10-17 13-01-23.png',
        isComplete: true,
        verified: true,
        latitude: '-36.89136217536246',
        longitude: '-60.328559258424605',
        email: 'brandi@brandi.com',
        instagram: 'brandi',
        facebook: 'brandi',
        website: 'brandi.com',
        phone: '123456789',
        images: [
          {
            fileName: 'Screenshot from 2025-10-17 13-02-49.png',
          },
          {
            fileName: 'Screenshot from 2025-10-17 13-03-00.png',
          },
          {
            fileName: 'Screenshot from 2025-10-17 13-03-16.png',
          },
          {
            fileName: 'Screenshot from 2025-10-17 13-03-27.png',
          },
          {
            fileName: 'Screenshot from 2025-10-17 13-03-54.png',
          },
        ],
      },
    ];

    // for (const category of defaultCategories) {
    //   this.logger.debug(`creating default category ${category.name} if it does not exist`);
    //   const categoryExists = await this.categoryRepository.findOneBy({ name: category.name });

    //   if (!categoryExists) {
    //     await this.categoryRepository.save(category);
    //   } else {
    //     await this.categoryRepository.delete(categoryExists.id);
    //     await this.categoryRepository.save(category);
    //   }
    // }

    // for (const establishment of defaultEstablishments) {
    //   this.logger.debug(`creating default establishment ${establishment.name} if it does not exist`);
    //   const establishmentExists = await this.establishmentRepository.findOneBy({ name: establishment.name });

    //   if (!establishmentExists) {
    //     await this.establishmentRepository.save(establishment);
    //   }
    // }
  }
}
