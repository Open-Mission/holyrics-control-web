import { Music, PlaySquare, Layers, Home } from "lucide-react"
import { useSongsStore } from "@/hooks/use-songs-store"
import { usePlaylistsStore } from "@/hooks/use-playlists-store"
import { MetricCard } from "@/components/design-system"

export function DashboardStats() {
  const { totalCount: songsCount, isLoading: songsLoading } = useSongsStore()
  const { totalCount: playlistsCount, isLoading: playlistsLoading } = usePlaylistsStore()

  const stats = [
    {
      title: "Músicas",
      value: songsLoading ? "..." : songsCount.toLocaleString(),
      description: "Total de músicas no banco local",
      icon: Music,
    },
    {
      title: "Playlists",
      value: playlistsLoading ? "..." : playlistsCount.toLocaleString(),
      description: "Listas de reprodução salvas",
      icon: PlaySquare,
    },
    {
      title: "Projeções",
      value: "Live",
      description: "Estado atual",
      icon: Layers,
    },
    {
      title: "Uptime",
      value: "99.9%",
      description: "Disponibilidade",
      icon: Home,
    },
  ]

  return (
    <div className="app-grid-auto">
      {stats.map((stat, index) => (
        <MetricCard
          key={stat.title}
          label={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
          tone={index === 0 ? "primary" : "neutral"}
        />
      ))}
    </div>
  )
}
