FROM registry.access.redhat.com/ubi9 AS ubi
ENV TZ=Europe/London
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime &&\
    echo $TZ > /etc/timezone

FROM quay.io/keycloak/keycloak:latest as build

WORKDIR /opt/keycloak

RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:latest
COPY --from=build /opt/keycloak/ /opt/keycloak/
COPY --from=ubi /etc/timezone /etc/timezone

ENV KEYCLOAK_ADMIN=admin
ENV KEYCLOAK_ADMIN_PASSWORD=password

#COPY realm-data /opt/keycloak/data/import

EXPOSE 8080

CMD start-dev --import-realm --optimized