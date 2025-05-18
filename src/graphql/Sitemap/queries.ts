import {gql} from 'apollo-server-express';

export const queries = gql`
  type Query {
    getSitemaps: SitemapsDataResponse
    getSitemap(sitemapIndex: String!, sitemapType: String!): SingleSitemapDataResponse
  }
`;
