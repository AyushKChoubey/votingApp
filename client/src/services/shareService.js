import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

/**
 * Professional Booth Sharing Service.
 * Formats a clear invitation with booth name, invite code, and join link.
 * Uses Capacitor's native share sheet on Android/iOS, Web Share API on supported browsers,
 * and falls back to copying the join link to the clipboard.
 */
export async function shareBooth({ boothName, inviteCode, inviteLink }) {
  const code = String(inviteCode || "").toUpperCase();
  const name = boothName ? `"${boothName}"` : "VoteBooth";
  const title = `Invitation to Vote: ${boothName || "VoteBooth"}`;
  const link = inviteLink || `${window.location.origin}/booth/join/${code}`;

  const text = `You're invited to cast your vote in ${name} on VoteBooth!\n\nInvite Code: ${code}\nJoin Link: ${link}`;

  // 1. Capacitor Native Share on Android & iOS
  if (Capacitor.isNativePlatform()) {
    try {
      const canShare = await Share.canShare().catch(() => ({ value: true }));
      if (canShare.value) {
        await Share.share({
          title,
          text,
          url: link,
          dialogTitle: `Share ${boothName || "Booth"}`,
        });
        return { success: true, method: "native" };
      }
    } catch (err) {
      if (
        err.name === "AbortError" ||
        err.message?.includes("canceled") ||
        err.message?.includes("cancelled")
      ) {
        return { success: false, canceled: true };
      }
      console.warn("Capacitor Share failed, falling back to web share / clipboard", err);
    }
  }

  // 2. Web Share API
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: link,
      });
      return { success: true, method: "web-share" };
    } catch (err) {
      if (err.name === "AbortError") {
        return { success: false, canceled: true };
      }
      console.warn("navigator.share failed, copying to clipboard", err);
    }
  }

  // 3. Fallback: Copy link to clipboard
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(link);
    return { success: true, method: "clipboard", link };
  }

  return { success: false, error: "Sharing not supported" };
}
