FROM oven/bun:latest AS base

# Set working directory inside the container
WORKDIR /app

# 2. Copy package files first for efficient caching
COPY package.json bun.lock tsconfig.json ./

# 3. Install dependencies
RUN bun install

# 4. Copy application source
COPY . .

# 6. Expose the app port
EXPOSE 8080

# 7. Run the app
CMD ["bun", "run", "start"]
