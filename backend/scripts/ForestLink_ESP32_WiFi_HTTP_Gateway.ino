/**
 * ForestLink ESP32-S3 Gateway -> RForce HTTP Uplink
 * 
 * Hardware:
 * - ESP32-S3 Dev Module
 * - SX1278 LoRa Module (433MHz)
 * - WiFi or Cellular SIM800L
 * 
 * Description:
 * Listens for incoming LoRa packets from forest nodes, extracts the
 * payload and GPS, and sends an HTTP POST JSON request directly to the
 * RForce API endpoint: http://<your-ip>:5000/api/gateway/lora/ingest.
 * RForce then runs the AI volunteer ranking algorithm to auto-assign
 * nearest volunteers to the GPS coordinates.
 */

#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ===== CONFIGURATION =====
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Target RForce Server URL
const char* rforce_endpoint = "http://192.168.1.100:5000/api/gateway/lora/ingest";

// LoRa Pins (ESP32-S3)
#define SCK     12
#define MISO    13
#define MOSI    11
#define SS      10
#define RST     14
#define DIO0    2

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("🌲 ForestLink -> RForce Gateway Uplink Initializing...");

  // 1. Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());

  // 2. Initialize LoRa SX1278
  SPI.begin(SCK, MISO, MOSI, SS);
  LoRa.setPins(SS, RST, DIO0);

  if (!LoRa.begin(433E6)) {
    Serial.println("LoRa initialization failed!");
  } else {
    Serial.println("LoRa SX1278 433MHz Listening for Mesh Packets...");
  }
}

void forwardToRForce(String rawPacket, int rssi, float snr) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(rforce_endpoint);
    http.addHeader("Content-Type", "application/json");

    // Construct JSON Payload
    String jsonPayload = "{";
    jsonPayload += "\"source\":\"esp32_gateway\",";
    jsonPayload += "\"message\":\"" + rawPacket + "\",";
    jsonPayload += "\"rssi\":" + String(rssi) + ",";
    jsonPayload += "\"snr\":" + String(snr, 2);
    jsonPayload += "}";

    Serial.println(">> Sending to RForce: " + jsonPayload);

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("<< Response (" + String(httpResponseCode) + "): " + response);
    } else {
      Serial.println("HTTP Error: " + String(httpResponseCode));
    }
    http.end();
  }
}

void loop() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String incoming = "";
    while (LoRa.available()) {
      incoming += (char)LoRa.read();
    }

    int rssi = LoRa.packetRssi();
    float snr = LoRa.packetSnr();

    Serial.println("\n📡 [LoRa RX] Received (" + String(packetSize) + " bytes): " + incoming);
    Serial.println("   Signal: RSSI " + String(rssi) + " dBm | SNR " + String(snr) + " dB");

    // Forward to RForce server
    forwardToRForce(incoming, rssi, snr);
  }
}
