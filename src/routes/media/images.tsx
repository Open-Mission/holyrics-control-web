import { createFileRoute } from '@tanstack/react-router'

import { MediaExplorer } from '@/components/media/media-explorer'

export const Route = createFileRoute('/media/images')({
  component: MediaImagesPage,
})

// eslint-disable-next-line react-refresh/only-export-components
function MediaImagesPage() {
  return <MediaExplorer mediaType="image" />
}
