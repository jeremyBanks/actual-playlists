// deno-lint-ignore-file no-explicit-any
import { Innertube } from "../../YouTube.js/deno.ts";
import { setParserErrorHandler } from "../../YouTube.js/deno/src/parser/parser.ts";
import PlaylistVideo from "../../YouTube.js/deno/src/parser/classes/PlaylistVideo.ts";
import { miliseconds, raise } from "./common.ts";
import * as dotenv from "https://deno.land/std@0.201.0/dotenv/mod.ts";

setParserErrorHandler(() => {});

const env = await dotenv.load();

export const youtubeiReader = await Innertube.create({
  cookie: env["READER_COOKIE"] || raise("missing READER_COOKIE"),
  retrieve_player: false,
  fetch: async (req: any, opts: any) => {
    let sleep = Math.round(1000 + 7500 * (Math.random() + Math.random()));
    await miliseconds(sleep);

    const before = Date.now();
    const response = await fetch(req, opts);
    const duration = Date.now() - before;

    console.log(
      response.status,
      response.url,
      `${duration}ms after sleeping ${sleep}ms`,
    );

    return response;
  },
});

export const youtubeiWriter = await Innertube.create({
  cookie: env["WRITER_COOKIE"] || raise("missing WRITER_COOKIE"),
  retrieve_player: false,
  fetch: async (req: any, opts: any) => {
    let sleep = Math.round(1000 + 7500 * (Math.random() + Math.random()));
    await miliseconds(sleep);

    const before = Date.now();
    const response = await fetch(req, opts);
    const duration = Date.now() - before;

    console.log(
      response.status,
      response.url,
      `${duration}ms after sleeping ${sleep}ms`,
    );

    return response;
  },
});

export const setPlaylist = async (
  playlistId: string,
  title: string,
  description: string,
  videoIds: Array<string>,
) => {
  console.log("Publishing", videoIds.length, "videos to", playlistId);

  let pi = await youtubeiWriter.getPlaylist(playlistId);
  const all = pi.items.map((item) => (item as PlaylistVideo).id);
  while (pi.has_continuation) {
    pi = await pi.getContinuation();
    all.push(...pi.items.map((item) => (item as PlaylistVideo).id));
  }

  console.log(`Found ${all.length} existing entries in playlist.`);

  if (pi.info.title?.trim() !== title.trim()) {
    console.log(
      `Playlist title / name is out-of-date, updating it (from ${
        JSON.stringify(
          pi.info.title,
        )
      } to ${JSON.stringify(title)}})...`,
    );
    const response = await youtubeiWriter.playlist.setName(playlistId, title);
    console.debug(response);
  } else {
    console.log("Title is still up-to-date");
  }

  if (
    description.trim() &&
    pi.info.description?.trim() !== description.trim()
  ) {
    console.log(
      `Playlist description is out-of-date, updating it (from ${
        JSON.stringify(
          pi.info.description,
        )
      } to ${JSON.stringify(description)}})...`,
    );
    const response = await youtubeiWriter.playlist.setDescription(
      playlistId,
      description,
    );
    console.debug(response);
  }

  if (all.toString() === videoIds.toString()) {
    console.log("Playlist is already up-to-date!");
  } else {
    console.log("Replacing with intended playlist contents.");

    try {
      const toRemove = [...all];
      const toAdd = [...videoIds];

      let leaving = 0;
      while (toRemove.length > 0 && toRemove[0] === toAdd[0]) {
        leaving += 1;
        toRemove.shift();
        toAdd.shift();
      }
      console.log(
        `Leaving ${leaving} videos in-place, removing ${toRemove.length} and adding ${toAdd.length}.`,
      );

      if (toRemove.length) {
        await youtubeiWriter.playlist.removeVideos(playlistId, toRemove);
      }
      if (toAdd.length) {
        await youtubeiWriter.playlist.addVideos(playlistId, toAdd);
      }
    } catch (error) {
      console.error(error, "\n" + JSON.stringify(videoIds));
    }
  }
};
