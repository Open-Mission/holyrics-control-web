import {
  type GetApiV1Schedules200ItemLyricsPlaylistItem,
  type GetApiV1Schedules200ItemMediaPlaylistItem,
  usePostApiV1MediasPlayAudio,
  usePostApiV1MediasPlayVideo,
  usePostApiV1MediasShowImage,
  usePostApiV1SchedulesShow,
} from '@/api/generated'
import {
  AlertCircle,
  Book,
  FileText,
  Image as ImageIcon,
  LoaderIcon,
  Mic2,
  Music,
  Play,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'

import { openPanelForSong } from '@/hooks/use-presentation-store'
import { MusicItemCard } from '@/components/songs/music-item-card'

type ScheduleItem = GetApiV1Schedules200ItemLyricsPlaylistItem | GetApiV1Schedules200ItemMediaPlaylistItem
type SongLookup = Map<string, { [key: string]: unknown }>

interface ServiceItemProps {
  item: ScheduleItem
  songLookup?: SongLookup
}

function readString(source: { [key: string]: unknown } | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = source?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function readNumber(source: { [key: string]: unknown } | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = source?.[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

export function ServiceItem({ item, songLookup }: ServiceItemProps) {
  const showScheduleItem = usePostApiV1SchedulesShow()
  const playVideo = usePostApiV1MediasPlayVideo()
  const playAudio = usePostApiV1MediasPlayAudio()
  const showImage = usePostApiV1MediasShowImage()

  const song = item.song_id ? songLookup?.get(item.song_id) : undefined

  const handleShow = async () => {
    const id = item.id || item.song_id
    if (!id) return

    try {
      if (item.song_id || item.type === 'song' || item.type === 'lyrics' || item.type === 'verse') {
        openPanelForSong({
          id: item.song_id,
          title: item.name || readString(song, 'title') || 'Música',
          artist: item.artist || readString(song, 'artist', 'author'),
          group: readString(song, 'group'),
          key: readString(item, 'key') || readString(song, 'key'),
          bpm: readNumber(song, 'bpm'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      } else if (item.type === 'video') {
        await playVideo.mutateAsync({ data: { id } })
      } else if (item.type === 'audio') {
        await playAudio.mutateAsync({ data: { id } })
      } else if (item.type === 'image') {
        await showImage.mutateAsync({ data: { id } })
      } else {
        await showScheduleItem.mutateAsync({
          data: {
            id: item.id,
            type: item.type,
            song_id: item.song_id,
            index: item.index,
          },
        })
      }

      if (!item.song_id && item.type !== 'song') {
        toast.success(`Apresentando: ${item.name || 'Item'}`)
      }
    } catch (error: unknown) {
      console.error('Show error:', error)
      toast.error(
        `Erro ao apresentar item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }

  const getIcon = () => {
    switch (item.type) {
      case 'song':
      case 'lyrics':
      case 'verse':
        return <Mic2 />
      case 'bible':
        return <Book />
      case 'image':
        return <ImageIcon />
      case 'video':
      case 'audio':
        return <Video />
      case 'text':
        return <FileText />
      case 'announcement':
        return <AlertCircle />
      default:
        return <Music />
    }
  }

  const getTypeLabel = () => {
    switch (item.type) {
      case 'song':
      case 'lyrics':
      case 'verse':
        return 'Música'
      case 'bible':
        return 'Bíblia'
      case 'image':
        return 'Imagem'
      case 'video':
        return 'Vídeo'
      case 'audio':
        return 'Áudio'
      case 'text':
        return 'Texto'
      case 'announcement':
        return 'Aviso'
      case 'presentation':
        return 'Apresentação'
      case 'media':
        return 'Mídia'
      default:
        return item.type || 'Item'
    }
  }

  const isSongLike =
    item.song_id || item.type === 'song' || item.type === 'lyrics' || item.type === 'verse'
  const subtitle = item.artist || readString(song, 'artist', 'author')
  const musicMetadata = [
    readString(item, 'key') || readString(song, 'key') ? `Tom ${readString(item, 'key') || readString(song, 'key')}` : null,
    readNumber(song, 'bpm') ? `${readNumber(song, 'bpm')} BPM` : null,
    readString(song, 'group') || readString(item, 'group', 'group_name'),
  ].filter((value): value is string => Boolean(value))

  const defaultMetadata = [getTypeLabel()].filter(Boolean)

  const isPending =
    showScheduleItem.isPending || playVideo.isPending || playAudio.isPending || showImage.isPending

  return (
    <MusicItemCard
      title={item.name || readString(song, 'title') || 'Sem nome'}
      subtitle={subtitle}
      metadata={isSongLike ? musicMetadata : defaultMetadata}
      leading={getIcon()}
      trailing={isPending ? <LoaderIcon className="size-4 animate-spin" /> : <Play className="size-4" />}
      active={Boolean(item.active)}
      onClick={handleShow}
    />
  )
}
