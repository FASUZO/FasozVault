# ============================================
# FasozVault - Docker 多阶段构建配置
# ============================================

# ------------ Stage 1: Build ------------
FROM node:18-alpine AS builder

# 设置构建参数
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

# 设置工作目录
WORKDIR /app

# 安装构建依赖（Vite 构建不需要额外工具）
# 如果需要编译 native 模块，可以取消下面的注释
# RUN apk add --no-cache python3 make g++

# 复制依赖清单（利用 Docker 缓存层）
COPY package*.json ./

# 安装全部依赖（含 devDeps，用于构建）
# 使用 npm install 确保 devDependencies 被安装
# 注意：不要设置 NODE_ENV=production，否则 devDependencies 不会被安装
RUN npm install --no-audit && \
    npm cache clean --force

# 复制源代码（排除在 .dockerignore 中的文件）
COPY . .

# 前端构建
RUN npm run build

# 验证构建输出
RUN test -d dist && \
    test -f dist/index.html && \
    test -d dist/pages && \
    test -f dist/pages/assets.html && \
    echo "✓ Build successful: dist, index.html, pages directory and assets.html all exist"

# ------------ Stage 2: Runtime ------------
FROM node:18-alpine AS runtime

# 设置构建参数（需要在 FROM 后重新声明）
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

# 添加元数据标签
LABEL maintainer="FasozVault Team" \
      org.opencontainers.image.title="FasozVault" \
      org.opencontainers.image.description="个人资产管理系统" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/FASUZO/FasozVault"

# 设置工作目录
WORKDIR /app

# 复制依赖清单
COPY package*.json ./

# 安装生产依赖（合并命令减少层数，优化缓存清理）
RUN npm ci --omit=dev --no-audit && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# 从构建阶段复制运行所需文件
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist

# 创建数据目录
RUN mkdir -p /app/data/uploads

# 暴露端口
EXPOSE 3000

# 健康检查（优化超时时间）
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/env', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# 启动命令
CMD ["node", "server/server.js"]
