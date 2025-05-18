import Charity from '../../../../MongoModels/Charity';

export default async function getServiceCharity(parent, {charityQuery}, context, info) {
  try {
    const charities = await Charity.find({name: new RegExp(charityQuery, 'i')}).limit(10);

    return {
      charities,
      message: 'Slug Checked Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    if (err?._message === 'Charity validation failed') {
      return {
        message: err.message,
        status: 400,
      };
    }

    return {
      message: err.message,
      status: 500,
    };
  }
}
