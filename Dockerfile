# Usa la imagen base de Node.js 22
FROM node:24

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Instala pnpm manualmente
RUN npm install -g pnpm

# Copia los archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instala las dependencias con pnpm
RUN pnpm install --frozen-lockfile

# Copia el resto del código del proyecto
COPY . .

# Construye la aplicación
RUN pnpm run build

# Expone el puerto de la aplicación
EXPOSE 4003

# Comando para correr las migraciones y iniciar la aplicación
CMD ["pnpm", "start:prod"]
