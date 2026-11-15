
import { AccessToken } from "livekit-server-sdk";

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("Missing LiveKit credentials in .env");
  process.exit(1);
}

const roomName = "claimly-dev";
const participantIdentity = "chert-connector";

const accessToken = new AccessToken(apiKey, apiSecret, {
  identity: participantIdentity,
  ttl: "30m",
});

accessToken.addGrant({
  roomJoin: true,
  room: roomName,
  canPublish: true,
  canSubscribe: true,
});

const token = await accessToken.toJwt();

console.log("Room:", roomName);
console.log("Participant:", participantIdentity);
console.log("\nTemporary room token:\n");
console.log(token);
console.log("\nExpires in 30 minutes.");
