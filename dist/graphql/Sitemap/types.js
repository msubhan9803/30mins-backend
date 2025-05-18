import { gql } from 'apollo-server-express';
export const types = gql `
  
  type SingleSitemap {
    content: String
    index: String
  }

  type SitemapGroup {
    _id: String
    sitemaps: [SingleSitemap]
  }

type SingleSitemapDataResponse {
  response: Response
  sitemap: SingleSitemap
}

type SitemapsDataResponse {
  response: Response
  groups: [SitemapGroup]
}

`;
//# sourceMappingURL=types.js.map