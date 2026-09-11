export async function fetchArray<T>(url: string, signal: AbortSignal): Promise<T[]> {
  const response = await fetch(url, { signal });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('서버 응답을 읽을 수 없습니다. 잠시 후 다시 시도해주세요.');
  }
  if (!response.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : '정보를 불러오지 못했습니다.');
  }
  if (!Array.isArray(data)) throw new Error('서버에서 올바르지 않은 정보를 받았습니다.');
  return data as T[];
}
