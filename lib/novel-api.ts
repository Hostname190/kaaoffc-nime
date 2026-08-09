const BASE_URL = "https://www.sankavollerei.com";

const fetchNovelApi = async (path: string) => {
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
    console.error("Novel fetchApi error", error);
    throw error;
  }
};

export const getNovelHome = () => fetchNovelApi("/novel/home");
export const getNovelHotSearch = () => fetchNovelApi("/novel/hot-search");
export const searchNovels = (query: string) => fetchNovelApi(`/novel/search?q=${encodeURIComponent(query)}`);
export const getNovelGenre = (id: string) => fetchNovelApi(`/novel/genre/${id}`);
export const getNovelChapters = (novelId: string) => fetchNovelApi(`/novel/chapters/${novelId}`);
