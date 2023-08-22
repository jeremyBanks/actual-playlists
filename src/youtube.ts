import { Innertube } from "https://cdn.jsdelivr.net/gh/jeremyBanks/YouTube.js@b0ed2d4/deno.ts";
import PlaylistVideo from "https://cdn.jsdelivr.net/gh/jeremyBanks/YouTube.js@b0ed2d4/deno/src/parser/classes/PlaylistVideo.ts";

export const youtubei = await Innertube.create({
  cookie: (localStorage.youtubeCookie =
    Deno.env.get("YOUTUBE_COOKIE") ?? localStorage.youtubeCookie),
  on_behalf_of_user: (localStorage.onBehalfOfUser =
    Deno.env.get("ON_BEHALF_OF_USER") ?? localStorage.onBehalfOfUser),
  retrieve_player: false,
  fetch: async (req: any, opts: any) => {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 2048));

    const response = await fetch(req, opts);

    console.log(response.status, response.url);

    return response;
  },
});

export const youtubeiDefaultUser = await Innertube.create({
  cookie: (localStorage.youtubeCookie =
    Deno.env.get("YOUTUBE_COOKIE") ?? localStorage.youtubeCookie),
  retrieve_player: false,
  fetch: async (req: any, opts: any) => {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 2048));

    const response = await fetch(req, opts);

    console.log(response.status, response.url);

    return response;
  },
});