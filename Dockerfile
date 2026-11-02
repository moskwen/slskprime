FROM node:24-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85 AS build
WORKDIR /source/web
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY web/ ./
RUN pnpm exec semantic-ui-css-patch
ENV DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false
RUN pnpm run build
COPY LICENSE /source/web/build/LICENSE
COPY NOTICE /source/web/build/NOTICE
COPY third-party-licenses/ /source/web/build/third-party-licenses/

# This image exports a frontend; it does not connect to the Soulseek network.
FROM busybox:1.37@sha256:a7dbc319b1438115a207e11930dc4bb3e643dcb3ec0bdd694bb36cd8fad289ec
LABEL org.opencontainers.image.title="slskprime UI" \
      org.opencontainers.image.description="Independent modified web frontend based on slskd; not an official slskd release" \
      org.opencontainers.image.licenses="AGPL-3.0-only" \
      org.opencontainers.image.source="https://github.com/moskwen/slskprime"
COPY --from=build /source/web/build/ /ui/
CMD ["sh", "-c", "echo 'slskprime: modified web frontend, independent of slskd upstream'; cp -R /ui/. /out/"]
