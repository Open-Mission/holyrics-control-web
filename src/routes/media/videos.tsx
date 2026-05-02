import { createFileRoute } from '@tanstack/react-router'

import { MediaExplorer } from '@/components/media/media-explorer'

export const Route = createFileRoute('/media/videos')({
  component: MediaVideosPage,
})

// eslint-disable-next-line react-refresh/only-export-components
function MediaVideosPage() {
  return <MediaExplorer mediaType="video" />
}
