import Image from 'next/image'

export default function Avatar({ url, alt, size = 32 }: { url?: string | null; alt?: string; size?: number }) {
  const px = `${size}px`
  return (
    <span className="relative rounded-full overflow-hidden bg-gray-200 inline-flex items-center justify-center" style={{ width: px, height: px }}>
      {url ? (
        <Image src={url} alt={alt || 'Avatar'} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span className="w-full h-full inline-flex items-center justify-center text-xs text-gray-500">U</span>
      )}
    </span>
  )
}


