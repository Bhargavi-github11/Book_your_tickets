const pemToArrayBuffer = (pem) => {
  const normalizedPem = String(pem || "").replace(/\\n/g, "\n");

  const base64 = normalizedPem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");

  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return bytes.buffer;
};

const arrayBufferToBase64 = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
};

const importPublicKey = async (publicKeyPem) => {
  const keyData = pemToArrayBuffer(publicKeyPem);

  return window.crypto.subtle.importKey(
    "spki",
    keyData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );
};

export const encryptPassword = async (password, publicKeyPem) => {
  if (!window?.crypto?.subtle) {
    throw new Error("Web Crypto API is not available");
  }

  const key = await importPublicKey(publicKeyPem);
  const encodedPassword = new TextEncoder().encode(String(password || ""));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    encodedPassword
  );

  return arrayBufferToBase64(encrypted);
};
