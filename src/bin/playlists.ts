import { raise } from "../common.ts";
import * as yaml from "../yaml.ts";
import { setPlaylist } from "../youtube.ts";

const catalogueData = yaml.load("catalogue.yaml") as Array<{
  handle: string;
  id: string;
  videos?: Record<
    string,
    {
      title: string;
      type: "public" | "members" | "removed" | "unlisted";
      duration: number;
      published: string;
    }
  >;
}>;
yaml.dump("catalogue.yaml", catalogueData);

const campaignData = yaml.load("campaigns.yaml") as Array<{
  season: string;
  from: string;
  "sort by"?: "oldest" | `${string}=>${string}`;
  debut: string;
  cast?: string;
  world?: string;
  videos: Array<{
    trailer?: string;
    episode?: string;
    animation?: string;
    bts?: string;
    special?: string;
    external?: string;
    public?: string;
    "public parts"?: Array<string>;
    members?: string;
    dropout?: string;
    published?: string;
    duration?: number;
  }>;
}>;
yaml.dump("campaigns.yaml", campaignData);

const playlistData = yaml.load("playlists.yaml") as Array<{
  name: string;
  id?: string;
  description: string;
  include: {
    from: "Dimension 20";
    world?: string;
    cast?: string;
    season?: string | Array<string>;
    type: Array<
      "episode" | "special" | "trailer" | "bts" | "animation" | "external"
    >;
    version: Array<"public" | "members">;
  };
  videos: Array<Record<string, string>>;
}>;
yaml.dump("playlist.yaml", playlistData);

let playlistMd =
  "# [Playlists](https://www.youtube.com/@actualplaylists/playlists?view=1)\n\n";

const allVideos = ({} as (typeof catalogueData)[0]["videos"])!;
for (const channel of catalogueData) {
  for (const [key, value] of Object.entries(channel.videos ?? {})) {
    allVideos[key] = value;
  }
}

for (const playlist of playlistData) {
  let seconds = 0;

  if (!playlist.id) {
    break;
  }

  const videos: Array<{
    id: string;
    title: string;
  }> = [];

  for (const campaign of campaignData) {
    for (const video of campaign.videos) {
      const type = video.animation
        ? "animation"
        : video.episode
        ? "episode"
        : video.special
        ? "special"
        : video.bts
        ? "bts"
        : video.trailer
        ? "trailer"
        : video.external
        ? "external"
        : raise("missing type for", video);
      const title =
        video.episode ??
        video.animation ??
        video.special ??
        video.bts ??
        video.trailer ??
        video.external ??
        raise("missing title for", video);
      const id =
        video.public ??
        video["public parts"] ??
        video.members ??
        raise("missing video for", video);

      if (
        playlist.include.season &&
        !(playlist.include.season.includes
          ? playlist.include.season.includes(campaign.season)
          : playlist.include.season == campaign.season)
      ) {
        continue;
      }

      if (playlist.include.world && playlist.include.world != campaign.world) {
        continue;
      }

      if (playlist.include.cast && playlist.include.cast != campaign.cast) {
        continue;
      }

      if (playlist.include.from && playlist.include.from != campaign.from) {
        continue;
      }

      if (playlist.include.type && !playlist.include.type.includes(type)) {
        continue;
      }

      if (
        playlist.include.version &&
        !playlist.include.version.includes("members") &&
        !(video.public || video["public parts"])
      ) {
        continue;
      }

      const catalogueInfo = allVideos[typeof id === "string" ? id : id[0]];
      if (!catalogueInfo) {
        console.debug(
          `Campaign includes video not found in catalogue: ${JSON.stringify(
            video
          )}`
        );
      } else {
        seconds += catalogueInfo.duration;
        video.published ??= catalogueInfo.published;
        video.duration ??= catalogueInfo.duration;
      }

      if (typeof id == "string") {
        videos.push({ id, title });
      } else {
        for (const one_id of id) {
          videos.push({ id: one_id, title });
        }
      }
    }

    // TODO: loop over every source video to find the minimum date and use that
    if (campaign["sort by"] === "oldest") {
      campaign.videos?.sort((a, b) => {
        if ((a.published ?? "9999-99-99") < (b.published ?? "9999-99-99")) {
          return -1;
        } else if (
          (a.published ?? "9999-99-99") > (b.published ?? "9999-99-99")
        ) {
          return +1;
        } else if ((a.episode ?? "") > (b.episode ?? "")) {
          return -1;
        } else if ((a.episode ?? "") < (b.episode ?? "")) {
          return +1;
        } else {
          return 0;
        }
      });
    }

    yaml.dump("campaigns.yaml", campaignData);
  }

  playlist.videos = videos.map(({ id, title }) => ({ [id]: title }));
  yaml.dump("playlists.yaml", playlistData);

  const hours = String((seconds / 60 / 60) | 0);
  const minutesPart = String((seconds / 60) % 60 | 0);
  const secondsPart = String(seconds % 60 | 0);
  const duration = `${hours}:${minutesPart}:${secondsPart}`;

  const replacements = {
    d20blurb:
      "Dimension 20 is an Actual Play TTRPG series from CollegeHumor/Dropout, featuring original campaigns of Dungeons and Dragons and other tabletop role-playing systems.",
    hours,
    duration,
  };

  let title = playlist.name;

  let description = playlist.description;
  for (const [key, value] of Object.entries(replacements)) {
    description = description.replaceAll("${" + key + "}", value);
    title = title.replaceAll("${" + key + "}", value);
  }

  console.log(title, description);

  playlistMd += `## [${title}](https://www.youtube.com/playlist?list=${
    playlist.id
  })

> ${description.trim().replaceAll("\n", "\n> ")}

`;

  for (const video of videos) {
    playlistMd += `- [${video.title}](https://www.youtube.com/watch?v=${video.id}&list=${playlist.id})\n`;
  }

  playlistMd += "\n";

  await setPlaylist(
    playlist.id,
    title,
    description,
    videos.map((v) => v.id)
  );
}

Deno.writeTextFileSync("playlists.md", playlistMd);
yaml.dump("campaigns.yaml", campaignData);
