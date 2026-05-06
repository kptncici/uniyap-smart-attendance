import QRCode from "qrcode";

export const generateDataUrl = async (data) => {
  try {
    return await QRCode.toDataURL(data, { width: 512 });
  } catch (err) {
    console.error("❌ Error generate QR:", err);
    return null;
  }
};
