import { generateKeyPairSync } from "crypto";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

const toEnvValue = (key) => key.replace(/\n/g, "\\n");

console.log("AUTH_PUBLIC_KEY=");
console.log(toEnvValue(publicKey));
console.log("\nAUTH_PRIVATE_KEY=");
console.log(toEnvValue(privateKey));
