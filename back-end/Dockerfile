FROM node:20-bullseye

# Instala yt-dlp e ffmpeg
RUN apt-get update && \
    apt-get install -y yt-dlp ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"] 