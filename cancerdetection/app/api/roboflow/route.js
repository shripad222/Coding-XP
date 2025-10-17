import axios from "axios";

const ROBOFLOW_URL = "https://serverless.roboflow.com/skin-cancer-detection-wfldq/3";
const API_KEY = process.env.ROBOFLOW_API_KEY || "Z6cRdCP8kc5SSspbR4VA";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    const response = await axios({
      method: "POST",
      url: ROBOFLOW_URL,
      params: { api_key: API_KEY },
      data: base64Image,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 30000,
    });

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Roboflow error:", e?.response?.data || e.message || e);
    return new Response(JSON.stringify({ error: e?.message || "Roboflow request failed" }), { status: 500 });
  }
}
