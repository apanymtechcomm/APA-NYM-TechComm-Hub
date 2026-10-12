import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'APA New York Metro Chapter Technology Committee — planners, technologists, and designers exploring the future of planning practice.',
  images: [
    {
      url: `${getServerSideURL()}/APA-NYM-TechComm-OG.png`,
    },
  ],
  siteName: 'APA NYM TechComm',
  title: 'APA NYM TechComm',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
