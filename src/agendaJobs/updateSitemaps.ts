import Agenda from 'agenda';
import {create} from 'xmlbuilder2';

import User from '../MongoModels/User';
import Organization from '../MongoModels/Organization';
import Service from '../MongoModels/Service';
import Sitemap from '../MongoModels/Sitemap';
import {SITEMAP_TYPES} from '../constants/enums';
import dayjs from 'dayjs';
import axios from 'axios';

export default async function updateSitemaps(agenda: Agenda) {
  agenda.define('updateSitemaps', async (job, done) => {
    const hexCharList = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ];

    for (const hexChar of hexCharList) {
      const currentUserSitemap = await Sitemap.findOne({
        index: hexChar,
        sitemapType: SITEMAP_TYPES.PROFILES,
      });
      const currentOrganizationSitemap = await Sitemap.findOne({
        index: hexChar,
        sitemapType: SITEMAP_TYPES.ORGANIZATIONS,
      });
      const currentServiceSitemap = await Sitemap.findOne({
        index: hexChar,
        sitemapType: SITEMAP_TYPES.SERVICES,
      });

      // Build the profiles sitemap
      const users = await User.aggregate([
        {
          $project: {
            _id: 1,
            lastCharID: {$substr: [{$toString: '$_id'}, 23, 1]},
            accountDetails: {
              username: 1,
            },
          },
        },
        {
          $match: {
            lastCharID: hexChar,
          },
        },
      ]);
      if (users.length > 0) {
        const doc = create({version: '1.0'}).ele('urlset', {
          xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
          'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1',
        });

        for (const user of users) {
          doc
            .root()
            .ele('url')
            .ele('loc')
            .txt(`https://30mins.com/${user.accountDetails.username}`)
            .up()
            .ele('lastmod')
            .txt(user.updatedAt ? user.updatedAt : dayjs('10-01-2022').toISOString());
        }
        const encoded = Buffer.from(doc.end({prettyPrint: true}), 'utf8').toString('base64');

        if (currentUserSitemap === null) {
          await Sitemap.create({
            sitemapType: SITEMAP_TYPES.PROFILES,
            index: hexChar,
            content: encoded,
            isChanged: false,
          });
        } else {
          await Sitemap.findByIdAndUpdate(currentUserSitemap._id, {
            content: encoded,
            isChanged: true,
          });
        }
      }

      // Build the organizations sitemap
      const organizations = await Organization.aggregate([
        {
          $project: {
            _id: 1,
            lastCharID: {$substr: [{$toString: '$_id'}, 23, 1]},
            slug: 1,
          },
        },
        {
          $match: {
            lastCharID: hexChar,
          },
        },
      ]);
      if (organizations.length > 0) {
        const doc = create({version: '1.0'}).ele('urlset', {
          xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
          'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1',
        });

        for (const organization of organizations) {
          doc
            .root()
            .ele('url')
            .ele('loc')
            .txt(`https://30mins.com/org/${organization.slug}`)
            .up()
            .ele('lastmod')
            .txt(
              organization.updatedAt ? organization.updatedAt : dayjs('10-01-2022').toISOString()
            );
        }
        const encoded = Buffer.from(doc.end({prettyPrint: true}), 'utf8').toString('base64');

        if (currentOrganizationSitemap === null) {
          await Sitemap.create({
            sitemapType: SITEMAP_TYPES.ORGANIZATIONS,
            index: hexChar,
            content: encoded,
            isChanged: false,
          });
        } else {
          await Sitemap.findByIdAndUpdate(currentOrganizationSitemap._id, {
            content: encoded,
            isChanged: true,
          });
        }
      }

      // Build the services sitemap
      const services = await Service.aggregate([
        {
          $project: {
            _id: 1,
            lastCharID: {$substr: [{$toString: '$_id'}, 23, 1]},
            slug: 1,
          },
        },
        {
          $match: {
            lastCharID: hexChar,
          },
        },
      ]);
      if (services.length > 0) {
        const doc = create({version: '1.0'}).ele('urlset', {
          xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
          'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1',
        });

        for (const service of services) {
          doc
            .root()
            .ele('url')
            .ele('loc')
            .txt(`https://30mins.com/${service.slug}`)
            .up()
            .ele('lastmod')
            .txt(service.updatedAt ? service.updatedAt : dayjs('10-01-2022').toISOString());
        }
        const encoded = Buffer.from(doc.end({prettyPrint: true}), 'utf8').toString('base64');

        if (currentServiceSitemap === null) {
          await Sitemap.create({
            sitemapType: SITEMAP_TYPES.SERVICES,
            index: hexChar,
            content: encoded,
            isChanged: false,
          });
        } else {
          await Sitemap.findByIdAndUpdate(currentServiceSitemap._id, {
            content: encoded,
            isChanged: true,
          });
        }
      }
    }

    if (process.env.NODE_ENV === 'production') {
      await axios.get(`https://www.google.com/ping?sitemap=https://30mins.com/sitemap-index.xml`);
    }

    done();
  });
}
