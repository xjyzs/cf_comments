import { DurableObject } from "cloudflare:workers";

export class KVStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.storage = ctx.storage;
  }

  async put(key, value) {
    await this.storage. put(key, value);
  }

  async get(key) {
    return await this.storage.get(key);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const id=url.searchParams.get("id");
    const kvId = env.KV_DO.idFromName("COMMENTS");
    const obj = env.KV_DO.get(kvId);

    const KV = {
      put: (key, value) => obj.put(key, value),
      get: (key) => obj.get(key),
    };
    let txt = "";

    if (req.method === "POST") {
      const formData = await req.formData();
      const txt = formData.get("txt") || "";
      if (!(txt.trim()==="")){
        let old = await KV.get(id);
        let newText = old ? old + "\n" + txt : txt;
        await KV.put(id, newText);
      }
      return new Response(`<meta http-equiv="refresh" content="0">`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    try {
      txt = await KV.get(id);
      txt =
        txt?.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") ??
        "暂无数据";
    } catch (_) {
      txt = "暂无数据";
    }

    return new Response(
      `<!DOCTYPE html><html lang="zh-cn"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>textarea{font-family:inherit;font-size:16px;background-color:inherit;}button{font-size:16px;}.btn{background-color:#6464644C;border:none;border-radius:8px;transition:transform 0.3s, background-color 0.5s;}.btn:hover{transform:translateY(-1.5px) scaleX(1.03);background-color:#9696964C;}#in{border-radius:8px;background-color:#E6E6E67F;transition:transform 0.3s, background-color 0.3s;}#in:hover{transform:translateY(-1.5px) scaleX(1.003);background-color:#D5D5D566;}</style></head><span style="font-size:26px;color: #888888">评论</span><form method="post"><div style="display:flex;"><textarea name="txt" rows="1" oninput="resizeTextarea(this)"style="flex:1; resize:none" id="in"></textarea><input type="submit"value="提交"style="align-self:stretch;height:auto;margin-left:4px;"class="btn"></div></form><textarea readonly style="width:100%;resize:none;border:none; outline:none;color: #888888" id='0'>${txt}</textarea><script>function resizeTextarea(textarea){textarea.style.height = 'auto';textarea.style.height = textarea.style.height = (textarea.scrollHeight) + 'px';}resizeTextarea(textarea = document.getElementById('0'));resizeTextarea(textarea = document.getElementById("in"))</script>`,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  },
};
