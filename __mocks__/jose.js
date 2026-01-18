const JOSEError = class extends Error {};
const JWEDecryptionFailed = class extends Error {};
const JWEInvalid = class extends Error {};
const JWKImportFailed = class extends Error {};
const JWKSInvalid = class extends Error {};
const JWKMultipleMatchingKeys = class extends Error {};
const JWKSNoMatchingKey = class extends Error {};
const JWSSignatureVerificationFailed = class extends Error {};
const JWSTimeInvalid = class extends Error {};
const JWSSignatureVerificationFailed1 = class extends Error {};
const JWSSignatureVerificationFailed2 = class extends Error {};

const compactDecrypt = jest.fn();
const decrypt = jest.fn();
const encrypt = jest.fn();
const sign = jest.fn();
const verify = jest.fn();
const signJWT = jest.fn();
const verifyJWT = jest.fn();
const jwtDecrypt = jest.fn();
const jwtVerify = jest.fn();
const base64url = {
  encode: jest.fn(),
  decode: jest.fn(),
};
const calculateJwkThumbprint = jest.fn();
const exportJWK = jest.fn();
const exportKey = jest.fn();
const exportPKCS8 = jest.fn();
const generateKeyPair = jest.fn();
const generateSecret = jest.fn();
const importJWK = jest.fn();
const importKey = jest.fn();
const importPKCS8 = jest.fn();
const importSPKI = jest.fn();
const importX509 = jest.fn();
const unwrapKey = jest.fn();
const FlattenedSign = { sign: jest.fn() };
const FlattenedDecrypt = { decrypt: jest.fn() };
const GeneralSign = { sign: jest.fn() };
const GeneralEncrypt = { encrypt: jest.fn() };
const GeneralDecrypt = { decrypt: jest.fn() };
const EmbeddedX509 = { certPEM: jest.fn() };
const KeyLike = { fromKeyObject: jest.fn() };

export {
  compactDecrypt,
  decrypt,
  encrypt,
  sign,
  verify,
  signJWT,
  verifyJWT,
  jwtDecrypt,
  jwtVerify,
  base64url,
  calculateJwkThumbprint,
  exportJWK,
  exportKey,
  exportPKCS8,
  generateKeyPair,
  generateSecret,
  importJWK,
  importKey,
  importPKCS8,
  importSPKI,
  importX509,
  unwrapKey,
  FlattenedSign,
  FlattenedDecrypt,
  GeneralSign,
  GeneralEncrypt,
  GeneralDecrypt,
  EmbeddedX509,
  KeyLike,
};

export const errors = {
  JOSEError,
  JWEDecryptionFailed,
  JWEInvalid,
  JWKImportFailed,
  JWKSInvalid,
  JWKMultipleMatchingKeys,
  JWKSNoMatchingKey,
  JWSSignatureVerificationFailed,
  JWSTimeInvalid,
  JWSSignatureVerificationFailed1,
  JWSSignatureVerificationFailed2,
};
