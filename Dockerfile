# Usa la imagen base de Node.js
FROM node:18

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia el archivo package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install -g @nestjs/cli
RUN npm install

# Copia el resto del código del proyecto
COPY . .

# Expone el puerto que usará la aplicación
EXPOSE 4001

# Comando para iniciar la aplicación
CMD ["npm", "run", "start:proddocker"]
