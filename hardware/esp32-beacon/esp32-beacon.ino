/*
 * GURU Presence — ESP32 como Beacon iBeacon
 * Emite anuncios BLE en formato iBeacon para check-in por proximidad.
 *
 * Requiere: Arduino ESP32 core
 * Librería: BLEAdvertisedDevice (incluida en ESP32 BLE)
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

// Configurar estos valores igual que en GURU Dashboard
#define BEACON_UUID "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0"
#define BEACON_MAJOR 1
#define BEACON_MINOR 1

BLEAdvertising *pAdvertising;

void setup() {
  Serial.begin(115200);
  BLEDevice::init("GuruBeacon");

  BLEServer *pServer = BLEDevice::createServer();
  pAdvertising = BLEDevice::getAdvertising();

  BLEBeacon oBeacon;
  oBeacon.setProximityUUID(BLEUUID(BEACON_UUID));
  oBeacon.setMajor(BEACON_MAJOR);
  oBeacon.setMinor(BEACON_MINOR);
  oBeacon.setSignalPower(-59);

  BLEAdvertisementData oAdvertisementData;
  BLEAdvertisementData oScanResponseData;
  oAdvertisementData.setFlags(0x04);
  oAdvertisementData.setManufacturerData(oBeacon.getData());

  pAdvertising->setAdvertisementData(oAdvertisementData);
  pAdvertising->setScanResponseData(oScanResponseData);

  Serial.println("Beacon iniciado");
  Serial.printf("UUID: %s\n", BEACON_UUID);
  Serial.printf("Major: %d, Minor: %d\n", BEACON_MAJOR, BEACON_MINOR);
}

void loop() {
  pAdvertising->start();
  delay(1000);
  pAdvertising->stop();
  delay(1000);
}
