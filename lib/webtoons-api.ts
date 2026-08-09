import axios from "axios";
import * as cheerio from "cheerio";

const WEBTOONS_BASE = "https://www.webtoons.com";
const CORS_PROXY = "https://cors.siputzx.my.id/";

const fetchHtml = async (path: string) => {
  let url = path.startsWith('http') ? path : `${WEBTOONS_BASE}${path}`;
  url = `${CORS_PROXY}${url}`;
  
  try {
    const res = await axios.get(url, {
      timeout: 25000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      },
      validateStatus: () => true,
    });
    if (res.status !== 200 || typeof res.data !== "string") {
      throw new Error(`HTTP ${res.status} dari ${url}`);
    }
    return res.data;
  } catch (error) {
    console.error("fetchHtml error", error);
    throw error;
  }
};

const titleNoFromUrl = (url: string) => {
  const m = String(url).match(/[?&]title_no=(\d+)/);
  return m ? Number(m[1]) : null;
};

export const searchWebtoons = async (query: string, limit: number = 20) => {
  const html = await fetchHtml(`/id/search?keyword=${encodeURIComponent(query)}`);
  const $ = cheerio.load(html);
  const items: any[] = [];
  
  $("a[href*='/list?title_no=']").each((_, el) => {
    if (items.length >= limit) return false;
    const $a = $(el);
    const href = $a.attr("href") ?? "";
    if (!href) return;
    const absUrl = href.startsWith("http") ? href : `${WEBTOONS_BASE}${href}`;
    const titleNo = titleNoFromUrl(absUrl);
    if (!titleNo) return;
    const title =
      $a.find("strong.title, .info_text .title, p.subj, .subj").first().text().trim() ||
      $a.attr("title")?.trim() || "";
    const author =
      $a.find(".info_text .author, div.author, .author, .by").first().text().trim();
    const thumb = $a.find("img").first().attr("src") ?? null;
    const isCanvas = absUrl.includes("/canvas/");
    const genreMatch = absUrl.match(/\/id\/([^/]+)\/[^/]+\/list/);
    const genre = !isCanvas && genreMatch ? genreMatch[1] : null;
    items.push({
      titleNo, title, author: author || null, thumbnail: thumb, genre,
      section: isCanvas ? "canvas" : "originals",
      url: absUrl.split("&webtoon-platform-redirect")[0],
    });
  });
  
  const seen = new Set();
  const unique = items.filter((it) => {
    const key = `${it.section}:${it.titleNo}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return {
    query, count: unique.length,
    originals: unique.filter((i) => i.section === "originals"),
    canvas: unique.filter((i) => i.section === "canvas"),
    items: unique,
  };
};

export const parseDetail = ($: cheerio.CheerioAPI, sourceUrl: string) => {
  const title = $("h1.subj, h3.subj, .info .subj").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") || null;
  let author = $(".author_area, .ly_creator_in .author, .author").first().text().trim() || null;
  if (author) author = author.replace(/Informasi Kreator/gi, "").trim();

  const synopsis = $("p.summary, .detail_body .summary").first().text().trim() ||
    $('meta[property="og:description"]').attr("content") || null;
  const genre = $("h2.genre, p.genre").first().text().trim() || null;
  
  let day = $("p.day_info, .day_info").first().text().replace(/\s+/g, " ").trim() || null;
  if (day) day = day.replace(/UPUpdate/gi, "Update").replace(/UP\s*Update/gi, "Update").replace(/^UP\s*/gi, "").trim();

  const status = /completed|tamat|selesai/i.test(day ?? "") ? "COMPLETED" : /(every|setiap|UP|Update)/i.test(day ?? "") ? "ONGOING" : null;
  const ratingText = $("em#_starScoreAverage, .grade_area .grade_num").first().text().trim() || null;
  const rating = ratingText ? parseFloat(ratingText) || null : null;
  const subscribers = $(".grade_area em.cnt, .subscribe em.cnt").first().text().trim() || null;
  
  let thumbnail = $(".detail_header .thmb img, .detail_bg img").first().attr("src") ||
    $('meta[property="og:image"]').attr("content") || null;
  if (thumbnail && thumbnail.startsWith("//")) thumbnail = "https:" + thumbnail;
  
  return {
    titleNo: titleNoFromUrl(sourceUrl),
    title, author, synopsis, genre, day, status, rating, subscribers, thumbnail,
    url: sourceUrl,
  };
};

export const getDetail = async (url: string) => {
  const html = await fetchHtml(url);
  return parseDetail(cheerio.load(html), url);
};

export const getEpisodes = async (url: string, page = 1) => {
  const sep = url.includes("?") ? "&" : "?";
  const fullUrl = `${url}${sep}page=${page}`;
  const html = await fetchHtml(fullUrl);
  const $ = cheerio.load(html);
  const list: any[] = [];
  
  $("#_listUl > li, ul#_listUl > li").each((_, el) => {
    const $li = $(el);
    const $a = $li.find("a").first();
    const href = $a.attr("href") ?? "";
    if (!href) return;
    const epUrl = href.startsWith("http") ? href : `${WEBTOONS_BASE}${href}`;
    const epNo = Number($li.attr("data-episode-no")) || Number(epUrl.match(/episode_no=(\d+)/)?.[1]) || null;
    const epTitle = $a.find(".subj span, .subj").first().text().trim() || $a.attr("title")?.trim() || "";
    const thumb = $a.find(".thmb img").first().attr("src") ?? null;
    const date = $a.find(".date").first().text().trim() || null;
    const likes = $li.find("em._likeitNumViewArea, .like_area em").first().text().trim() || null;
    list.push({ episodeNo: epNo, title: epTitle, thumbnail: thumb, date, likes, url: epUrl });
  });
  
  let totalPages = page;
  $("div.paginate a, .paginate a").each((_, el) => {
    const t = Number($(el).text().trim());
    if (Number.isFinite(t) && t > totalPages) totalPages = t;
  });
  
  const meta = parseDetail($, url);
  return { ...meta, page, totalPages, hasNext: page < totalPages, count: list.length, episodesList: list };
};

export const getTrending = async (day: string) => {
  const d = (day || "daily").toLowerCase();
  const path = d === "daily" || d === "trending"
    ? "/id/dailySchedule"
    : d === "completed" ? "/id/originals/completed" : `/id/originals/${d}`;
  const sourceUrl = `${WEBTOONS_BASE}${path}`;
  const html = await fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const items: any[] = [];
  
  $("a[href*='/list?title_no=']").each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href") ?? "";
    if (!href) return;
    const absUrl = href.startsWith("http") ? href : `${WEBTOONS_BASE}${href}`;
    const titleNo = titleNoFromUrl(absUrl);
    if (!titleNo) return;
    const title = $a.find(".subj, p.subj").first().text().trim() || $a.attr("title")?.trim() || "";
    const thumb = $a.find("img").first().attr("src") ?? null;
    const genreMatch = absUrl.match(/\/id\/([^/]+)\/[^/]+\/list/);
    const genre = genreMatch && genreMatch[1] !== "canvas" ? genreMatch[1] : null;
    const likes = $a.find(".grade_area em, .like_area em, .grade_num").first().text().trim() || null;
    items.push({
      titleNo, title, thumbnail: thumb, genre, likes,
      url: absUrl.split("&webtoon-platform-redirect")[0],
    });
  });
  
  const seen = new Set();
  const unique = items.filter((it) => {
    if (seen.has(it.titleNo)) return false;
    seen.add(it.titleNo);
    return true;
  });
  
  return { day: d, sourceUrl, count: unique.length, items: unique };
};

export const getEpisodeImages = async (url: string) => {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const images: string[] = [];
  
  $("#_imageList img").each((_, el) => {
    const src = $(el).attr("data-url") || $(el).attr("src");
    if (src) images.push(src);
  });
  
  return images;
};
