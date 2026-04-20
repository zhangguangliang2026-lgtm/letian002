export async function generateImageDakka(
  apiKey: string,
  prompt: string,
  model: string,
  aspectRatio: string,
  imageSize: string
): Promise<string> {
  const initRes = await fetch("https://grsai.dakka.com.cn/v1/draw/nano-banana", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      prompt,
      aspectRatio,
      imageSize,
      webHook: "-1",
      shutProgress: true
    })
  });
  const initData = await initRes.json();
  if (initData.code !== 0) throw new Error(initData.msg || "Dakka API 请求失败");
  const taskId = initData.data?.id;
  if (!taskId) throw new Error("未能获取到任务ID");

  // polling
  while (true) {
    await new Promise(r => setTimeout(r, 4000));
    const res = await fetch("https://grsai.dakka.com.cn/v1/draw/result", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ id: taskId })
    });
    const resultData = await res.json();
    if (resultData.code !== 0) {
      if (resultData.code === -22) continue; // Task pending
      throw new Error(resultData.msg || "获取结果失败");
    }
    const status = resultData.data.status;
    if (status === "succeeded") {
       return resultData.data.results[0].url;
    } else if (status === "failed") {
       throw new Error(resultData.data.failure_reason || resultData.data.error || "生成失败");
    }
  }
}

export async function generateImageYijia(
  apiKey: string,
  prompt: string,
  model: string,
  aspectRatio: string
): Promise<string> {
  let size = "1920x1080";
  if (aspectRatio === "9:16") size = "1080x1920";
  else if (aspectRatio === "1:1") size = "1080x1080";
  else if (aspectRatio === "4:3") size = "1024x768";
  else if (aspectRatio === "3:4") size = "768x1024";

  const res = await fetch("https://api.yijiarj.cn/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
       prompt, model, size, image: []
    })
  });
  const data = await res.json();
  if (data.data && data.data[0] && data.data[0].b64_json) {
    return data.data[0].b64_json;
  }
  throw new Error("意佳 API 请求失败: " + JSON.stringify(data));
}
