import { createFileRoute } from '@tanstack/react-router'

import { MediaExplorer } from '@/components/media/media-explorer'

export const Route = createFileRoute('/media/audios')({
  component: MediaAudiosPage,
})

// eslint-disable-next-line react-refresh/only-export-components
function MediaAudiosPage() {
  return <MediaExplorer mediaType="audio" />
}
