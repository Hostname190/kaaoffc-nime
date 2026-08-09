const BASE_URL = "https://www.sankavollerei.com/anime/donghua";

const fetchDonghuaApi = async (path: string) => {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate: 600 },
    });
    
    if (!res.ok) {
        throw new Error(`API returned status: ${res.status}`);
    }
    const data = await res.json();
    
    if (data.status !== "success" && !Array.isArray(data) && !data) {
        throw new Error("Invalid response from Donghua API");
    }
    
    return data;
  } catch (error) {
    console.error("Donghua fetchApi error", error);
    throw error;
  }
};

export const getDonghuaHome = async () => {
  const data = await fetchDonghuaApi("/home/1");
  
  const recentList = (data.latest_release || []).map((item: any) => ({
    title: item.title,
    poster: item.poster,
    episodes: (item.current_episode || "").replace(/Ep\s*/i, "").trim(),
    releasedOn: "Baru",
    animeId: item.slug,
    href: `/watch?url=${item.slug}&source=donghua`,
    type: "episode"
  }));

  const completedList = (data.completed_donghua || []).map((item: any) => ({
    title: item.title,
    poster: item.poster,
    episodes: "END",
    releasedOn: "Tamat",
    animeId: item.slug,
    href: `/detail?url=${item.slug}&source=donghua`,
    type: "series"
  }));

  return {
    recent: recentList,
    completed: completedList
  };
};

export const searchDonghua = async (query: string) => {
  const data = await fetchDonghuaApi(`/search/${encodeURIComponent(query)}`);
  
  // The search API might return a list directly or under a 'search' key, we assume it's the root array or data.search
  const list = Array.isArray(data) ? data : (data.search || data.data || []);
  
  return list.map((item: any) => ({
    title: item.title,
    poster: item.poster,
    status: item.status,
    rating: item.rating,
    animeId: item.slug,
    href: `/detail?url=${item.slug}&source=donghua`
  }));
};

export const getDonghuaDetail = async (slug: string) => {
  const data = await fetchDonghuaApi(`/detail/${slug}`);
  const raw = data;

  return {
    title: raw.title,
    poster: raw.poster,
    status: raw.status,
    rating: raw.rating,
    releasedOn: raw.released,
    studio: raw.studio,
    season: raw.season,
    totalEpisodes: raw.total_episodes || raw.total_episode || raw.episodes,
    network: raw.network,
    country: raw.country,
    duration: raw.duration,
    updatedOn: raw.updated,
    synopsis: raw.synopsis,
    genres: raw.genres || [],
    episodes: (raw.episodes_list || []).map((ep: any) => ({
      title: ep.episode,
      episodeId: ep.slug,
      date: "",
      href: `/watch?url=${ep.slug}&source=donghua`
    }))
  };
};

export const getDonghuaEpisode = async (episodeId: string) => {
  const data = await fetchDonghuaApi(`/episode/${episodeId}`);
  const raw = data;
  const details = raw.donghua_details || {};

  const serverList = (raw.streaming?.servers || []).map((s: any) => ({
      title: s.name,
      url: s.url 
  }));

  if (raw.streaming?.main_url) {
      serverList.unshift({
          title: raw.streaming.main_url.name,
          url: raw.streaming.main_url.url
      });
  }

  const downloadLinks: any[] = [];
  if (raw.download_url) {
    for (const [resolution, links] of Object.entries(raw.download_url)) {
      const formattedRes = resolution.replace('download_url_', '').toUpperCase();
      const serverLinks = Object.entries(links as Record<string, string>).map(([name, url]) => ({ name, url }));
      if (serverLinks.length > 0) {
        downloadLinks.push({ resolution: formattedRes, links: serverLinks });
      }
    }
  }

  return {
    title: raw.episode,
    animeId: details.slug,
    poster: details.poster,
    releasedOn: details.released,
    servers: serverList,
    downloads: downloadLinks,
    defaultStreamingUrl: raw.streaming?.main_url?.url || "",
    prevEpisode: raw.navigation?.previous_episode ? raw.navigation.previous_episode.slug : null,
    nextEpisode: raw.navigation?.next_episode ? raw.navigation.next_episode.slug : null,
  };
};

export const getDonghuaOngoing = async (page: number | string = 1) => {
  const data = await fetchDonghuaApi(`/ongoing/${page}`);
  const list = data.ongoing_donghua || data.data || [];
  
  return list.map((item: any) => ({
    title: item.title,
    poster: item.poster,
    status: item.status,
    animeId: item.slug,
    href: `/detail?url=${item.slug}&source=donghua`
  }));
};

export const getDonghuaCompleted = async (page: number | string = 1) => {
  const data = await fetchDonghuaApi(`/completed/${page}`);
  const list = data.completed_donghua || data.data || [];
  
  return list.map((item: any) => ({
    title: item.title,
    poster: item.poster,
    status: item.status,
    animeId: item.slug,
    href: `/detail?url=${item.slug}&source=donghua`
  }));
};

export const getDonghuaSchedule = async () => {
  const data = await fetchDonghuaApi("/schedule");
  const list = Array.isArray(data) ? data : (data.schedule || data.data || []);
  
  const dayMap: Record<string, string> = {
    'Sunday': 'Minggu', 'Monday': 'Senin', 'Tuesday': 'Selasa',
    'Wednesday': 'Rabu', 'Thursday': 'Kamis', 'Friday': 'Jumat', 'Saturday': 'Sabtu'
  };
  
  return list.map((d: any) => ({
    day: dayMap[d.day] || d.day,
    animeList: (d.donghua_list || []).map((item: any) => ({
      title: item.title,
      poster: item.poster,
      estimation: item.release_time || "",
      animeId: item.slug,
      href: `/detail?url=${item.slug}&source=donghua`
    }))
  }));
};

export const getDonghuaGenres = async () => {
  const data = await fetchDonghuaApi("/genres");
  const list = data.data || [];
  
  return list.map((item: any) => ({
    title: item.name,
    genreId: item.slug
  }));
};

export const getDonghuaByGenre = async (slug: string, page: number | string = 1) => {
  const data = await fetchDonghuaApi(`/genres/${slug}/${page}`);
  const list = data.donghua_list || data.data || [];
  
  return list.map((item: any) => ({
    title: item.title,
    poster: item.poster,
    status: item.status,
    animeId: item.slug,
    href: `/detail?url=${item.slug}&source=donghua`
  }));
};

export const getDonghuaAzList = async (letter: string, page: number | string = 1) => {
  const data = await fetchDonghuaApi(`/az-list/${letter}/${page}`);
  const list = data.donghua_list || data.data || [];
  
  return list.map((item: any) => ({
    title: item.title,
    poster: item.poster,
    status: item.status,
    animeId: item.slug,
    href: `/detail?url=${item.slug}&source=donghua`
  }));
};
