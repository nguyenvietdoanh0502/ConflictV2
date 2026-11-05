import test from "node:test";
import assert from "node:assert/strict";
import {
  generateIdentityKeyPair,
  exportPublicKeySpki,
  importPublicKeySpki,
  wrapPrivateKey,
  unwrapPrivateKey,
  deriveConversationKey,
  encryptText,
  decryptText,
  isValidE2eePin,
  base64ToBytes,
  bytesToBase64,
} from "./e2eeCrypto.js";

test("isValidE2eePin chỉ chấp nhận mã PIN đúng 8 ký tự", () => {
  assert.equal(isValidE2eePin("12345678"), true);
  assert.equal(isValidE2eePin("Abc12345"), true);
  assert.equal(isValidE2eePin("1234567"), false);
  assert.equal(isValidE2eePin("123456789"), false);
  assert.equal(isValidE2eePin(""), false);
});

test("ECDH + HKDF + AES-GCM: hai phía giải mã được tin của nhau và của chính mình", async () => {
  const aliceId = "11111111-1111-1111-1111-111111111111";
  const bobId = "22222222-2222-2222-2222-222222222222";

  const aliceKp = await generateIdentityKeyPair();
  const bobKp = await generateIdentityKeyPair();

  const alicePubSpki = await exportPublicKeySpki(aliceKp.publicKey);
  const bobPubSpki = await exportPublicKeySpki(bobKp.publicKey);

  const aliceImportedBobPub = await importPublicKeySpki(bobPubSpki);
  const bobImportedAlicePub = await importPublicKeySpki(alicePubSpki);

  const aliceConvKey = await deriveConversationKey(
    aliceKp.privateKey,
    aliceImportedBobPub,
    {
      myUserId: aliceId,
      myKeyVersion: 1,
      peerUserId: bobId,
      peerKeyVersion: 2,
    }
  );

  const bobConvKey = await deriveConversationKey(
    bobKp.privateKey,
    bobImportedAlicePub,
    {
      myUserId: bobId,
      myKeyVersion: 2,
      peerUserId: aliceId,
      peerKeyVersion: 1,
    }
  );

  const message = "Chào bạn, chiều thứ 6 mình ôn tập môn An toàn thông tin nhé!";
  const encrypted = await encryptText(aliceConvKey, message, aliceId, bobId);

  // Bob giải mã
  const decryptedByBob = await decryptText(bobConvKey, {
    content: encrypted.content,
    iv: encrypted.iv,
    senderId: aliceId,
    recipientId: bobId,
  });
  assert.equal(decryptedByBob, message);

  // Alice đọc lại lịch sử tin nhắn chính mình gửi
  const decryptedByAlice = await decryptText(aliceConvKey, {
    content: encrypted.content,
    iv: encrypted.iv,
    senderId: aliceId,
    recipientId: bobId,
  });
  assert.equal(decryptedByAlice, message);
});

test("wrapPrivateKey & unwrapPrivateKey: sai PIN sẽ ném E2EE_WRONG_PIN", async () => {
  const kp = await generateIdentityKeyPair();
  const bundle = await wrapPrivateKey(kp.privateKey, "Pin8KyTu", 100_000);

  const unwrapped = await unwrapPrivateKey(bundle, "Pin8KyTu", false);
  assert.equal(unwrapped.extractable, false);

  await assert.rejects(
    () => unwrapPrivateKey(bundle, "SaiPin88", false),
    /E2EE_WRONG_PIN/
  );
});

test("AES-GCM phát hiện sửa đổi ciphertext hoặc đảo chiều người gửi/nhận (AAD)", async () => {
  const aliceId = "11111111-1111-1111-1111-111111111111";
  const bobId = "22222222-2222-2222-2222-222222222222";
  const kpA = await generateIdentityKeyPair();
  const kpB = await generateIdentityKeyPair();

  const convKey = await deriveConversationKey(kpA.privateKey, kpB.publicKey, {
    myUserId: aliceId,
    myKeyVersion: 1,
    peerUserId: bobId,
    peerKeyVersion: 1,
  });

  const encrypted = await encryptText(convKey, "Bí mật", aliceId, bobId);

  // Đảo sender và recipient -> sai AAD -> lỗi
  await assert.rejects(() =>
    decryptText(convKey, {
      content: encrypted.content,
      iv: encrypted.iv,
      senderId: bobId,
      recipientId: aliceId,
    })
  );

  // Sửa 1 byte trong ciphertext -> lỗi
  const raw = base64ToBytes(encrypted.content);
  raw[0] ^= 0xff;
  await assert.rejects(() =>
    decryptText(convKey, {
      content: bytesToBase64(raw),
      iv: encrypted.iv,
      senderId: aliceId,
      recipientId: bobId,
    })
  );
});

test("Tin nhắn tiếng Việt 2000 ký tự có kích thước ciphertext <= 8192", async () => {
  const aliceId = "11111111-1111-1111-1111-111111111111";
  const bobId = "22222222-2222-2222-2222-222222222222";
  const kpA = await generateIdentityKeyPair();
  const kpB = await generateIdentityKeyPair();
  const convKey = await deriveConversationKey(kpA.privateKey, kpB.publicKey, {
    myUserId: aliceId,
    myKeyVersion: 1,
    peerUserId: bobId,
    peerKeyVersion: 1,
  });

  const longText = "Đ".repeat(2000);
  const encrypted = await encryptText(convKey, longText, aliceId, bobId);
  assert.ok(encrypted.content.length <= 8192);
  const decrypted = await decryptText(convKey, {
    ...encrypted,
    senderId: aliceId,
    recipientId: bobId,
  });
  assert.equal(decrypted, longText);
});

