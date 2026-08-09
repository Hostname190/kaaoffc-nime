const BASE_URL = "https://www.sankavollerei.com";

const fetchComicApi = async (path: string) => {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate: 600 },
    });
    
    if (!res.ok) {
        throw new Error(`API returned status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Comic fetchApi error", error);
    throw error;
  }
};

export const getComicHomepage = () => fetchComicApi("/comic/homepage");
export const getComicTerbaru = () => fetchComicApi("/comic/terbaru");
export const getComicPopuler = () => fetchComicApi("/comic/populer");
export const getComicTrending = () => fetchComicApi("/comic/trending");
export const searchComics = (query: string) => fetchComicApi(`/comic/search?q=${encodeURIComponent(query)}`);
export const getComicDetail = (slug: string) => fetchComicApi(`/comic/comic/${slug}`);
export const getComicChapter = (slug: string) => fetchComicApi(`/comic/chapter/${slug}`);
export const getComicChapterNavigation = (slug: string) => fetchComicApi(`/comic/chapter/${slug}/navigation`);
export const getComicList = (type: string, page: number = 1) => fetchComicApi(`/comic/type/${type}?page=${page}`);
