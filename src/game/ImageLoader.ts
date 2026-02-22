// ════════════════════════════════════════════════════
//  ImageLoader.ts — 图片预加载系统
//  返回 Map<src, HTMLImageElement>，供 Canvas drawImage() 使用
//  React <img> 标签会自动复用浏览器缓存，无需额外处理
// ════════════════════════════════════════════════════

const SHIP_SOURCES = [
  '/ships/player-1.png',
  '/ships/player-2.png',
  '/ships/player-3.png',
  '/ships/player-4.png',
  '/ships/enemy-1.png',
  '/ships/enemy-2.png',
  '/ships/enemy-3.png',
  '/ships/enemy-4.png',
] as const

export type ImageMap = Map<string, HTMLImageElement>

/**
 * 并行加载所有战机图片
 * @param onProgress 每张图加载完后回调 (已加载数, 总数)
 */
export async function loadImages(
  onProgress?: (loaded: number, total: number) => void,
): Promise<ImageMap> {
  const total  = SHIP_SOURCES.length
  const images: ImageMap = new Map()
  let loaded = 0

  await Promise.all(
    SHIP_SOURCES.map(src =>
      new Promise<void>(resolve => {
        const img = new Image()
        const done = () => {
          images.set(src, img)
          loaded++
          onProgress?.(loaded, total)
          resolve()
        }
        img.onload  = done
        img.onerror = done   // 加载失败也继续，不阻塞游戏
        img.src = src
      }),
    ),
  )

  return images
}

/** 从 ImageMap 取出单张图（断言非空）*/
export function getImage(images: ImageMap, src: string): HTMLImageElement {
  const img = images.get(src)
  if (!img) throw new Error(`Image not loaded: ${src}`)
  return img
}
