# ESP32 como Beacon iBeacon

Firmware para convertir un ESP32 en beacon BLE compatible con APlat Presence.

## Requisitos

- ESP32 (DevKit, NodeMCU-32S, etc.)
- Arduino IDE o PlatformIO
- Biblioteca BLE para ESP32 (Arduino ESP32 core)

## UUID, Major y Minor

Antes de flashear, defina estos valores (los usará al registrar el beacon en APlat):

- **UUID**: Ej. `E2C56DB5-DFFB-48D2-B060-D0F5A71096E0`
- **Major**: 0-65535 (ej. 1 para Recepción, 2 para Sala 1)
- **Minor**: 0-65535 (ej. 1)

## Instalación (Arduino IDE)

1. Instale el core ESP32: `arduino-cli core install esp32:esp32`
2. Copie `esp32-beacon.ino` a una carpeta `esp32-beacon/`
3. Edite `BEACON_UUID`, `BEACON_MAJOR`, `BEACON_MINOR`
4. Conecte el ESP32 por USB
5. Seleccione placa ESP32 Dev Module y puerto
6. Suba el sketch

## Instalación (PlatformIO)

```bash
cd hardware/esp32-beacon
pio run -t upload
```

## Uso

Tras flashear, el ESP32 emitirá anuncios iBeacon continuamente. Colóquelo en la zona deseada (recepción, sala, etc.) y regístrelo en APlat Dashboard → Presence → Beacons BLE con el mismo UUID, Major y Minor.

Los visitantes podrán hacer check-in al detectar el beacon con la PWA (Chrome Android) o una app que escanee BLE.

## Consumo

En modo beacon, el ESP32 consume ~80-100 mA. Con batería 2000 mAh dura ~20-24 horas. Recomendado: alimentación USB o toma de corriente.
