FROM node:20-alpine

WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 5001

CMD ["npm", "start"]
