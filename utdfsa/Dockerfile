FROM  node:22-alpine AS base



WORKDIR /app

COPY package*.json ./

RUN npm ci 

COPY ./ ./ 

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public



ENV PORT=4400
#ENV HOSTNAME=0.0.0.0
EXPOSE 4400
CMD ["node", "server.js"]
