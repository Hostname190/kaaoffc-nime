import axios from "axios";

const MANGADEX_BASE = "https://api.mangadex.org";
const UPLOADS_BASE = "https://uploads.mangadex.org";

const fetchApi = async (path: string) => {
  try {
    const res = await axios.get(`${MANGADEX_BASE}${path}`, {
      timeout: 15000,
    });
    return res.data;
  } catch (error) {
    console.error("MangaDex fetchApi error", error);
    throw error;
  }
};

const getCoverUrl = (mangaId: string, coverFileName: string) => {
  if (!coverFileName) return null;
  return `${UPLOADS_BASE}/covers/${mangaId}/${coverFileName}`;
};

const extractMangaData = (manga: any) => {
  const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || "Unknown Title";
  const authorRel = manga.relationships.find((r: any) => r.type === "author");
  const author = authorRel?.attributes?.name || null;
  
  const coverRel = manga.relationships.find((r: any) => r.type === "cover_art");
  const coverFileName = coverRel?.attributes?.fileName || null;
  const thumbnail = getCoverUrl(manga.id, coverFileName);

  const descObj = manga.attributes.description || {};
  const synopsis = descObj.id || descObj.en || Object.values(descObj)[0] || "";

  const tags = manga.attributes.tags.map((t: any) => t.attributes.name.en);
  const genre = tags.length > 0 ? tags[0] : null;

  return {
    titleNo: manga.id,
    title,
    author,
    thumbnail,
    synopsis,
    genre,
    status: manga.attributes.status,
    url: `mangadex:${manga.id}`,
    source: "mangadex"
  };
};

export const searchMangaDex = async (query: string, limit: number = 20) => {
  const data = await fetchApi(`/manga?title=${encodeURIComponent(query)}&limit=${limit}&includes[]=cover_art&includes[]=author`);
  const items = data.data.map((manga: any) => {
    const extracted = extractMangaData(manga);
    return {
      ...extracted,
      section: "mangadex"
    };
  });
  
  return {
    query,
    count: data.total,
    items
  };
};

export const getTrendingMangaDex = async () => {
  // Fetch popular manga by sorting by followedCount
  const data = await fetchApi(`/manga?includes[]=cover_art&includes[]=author&order[followedCount]=desc&limit=15&hasAvailableChapters=true`);
  
  const items = data.data.map(extractMangaData);
  
  return {
    day: "trending",
    sourceUrl: "mangadex",
    count: items.length,
    items
  };
};

export const getMangaDexDetail = async (id: string) => {
  const data = await fetchApi(`/manga/${id}?includes[]=cover_art&includes[]=author`);
  return extractMangaData(data.data);
};

export const getMangaDexEpisodes = async (id: string, page: number = 1) => {
  const limit = 100;
  const offset = (page - 1) * limit;
  
  const mangaDetail = await getMangaDexDetail(id);
  
  // Fetch chapters in Indonesian
  const data = await fetchApi(`/manga/${id}/feed?translatedLanguage[]=id&order[chapter]=desc&includes[]=scanlation_group&limit=${limit}&offset=${offset}`);
  
  const list = data.data.map((chap: any) => {
    const groupRel = chap.relationships.find((r: any) => r.type === "scanlation_group");
    const groupName = groupRel?.attributes?.name || "Unknown Group";
    
    let title = `Chapter ${chap.attributes.chapter || '?'}`;
    if (chap.attributes.title) {
      title += `: ${chap.attributes.title}`;
    }
    
    return {
      episodeNo: chap.attributes.chapter || chap.id,
      title,
      thumbnail: mangaDetail.thumbnail, // Chapters usually don't have individual thumbnails in MangaDex
      date: new Date(chap.attributes.publishAt).toLocaleDateString('id-ID'),
      likes: groupName, // Repurposing likes to show scanlation group
      url: `mangadex:${chap.id}`
    };
  });
  
  const totalPages = Math.ceil(data.total / limit);
  
  return {
    ...mangaDetail,
    page,
    totalPages,
    hasNext: offset + limit < data.total,
    count: data.total,
    episodesList: list
  };
};

export const getMangaDexChapterImages = async (chapterId: string) => {
  const data = await fetchApi(`/at-home/server/${chapterId}`);
  const baseUrl = data.baseUrl;
  const hash = data.chapter.hash;
  const images = data.chapter.data.map((filename: string) => `${baseUrl}/data/${hash}/${filename}`);
  
  return images;
};
